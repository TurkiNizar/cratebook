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

  test("signs in, completes onboarding, and maintains a collection and wishlist", async ({
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
    await page.getByRole("link", { name: /search the catalogue/i }).click();
    await expect(page).toHaveURL(/\/add\/catalogue$/);
    await expect(
      page.getByRole("heading", { name: "Find an album" }),
    ).toBeVisible();
    await expect(page.getByLabel("Artist, title, or identifier")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "← Add options" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page
      .getByLabel("Artist, title, or identifier")
      .fill("Miles Davis Kind of Blue");
    await page.getByRole("button", { name: "Search" }).click();
    const albumCard = page
      .getByRole("article", { name: "Kind of Blue", exact: true })
      .filter({ hasText: "First released 1959" })
      .first();
    await expect(albumCard.getByAltText("Kind of Blue cover")).toBeVisible();
    await expect(
      albumCard.getByText("Album match · pressing not selected"),
    ).toBeVisible();
    await expect(
      albumCard.getByRole("link", { name: "Add to collection" }),
    ).toBeVisible();
    await expect(
      albumCard.getByRole("link", { name: "Add to wishlist" }),
    ).toBeVisible();
    const albumWishlistHref = await albumCard
      .getByRole("link", { name: "Add to wishlist" })
      .getAttribute("href");
    expect(albumWishlistHref).toMatch(/^\/wishlist\/add\?catalogueAlbumId=/);
    await expectNoHorizontalOverflow(page);

    await albumCard.getByRole("link", { name: "Add to collection" }).click();
    await expect(page).toHaveURL(/\/add\/manual\?catalogueAlbumId=/);
    await expect(page.getByLabel("Artist")).toHaveValue("Miles Davis");
    await expect(page.getByLabel("Album or release title")).toHaveValue(
      /kind of blue/i,
    );
    await expect(page.getByLabel("Format")).toHaveValue("");
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Add to my collection" }).click();
    await expect(page).toHaveURL(/\/collection\?added=[0-9a-f-]+$/);
    const albumCollectionCard = page
      .getByRole("list", { name: "Records in your collection" })
      .getByRole("article", { name: /kind of blue/i });
    await expect(albumCollectionCard.getByText("Miles Davis")).toBeVisible();
    await albumCollectionCard.getByRole("link").click();
    await expect(page.getByAltText(/kind of blue cover/i)).toBeVisible();
    const collectionEditionDetails = page.getByRole("region", {
      name: "Edition details",
    });
    await expect(
      collectionEditionDetails.getByText("Original release year"),
    ).toBeVisible();
    await expect(
      collectionEditionDetails.getByText("1959", { exact: true }),
    ).toBeVisible();
    await expect(
      collectionEditionDetails.getByText("Format", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "MusicBrainz" }),
    ).toHaveAttribute("href", /musicbrainz\.org\/release-group\//);
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);

    await page.goto(albumWishlistHref!);
    await expect(page).toHaveURL(/\/wishlist\/add\?catalogueAlbumId=/);
    await expect(page.getByLabel("Artist")).toHaveValue("Miles Davis");
    await expect(page.getByLabel("Album or release title")).toHaveValue(
      /kind of blue/i,
    );
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await expect(page).toHaveURL(/\/wishlist\?added=[0-9a-f-]+$/);
    const albumWishlistCard = page
      .getByRole("list", { name: "Records on your wishlist" })
      .getByRole("article", { name: /kind of blue/i });
    await expect(albumWishlistCard.getByText("Miles Davis")).toBeVisible();
    await albumWishlistCard.getByRole("link").click();
    await expect(page.getByAltText(/kind of blue cover/i)).toBeVisible();
    const wishlistEditionDetails = page.getByRole("complementary", {
      name: "Edition details",
    });
    await expect(
      wishlistEditionDetails.getByText("Original release year"),
    ).toBeVisible();
    await expect(
      wishlistEditionDetails.getByText("1959", { exact: true }),
    ).toBeVisible();
    await expect(
      wishlistEditionDetails.getByText("Format", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "MusicBrainz" }),
    ).toHaveAttribute("href", /musicbrainz\.org\/release-group\//);
    await page.getByRole("button", { name: "Remove from wishlist" }).click();
    await page.getByRole("button", { name: "Yes, remove this wish" }).click();
    await expect(page).toHaveURL(/\/wishlist\?removed=1$/);

    await page.goto("/add/manual");

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

    await page.getByRole("link", { name: "Wishlist", exact: true }).click();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expect(
      page.getByRole("heading", { name: "Your want list is wide open" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Add your first wish" }).click();
    await expect(page).toHaveURL(/\/wishlist\/add$/);
    await expectNoHorizontalOverflow(page);
    await page.getByLabel("Artist").fill("Alice Coltrane");
    await page
      .getByLabel("Album or release title")
      .fill("Journey in Satchidananda");
    await page.getByLabel("Priority").selectOption("must_have");
    await page
      .getByLabel("Preferred edition or pressing")
      .fill("Impulse stereo pressing");
    await page.getByLabel("Maximum price", { exact: true }).fill("75.00");
    await page.getByLabel("Currency").fill("USD");
    await page
      .getByLabel("Private notes", { exact: true })
      .fill("Check the sleeve.");
    await page.getByRole("checkbox", { name: /Visible/ }).check();
    await page.getByRole("button", { name: "Add to wishlist" }).click();

    await expect(page).toHaveURL(/\/wishlist\?added=[0-9a-f-]+$/);
    await expect(
      page.getByText(
        /journey in satchidananda.*alice coltrane.*added to your wishlist/i,
      ),
    ).toBeVisible();
    const wishlistRecord = page.getByRole("article", {
      name: "Journey in Satchidananda",
    });
    await expect(wishlistRecord.getByText("Must-have")).toBeVisible();
    await expect(wishlistRecord.getByText("Up to $75.00")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await wishlistRecord.getByRole("link").click();
    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]+$/);
    await expect(page.getByText("Check the sleeve.")).toBeVisible();
    await expect(page.getByText("Visible on a public profile")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole("link", { name: "Edit wish" }).click();
    await page
      .getByLabel("Album or release title")
      .fill("Journey in Satchidananda — Reissue");
    await page.getByLabel("Priority").selectOption("wanted");
    await page.getByLabel("Maximum price", { exact: true }).fill("60.00");
    await page.getByRole("checkbox", { name: /Visible/ }).uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]+\?updated=1$/);
    await expect(
      page.getByText("Your wishlist changes were saved."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Journey in Satchidananda — Reissue",
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Wanted", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("$60.00")).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Move to collection" }).click();
    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]+\/move$/);
    await expect(
      page.getByRole("heading", { name: "Move to collection", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Impulse stereo pressing")).toBeVisible();
    await expect(
      page.getByText(/private spending limit.*\$60\.00/i),
    ).toBeVisible();
    await expect(page.getByLabel("Personal notes or story")).toHaveValue(
      "Check the sleeve.",
    );
    await page.getByLabel("Bought as").selectOption("used");
    await page.getByLabel("Media condition").selectOption("near_mint");
    await page.getByLabel("Acquisition date").fill("2026-09-10");
    await page.getByLabel("Acquired from").fill("Local record shop");
    await page.getByLabel("Price paid").fill("55.00");
    await page.getByLabel("Tags").fill("Spiritual jazz, Wishlist find");
    await page
      .getByLabel("Personal notes or story")
      .fill("Check the sleeve. Found a clean copy.");
    await page.getByRole("button", { name: "Move to collection" }).click();

    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\?moved=1$/);
    await expect(
      page.getByText(
        "The record moved from your wishlist into your collection.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Journey in Satchidananda — Reissue",
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByText("Local record shop")).toBeVisible();
    await expect(page.getByText("$55.00")).toBeVisible();
    await expect(
      page.getByText("Check the sleeve. Found a clean copy."),
    ).toBeVisible();
    await expect(page.getByLabel("Tags")).toHaveText(
      "Spiritual jazzWishlist find",
    );
    await expect(page.getByText("Private", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Wishlist", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Your want list is wide open" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Add your first wish" }).click();
    await page.getByLabel("Artist").fill("Dorothy Ashby");
    await page.getByLabel("Album or release title").fill("Afro-Harping");
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await page
      .getByRole("article", { name: "Afro-Harping" })
      .getByRole("link")
      .click();

    await page.getByRole("button", { name: "Remove from wishlist" }).click();
    await expect(
      page.getByRole("group", {
        name: "Remove Afro-Harping?",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Keep wish" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Afro-Harping",
        level: 1,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Remove from wishlist" }).click();
    await page.getByRole("button", { name: "Yes, remove this wish" }).click();
    await expect(page).toHaveURL(/\/wishlist\?removed=1$/);
    await expect(
      page.getByText("The record was removed from your wishlist."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your want list is wide open" }),
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
