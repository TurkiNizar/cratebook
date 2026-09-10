import { expect, test } from "@playwright/test";

const runLocalAuth = process.env.RUN_LOCAL_AUTH_E2E === "1";

test.describe("local passwordless authentication", () => {
  test.skip(
    !runLocalAuth,
    "Set RUN_LOCAL_AUTH_E2E=1 with the local Supabase stack running",
  );

  test("signs in, completes onboarding, and adds and edits a manual record", async ({
    page,
    request,
  }, testInfo) => {
    const unique = `${Date.now()}-${testInfo.workerIndex}`;
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
    await expect(
      page.getByRole("heading", { name: "Your crate is waiting" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Add a record", exact: true }).click();
    await expect(page).toHaveURL(/\/add$/);
    await page.getByRole("link", { name: /add manually/i }).click();
    await expect(page).toHaveURL(/\/add\/manual$/);

    await page.getByLabel("Artist").fill("Nina Simone");
    await page.getByLabel("Album or release title").fill("Pastel Blues");
    await page.getByLabel("Format").selectOption("lp");
    await page.getByLabel("Number of discs").fill("1");
    await page.getByText("Edition details").click();
    await page.getByLabel("Original release year").fill("1965");
    await page.getByLabel("Label").fill("Philips");
    await page.getByRole("button", { name: /add to my collection/i }).click();

    await expect(page).toHaveURL(/\/collection\?added=[0-9a-f-]+$/);
    await expect(
      page.getByText(/pastel blues.*nina simone.*added to your collection/i),
    ).toBeVisible();
    const collection = page.getByRole("list", {
      name: "Records in your collection",
    });
    await expect(collection).toBeVisible();
    const record = collection.getByRole("article", { name: "Pastel Blues" });
    await expect(record.getByText("Nina Simone")).toBeVisible();
    await expect(record.getByText("LP")).toBeVisible();
    await expect(record.getByText("1965")).toBeVisible();
    await expect(record.getByText(/Philips/)).toBeVisible();

    await record.getByRole("link").click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+$/);
    await expect(
      page.getByRole("heading", { name: "Pastel Blues", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Nina Simone", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Edit record" }).click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\/edit$/);
    await expect(page.getByLabel("Artist")).toHaveValue("Nina Simone");
    await expect(page.getByLabel("Album or release title")).toHaveValue(
      "Pastel Blues",
    );
    await page.getByLabel("Album or release title").fill("Pastel Blues — Mono");
    await page.getByText("Edition details").click();
    await page.getByLabel("Catalog number").fill("PHS 600-187");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\?updated=1$/);
    await expect(
      page.getByText("Your changes to this record were saved."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Pastel Blues — Mono", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("PHS 600-187", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "My collection" }).click();
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toBeVisible();

    await page.goto("/collection/not-a-record-id");
    await expect(
      page.getByRole("heading", { name: "Record not found" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to my collection" }).click();

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
