import { expect, test } from "@playwright/test";

const runLocalAuth = process.env.RUN_LOCAL_AUTH_E2E === "1";

test.describe("local passwordless authentication", () => {
  test.skip(
    !runLocalAuth,
    "Set RUN_LOCAL_AUTH_E2E=1 with the local Supabase stack running",
  );

  test("signs in from Mailpit and completes onboarding", async ({
    page,
    request,
  }) => {
    const unique = Date.now();
    const email = `collector-${unique}@example.test`;
    const username = `collector_${unique}`;

    await page.goto("/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page
      .getByRole("button", { name: /email me a sign-in link/i })
      .click();
    await expect(page.getByText(/check your inbox/i)).toBeVisible();
    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.some((cookie) => cookie.name.includes("code-verifier"));
      })
      .toBe(true);

    let messageId: string | undefined;
    await expect
      .poll(
        async () => {
          const response = await request.get(
            "http://127.0.0.1:54324/api/v1/messages",
          );
          const body = (await response.json()) as {
            messages?: Array<{
              ID: string;
              To?: Array<{ Address?: string }>;
            }>;
          };

          messageId = body.messages?.find((message) =>
            message.To?.some((recipient) => recipient.Address === email),
          )?.ID;
          return messageId;
        },
        { timeout: 10_000 },
      )
      .not.toBeUndefined();

    expect(messageId).toBeDefined();
    const messageResponse = await request.get(
      `http://127.0.0.1:54324/api/v1/message/${messageId}`,
    );
    const message = (await messageResponse.json()) as {
      HTML?: string;
      Text?: string;
    };
    const content = (message.HTML ?? message.Text ?? "").replaceAll(
      "&amp;",
      "&",
    );
    const confirmationUrl = content
      .match(/https?:\/\/[^\s"'<>]+/g)
      ?.find((url) => url.includes("/auth/v1/verify"));

    expect(confirmationUrl).toBeDefined();
    await page.goto(confirmationUrl!);
    await expect(page).toHaveURL(/\/onboarding(?:\?|$)/);
    await expect(
      page.getByRole("heading", { name: /name your crate/i }),
    ).toBeVisible();

    await page.getByLabel("Display name").fill("Local Collector");
    await page.getByLabel("Username").fill(username);
    await page.getByRole("button", { name: /open my crate/i }).click();

    await expect(page).toHaveURL(/\/collection$/);
    await expect(
      page.getByRole("heading", { name: "My collection" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /profile/i }).click();
    await page.getByLabel("Display name").fill("Local Crate Digger");
    await page
      .getByLabel("About your collection")
      .fill("Jazz discoveries and records with a story.");
    await page.getByLabel("Public profile").check();
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page.getByText("Your profile has been saved.")).toBeVisible();
    await expect(page.getByText("Public", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Display name")).toHaveValue(
      "Local Crate Digger",
    );
  });
});
