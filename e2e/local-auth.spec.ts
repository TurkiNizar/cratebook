import { expect, type Page, test } from "@playwright/test";

const runLocalAuth = process.env.RUN_LOCAL_AUTH_E2E === "1";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );

    return documentWidth - document.documentElement.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("local passwordless authentication", () => {
  test.setTimeout(90_000);

  test.skip(
    !runLocalAuth,
    "Set RUN_LOCAL_AUTH_E2E=1 with the local Supabase stack running",
  );

  test("signs in, completes onboarding, and maintains and searches a collection", async ({
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
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Add a record", exact: true }).click();
    await expect(page).toHaveURL(/\/add$/);
    await page.getByRole("link", { name: /add manually/i }).click();
    await expect(page).toHaveURL(/\/add\/manual$/);
    await expectNoHorizontalOverflow(page);

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
    await page.getByRole("checkbox", { name: /Favorite/ }).check();
    await page.getByLabel("Personal rating").selectOption("5");
    await page.getByLabel("Bought as").selectOption("used");
    await page.getByLabel("Media condition").selectOption("near_mint");
    await page.getByLabel("Sleeve condition").selectOption("very_good_plus");
    await page.getByLabel("Acquisition date").fill("2026-09-10");
    await page.getByLabel("Acquired from").fill("Local record shop");
    await page.getByLabel("Price paid").fill("24.99");
    await page.getByLabel("Currency").fill("USD");
    await page.getByLabel("Tags").fill("Jazz, Sunday morning, jazz");
    await page
      .getByLabel("Personal notes or story")
      .fill("A late-night favorite.");
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
    await expect(page.getByText("★ Favorite")).toBeVisible();
    await expect(page.getByText("Near Mint (NM)")).toBeVisible();
    await expect(page.getByText("Very Good Plus (VG+)")).toBeVisible();
    await expect(page.getByText("Local record shop")).toBeVisible();
    await expect(page.getByText("$24.99")).toBeVisible();
    await expect(page.getByText("5 / 5")).toBeVisible();
    await expect(page.getByLabel("Tags")).toHaveText("JazzSunday morning");
    await expect(page.getByText("A late-night favorite.")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "My collection" }).click();
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article", { name: "Pastel Blues — Mono" })
        .getByLabel("Favorite"),
    ).toBeVisible();
    await expect(
      page
        .getByRole("article", { name: "Pastel Blues — Mono" })
        .getByLabel("Tags"),
    ).toHaveText("JazzSunday morning");

    await page
      .locator(".collection-toolbar")
      .getByRole("link", { name: "Add a record" })
      .click();
    await page.getByLabel("Artist").fill(" nina   simone ");
    await page.getByLabel("Album or release title").fill("PASTEL BLUES — MONO");
    await page.getByRole("button", { name: "Add to my collection" }).click();

    const duplicateWarning = page.getByRole("status");
    await expect(duplicateWarning).toContainText(
      "This may already be in your collection",
    );
    await expect(duplicateWarning).toContainText(
      "You already have 1 copy of Pastel Blues — Mono by Nina Simone",
    );
    await expect(
      duplicateWarning.getByRole("link", { name: "Review an existing copy" }),
    ).toHaveAttribute("href", /\/collection\/[0-9a-f-]+/);
    await expect(page.getByLabel("Artist")).toHaveValue(" nina   simone ");
    await page.getByRole("button", { name: "Add another copy" }).click();
    await expect(page).toHaveURL(/\/collection\?added=[0-9a-f-]+$/);
    const duplicateCopies = page.getByRole("article", {
      name: /Pastel Blues — Mono/i,
    });
    await expect(duplicateCopies).toHaveCount(2);

    await duplicateCopies.first().getByRole("link").click();
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toHaveCount(1);

    await page
      .locator(".collection-toolbar")
      .getByRole("link", { name: "Add a record" })
      .click();
    await expect(page).toHaveURL(/\/add\/manual$/);
    await page.getByLabel("Artist").fill("Sade");
    await page.getByLabel("Album or release title").fill("Diamond Life");
    await page.getByLabel("Format").selectOption("lp");
    await page.getByRole("button", { name: /add to my collection/i }).click();
    await expect(page).toHaveURL(/\/collection\?added=[0-9a-f-]+$/);

    await page.locator(".collection-filter-panel > summary").click();
    await expect(page.locator(".collection-filter-panel")).toHaveAttribute(
      "open",
      "",
    );
    await page.getByLabel("Sort by").selectOption("artist");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/sort=artist/);
    await expectNoHorizontalOverflow(page);
    const sortedRecords = page
      .getByRole("list", { name: "Records in your collection" })
      .getByRole("article");
    await expect(sortedRecords.nth(0)).toHaveAccessibleName(
      "Pastel Blues — Mono",
    );
    await expect(sortedRecords.nth(1)).toHaveAccessibleName("Diamond Life");

    await page.getByLabel("Search your collection").fill("Sunday morning");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/q=Sunday\+morning/);
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Diamond Life" }),
    ).toHaveCount(0);

    await page.getByLabel("Search your collection").fill("not in this crate");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(
      page.getByRole("heading", { name: "No records match" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Clear search and filters" }).click();
    await expect(page).toHaveURL(/\/collection$/);
    await page.locator(".collection-filter-panel > summary").click();
    await expect(page.locator(".collection-filter-panel")).toHaveAttribute(
      "open",
      "",
    );
    await page.getByRole("checkbox", { name: /Favorites only/ }).check();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/favorite=1/);
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Diamond Life" }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Clear" }).click();
    await expect(page).toHaveURL(/\/collection$/);
    await page
      .getByRole("article", { name: "Diamond Life" })
      .getByRole("link")
      .click();
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);
    await expect(
      page.getByRole("article", { name: "Pastel Blues — Mono" }),
    ).toBeVisible();

    await page
      .getByRole("article", { name: "Pastel Blues — Mono" })
      .getByRole("link")
      .click();
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await expect(
      page.getByRole("group", { name: "Remove Pastel Blues — Mono?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Keep record" }).click();
    await expect(
      page.getByRole("heading", { name: "Pastel Blues — Mono", level: 1 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);
    await expect(
      page.getByText("The copy was removed from your collection."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your crate is waiting" }),
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
