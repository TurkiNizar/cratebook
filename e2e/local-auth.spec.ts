import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  type APIRequestContext,
  type Download,
  type Locator,
  type Page,
  test,
  type TestInfo,
} from "@playwright/test";

const runLocalAuth = process.env.RUN_LOCAL_AUTH_E2E === "1";

async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function supportsPlainTabNavigation(testInfo: TestInfo) {
  return !["desktop-webkit", "mobile-safari"].includes(testInfo.project.name);
}

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

async function expectOptimizedArtwork(
  image: Locator,
  loading: "lazy" | "preloaded",
) {
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", /\/_next\/image\?url=/);
  await expect(image).toHaveAttribute("srcset", /\/_next\/image\?url=/);
  await expect(image).toHaveAttribute("sizes", /.+/);

  if (loading === "lazy") {
    await expect(image).toHaveAttribute("loading", "lazy");
  } else {
    await expect(image).not.toHaveAttribute("loading");
  }

  const geometry = await image.evaluate((element) => {
    const imageRect = element.getBoundingClientRect();
    const coverRect = element.parentElement?.getBoundingClientRect();

    return {
      coverAspectRatio: element.parentElement
        ? window.getComputedStyle(element.parentElement).aspectRatio
        : "",
      coverHeight: coverRect?.height ?? 0,
      coverWidth: coverRect?.width ?? 0,
      imageHeight: imageRect.height,
      imageWidth: imageRect.width,
    };
  });

  expect(geometry.coverAspectRatio).toBe("1 / 1");
  expect(
    Math.abs(geometry.coverWidth - geometry.coverHeight),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(geometry.imageWidth - geometry.imageHeight),
  ).toBeLessThanOrEqual(1.01);
}

async function expectBottomNavigation(
  page: Page,
  currentLabel: string,
  verifyKeyboard = true,
) {
  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  const links = navigation.getByRole("link");

  await expect(links).toHaveCount(4);
  await expect(links).toHaveText(["Collection", "Wishlist", "Add", "Profile"]);
  await expect(
    navigation.getByRole("link", { name: currentLabel, exact: true }),
  ).toHaveAttribute("aria-current", "page");

  const geometry = await navigation.evaluate((nav) => {
    const navRect = nav.getBoundingClientRect();
    const appPage = document.querySelector(".app-page");
    const linkRects = Array.from(nav.querySelectorAll("a"), (link) => {
      const rect = link.getBoundingClientRect();
      const label = link.querySelector(".bottom-nav-label");
      const labelRect = label?.getBoundingClientRect();
      const icon = link.querySelector(".bottom-nav-icon");

      return {
        backgroundColor: window.getComputedStyle(link).backgroundColor,
        center: rect.left + rect.width / 2,
        height: rect.height,
        iconBackgroundColor: icon
          ? window.getComputedStyle(icon).backgroundColor
          : "",
        label: label?.textContent?.trim() ?? "",
        labelTop: labelRect?.top ?? 0,
        tabIndex: link.tabIndex,
        top: rect.top,
        width: rect.width,
      };
    });

    return {
      appPaddingBottom: appPage
        ? Number.parseFloat(window.getComputedStyle(appPage).paddingBottom)
        : 0,
      linkRects,
      navBottom: window.innerHeight - navRect.bottom,
      navHeight: navRect.height,
      navTop: navRect.top,
    };
  });

  expect(geometry.navBottom).toBeLessThanOrEqual(1);
  expect(geometry.appPaddingBottom).toBeGreaterThanOrEqual(geometry.navHeight);
  for (const rect of geometry.linkRects) {
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(rect.tabIndex).toBeGreaterThanOrEqual(0);
    expect(rect.top).toBeGreaterThanOrEqual(geometry.navTop);
  }

  const widths = geometry.linkRects.map(({ width }) => width);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  const labelTops = geometry.linkRects.map(({ labelTop }) => labelTop);
  expect(Math.max(...labelTops) - Math.min(...labelTops)).toBeLessThanOrEqual(
    1,
  );
  const centerGaps = geometry.linkRects
    .slice(1)
    .map(({ center }, index) => center - geometry.linkRects[index].center);
  expect(Math.max(...centerGaps) - Math.min(...centerGaps)).toBeLessThanOrEqual(
    1,
  );
  const addTab = geometry.linkRects.find(({ label }) => label === "Add");
  const currentTab = geometry.linkRects.find(
    ({ label }) => label === currentLabel,
  );
  expect(addTab?.iconBackgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(currentTab?.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  if (currentLabel !== "Add") {
    await expect
      .poll(() =>
        navigation
          .getByRole("link", { name: "Add", exact: true })
          .evaluate(
            (element) => window.getComputedStyle(element).backgroundColor,
          ),
      )
      .toBe("rgba(0, 0, 0, 0)");
  }

  for (let index = 0; index < 4; index += 1) {
    await links.nth(index).focus();
    await expect(links.nth(index)).toBeFocused();
  }

  for (let index = 0; verifyKeyboard && index < 4; index += 1) {
    const adjacentIndex = index === 0 ? 1 : index - 1;
    await links.nth(adjacentIndex).focus();
    await page.keyboard.press(index === 0 ? "Shift+Tab" : "Tab");
    await expect(links.nth(index)).toBeFocused();
    expect(
      await links
        .nth(index)
        .evaluate((element) => window.getComputedStyle(element).outlineStyle),
    ).not.toBe("none");
  }
}

async function expectNoSeriousAccessibilityViolations(
  page: Page,
  include?: string,
) {
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  if (include) builder.include(include);
  const results = await builder.analyze();
  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );

  expect(seriousViolations).toEqual([]);
}

async function expectCenteredSecondaryControl(control: Locator) {
  await expect(control).toBeVisible();

  const geometry = await control.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    const controlRect = element.getBoundingClientRect();
    const textNode = Array.from(element.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    const textRange = document.createRange();

    if (textNode) {
      textRange.selectNodeContents(textNode);
    } else {
      textRange.selectNodeContents(element);
    }

    const textRect = textRange.getBoundingClientRect();

    return {
      alignItems: styles.alignItems,
      display: styles.display,
      height: controlRect.height,
      justifyContent: styles.justifyContent,
      lineHeight: styles.lineHeight,
      overflowX: element.scrollWidth - element.clientWidth,
      textCenterDelta: Math.abs(
        textRect.left +
          textRect.width / 2 -
          (controlRect.left + controlRect.width / 2),
      ),
      textAlign: styles.textAlign,
    };
  });

  expect(geometry).toMatchObject({
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  });
  expect(["flex", "inline-flex"]).toContain(geometry.display);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  expect(geometry.lineHeight).not.toBe("normal");
  expect(geometry.overflowX).toBeLessThanOrEqual(1);
  expect(geometry.textCenterDelta).toBeLessThanOrEqual(1);
}

async function expectSecondaryInteractionStates(control: Locator) {
  const initialBorder = await control.evaluate(
    (element) => window.getComputedStyle(element).borderColor,
  );

  await control.hover();
  await expect
    .poll(() =>
      control.evaluate(
        (element) => window.getComputedStyle(element).borderColor,
      ),
    )
    .not.toBe(initialBorder);

  await control.focus();
  expect(
    await control.evaluate(
      (element) => window.getComputedStyle(element).outlineStyle,
    ),
  ).not.toBe("none");

  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  await control
    .page()
    .mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await control.page().mouse.down();
  await expect
    .poll(() =>
      control.evaluate((element) => window.getComputedStyle(element).transform),
    )
    .not.toBe("none");
  await control.page().mouse.move(0, 0);
  await control.page().mouse.up();
}

async function signInAndCompleteOnboarding(
  page: Page,
  request: APIRequestContext,
  testInfo: TestInfo,
) {
  const unique = `${Date.now()}-${testInfo.workerIndex}`;
  const email = `collector-${unique}@example.test`;
  const username = `collector_${unique}`;

  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: /email me a sign-in link/i }).click();
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
  const content = (message.HTML ?? message.Text ?? "").replaceAll("&amp;", "&");
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

  return username;
}

test.describe("local passwordless authentication", () => {
  test.setTimeout(90_000);

  test.skip(
    !runLocalAuth,
    "Set RUN_LOCAL_AUTH_E2E=1 with the local Supabase stack running",
  );

  test("shares only opted-in collection and wishlist records on the signed-out profile", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      !["desktop-chromium", "mobile-chrome"].includes(testInfo.project.name),
      "Public profile journey runs in representative desktop and mobile browsers",
    );

    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });

    const username = await signInAndCompleteOnboarding(page, request, testInfo);

    await page.goto("/add/manual");
    await page.getByLabel("Artist").fill("Nina Simone");
    await page.getByLabel("Album or release title").fill("Pastel Blues");
    await page.getByRole("button", { name: "Add to my collection" }).click();
    await expect(page).toHaveURL(/\/collection\?added=/);
    await page
      .getByRole("article", { name: "Pastel Blues" })
      .getByRole("link")
      .click();
    await page.getByRole("link", { name: "Edit record" }).click();
    await page.getByLabel("Acquired from").fill("Private record shop");
    await page.getByLabel("Price paid").fill("24.99");
    await page.getByLabel("Currency").fill("USD");
    await page
      .getByLabel("Personal notes or story")
      .fill("Private collection memory");
    await page
      .getByRole("checkbox", { name: /Visible when my profile is public/ })
      .check();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\?updated=1/);

    await page.goto("/wishlist/add");
    await page.getByLabel("Artist").fill("Alice Coltrane");
    await page
      .getByLabel("Album or release title")
      .fill("Journey in Satchidananda");
    await page.getByLabel("Priority").selectOption("must_have");
    await page
      .getByLabel("Preferred edition or pressing")
      .fill("Any clean Impulse pressing");
    await page.getByLabel("Maximum price", { exact: true }).fill("75.00");
    await page.getByLabel("Currency").fill("USD");
    await page
      .getByLabel("Private notes", { exact: true })
      .fill("Private wishlist note");
    await page.getByRole("checkbox", { name: /Visible/ }).check();
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await expect(page).toHaveURL(/\/wishlist\?added=/);

    await page.goto("/settings");
    await page.getByLabel("Display name").fill("Local Crate Digger");
    await page
      .getByLabel("About your collection")
      .fill("Jazz discoveries and records with a story.");
    await page.getByLabel("Public profile").uncheck();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Your profile has been saved.")).toBeVisible();
    await page.getByRole("link", { name: "Preview public profile" }).click();
    await expect(page).toHaveURL(new RegExp(`/u/${username}$`));
    await expect(
      page.getByRole("heading", { name: "Only you can see this preview" }),
    ).toBeVisible();
    await expect(page.getByText("Pastel Blues")).toBeVisible();
    await expect(page.getByText("Journey in Satchidananda")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy profile link" }),
    ).toHaveCount(0);

    await page.getByRole("link", { name: "Manage sharing" }).click();
    await page.getByLabel("Public profile").check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Your profile has been saved.")).toBeVisible();
    await page.getByRole("link", { name: "Preview public profile" }).click();
    await expect(
      page.getByRole("heading", { name: "This is what visitors can see" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy profile link" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Manage sharing" }).click();

    const collectionDownloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download collection CSV" }).click();
    const collectionDownload = await collectionDownloadPromise;
    expect(collectionDownload.suggestedFilename()).toBe(
      "cratebook-collection.csv",
    );
    const collectionCsv = await readDownload(collectionDownload);
    expect(collectionCsv).toMatch(/^\uFEFFCollection item ID,Artist,Title/);
    expect(collectionCsv).toContain("Nina Simone,Pastel Blues");
    expect(collectionCsv).toContain("Private record shop,24.99,USD");
    expect(collectionCsv).toContain("Private collection memory");

    const wishlistDownloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download wishlist CSV" }).click();
    const wishlistDownload = await wishlistDownloadPromise;
    expect(wishlistDownload.suggestedFilename()).toBe("cratebook-wishlist.csv");
    const wishlistCsv = await readDownload(wishlistDownload);
    expect(wishlistCsv).toMatch(/^\uFEFFWishlist item ID,Artist,Title/);
    expect(wishlistCsv).toContain("Alice Coltrane,Journey in Satchidananda");
    expect(wishlistCsv).toContain("75.00,USD,Private wishlist note");
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);

    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto(`/u/${username}`);
    await expect(
      page.getByRole("heading", { name: "Local Crate Digger", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(`@${username}`)).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Local Crate Digger's shared collection" })
        .getByRole("article", { name: "Pastel Blues" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Local Crate Digger's shared wishlist" })
        .getByRole("article", { name: "Journey in Satchidananda" }),
    ).toBeVisible();
    await expect(page.getByText("Must-have")).toBeVisible();
    await expect(page.getByText("Any clean Impulse pressing")).toBeVisible();
    await expect(page.getByText("Private record shop")).toHaveCount(0);
    await expect(page.getByText("$24.99")).toHaveCount(0);
    await expect(page.getByText("Private collection memory")).toHaveCount(0);
    await expect(page.getByText("$75.00")).toHaveCount(0);
    await expect(page.getByText("Private wishlist note")).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toHaveCount(0);
    await expect(
      page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
      ),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
    expect(browserErrors).toEqual([]);
  });

  test("keeps four bottom destinations aligned, accessible, and clear of content", async ({
    page,
    request,
  }, testInfo) => {
    await signInAndCompleteOnboarding(page, request, testInfo);
    const verifyKeyboard = supportsPlainTabNavigation(testInfo);

    await expectBottomNavigation(page, "Collection", verifyKeyboard);
    await page.getByRole("link", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL(/\/add$/);
    await expectBottomNavigation(page, "Add", verifyKeyboard);

    await page.goto("/add/manual");
    await expectBottomNavigation(page, "Add", verifyKeyboard);
    await page.getByRole("link", { name: "Wishlist", exact: true }).click();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expectBottomNavigation(page, "Wishlist", verifyKeyboard);

    await page.getByRole("link", { name: "Profile", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expectBottomNavigation(page, "Profile", verifyKeyboard);
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page, ".bottom-nav");
    await expect(
      page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
      ),
    ).toHaveCount(0);
  });

  test("shows a neutral catalogue skeleton after entering through Add", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(
      !["desktop-chromium", "mobile-chrome"].includes(testInfo.project.name),
      "Network-throttled transition coverage runs in desktop and mobile Chromium",
    );

    await signInAndCompleteOnboarding(page, request, testInfo);
    const devtools = await page.context().newCDPSession(page);
    await devtools.send("Network.enable");
    await devtools.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 350,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (250 * 1024) / 8,
    });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.getByRole("link", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL(/\/add$/);
    await page.getByRole("link", { name: /search the catalogue/i }).click();
    await expect(
      page.getByRole("heading", { name: "Find an album" }),
    ).toBeVisible();
    const searchOutcome = page
      .getByRole("heading", { name: /Nothing found for/ })
      .or(page.getByRole("heading", { name: "MusicBrainz needs a moment" }));
    await page
      .getByLabel("Artist, title, or identifier")
      .fill(`Zzqv loading warmup ${Date.now()} ${testInfo.workerIndex}`);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(searchOutcome).toBeVisible();
    await page
      .getByLabel("Artist, title, or identifier")
      .fill(`Zzqv loading check ${Date.now()} ${testInfo.workerIndex}`);
    await page.getByRole("button", { name: "Search" }).click();

    const loading = page.getByTestId("catalogue-search-loading");
    await expect(loading).toBeVisible();
    const geometry = await loading.evaluate((element) => {
      const cards = Array.from(
        element.querySelectorAll<HTMLElement>(".catalogue-album-card"),
      );
      return {
        cardCount: cards.length,
        collectionCoverCount:
          element.querySelectorAll(".collection-cover").length,
        coverCount: element.querySelectorAll(".catalogue-cover-skeleton")
          .length,
        formCount: element.querySelectorAll(".catalogue-search-form").length,
        interactiveControlCount:
          element.querySelectorAll("a, button, input").length,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      };
    });

    expect(geometry).toMatchObject({
      cardCount: 3,
      collectionCoverCount: 0,
      coverCount: 3,
      formCount: 1,
      interactiveControlCount: 0,
      reducedMotion: true,
    });

    await expect(searchOutcome).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(
      page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
      ),
    ).toHaveCount(0);

    await devtools.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    await devtools.detach();
  });

  test("signs in, completes onboarding, and maintains a collection and wishlist", async ({
    page,
    request,
  }, testInfo) => {
    const unique = `${Date.now()}-${testInfo.workerIndex}`;
    await signInAndCompleteOnboarding(page, request, testInfo);
    await expect(
      page.getByRole("heading", { name: "Your crate is waiting" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectBottomNavigation(
      page,
      "Collection",
      supportsPlainTabNavigation(testInfo),
    );

    await page.getByRole("link", { name: "Add", exact: true }).click();
    await expect(page).toHaveURL(/\/add$/);
    await expectBottomNavigation(
      page,
      "Add",
      supportsPlainTabNavigation(testInfo),
    );
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
    await expectNoSeriousAccessibilityViolations(page);

    await page
      .getByLabel("Artist, title, or identifier")
      .fill(`Zzqv nonexistent album ${unique}`);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(
      page
        .getByRole("heading", { name: /Nothing found for/ })
        .or(page.getByRole("heading", { name: "MusicBrainz needs a moment" })),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add manually" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add to wishlist manually" }),
    ).toBeVisible();
    await expectCenteredSecondaryControl(
      page.getByRole("link", { name: "Add to wishlist manually" }),
    );
    await expectNoSeriousAccessibilityViolations(page);
    await page.getByRole("link", { name: "Add manually" }).click();
    await expect(page).toHaveURL(/\/add\/manual$/);
    await expect(page.getByLabel("Artist")).toBeVisible();
    const findArtworkControl = page.getByRole("button", {
      name: "Find album artwork",
    });
    await findArtworkControl.evaluate((button) => {
      if (button instanceof HTMLButtonElement) button.disabled = true;
    });
    await expect(findArtworkControl).toBeDisabled();
    expect(
      await findArtworkControl.evaluate((button) => {
        const styles = window.getComputedStyle(button);
        return { cursor: styles.cursor, opacity: Number(styles.opacity) };
      }),
    ).toEqual({ cursor: "wait", opacity: 0.65 });
    await findArtworkControl.evaluate((button) => {
      if (button instanceof HTMLButtonElement) button.disabled = false;
    });
    await page.goto("/add/catalogue");

    await page
      .getByLabel("Artist, title, or identifier")
      .fill("Miles Davis Kind of Blue");
    await page.getByRole("button", { name: "Search" }).click();
    const albumCard = page
      .getByRole("article", {
        name: "Kind of Blue by Miles Davis",
        exact: true,
      })
      .filter({ hasText: "First released 1959" })
      .first();
    await expectOptimizedArtwork(
      albumCard.getByAltText("Kind of Blue cover"),
      "lazy",
    );
    await expect(
      albumCard.getByText("Album match · pressing not selected"),
    ).toBeVisible();
    await expect(
      albumCard.getByRole("link", { name: "Add to collection" }),
    ).toBeVisible();
    await expect(
      albumCard.getByRole("link", { name: "Add to wishlist" }),
    ).toBeVisible();
    await expectCenteredSecondaryControl(
      albumCard.getByRole("link", { name: "Add to wishlist" }),
    );
    const specificEditionControl = albumCard.getByRole("link", {
      name: "Choose a specific edition",
    });
    await expectCenteredSecondaryControl(specificEditionControl);
    await expectSecondaryInteractionStates(specificEditionControl);
    const editionHref = await albumCard
      .getByRole("link", { name: "Choose a specific edition" })
      .getAttribute("href");
    expect(editionHref).toMatch(/^\/add\/catalogue\/[0-9a-f-]+\/editions$/);
    const albumWishlistHref = await albumCard
      .getByRole("link", { name: "Add to wishlist" })
      .getAttribute("href");
    const albumCollectionHref = await albumCard
      .getByRole("link", { name: "Add to collection" })
      .getAttribute("href");
    expect(albumWishlistHref).toMatch(/^\/wishlist\/add\?catalogueAlbumId=/);
    expect(albumCollectionHref).toMatch(/^\/add\/manual\?catalogueAlbumId=/);
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);

    await page.goto(editionHref!);
    await expect(
      page.getByRole("heading", { name: "Choose a specific edition" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add album to collection" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add album to wishlist" }),
    ).toBeVisible();
    const reviewRelease = page
      .getByRole("link", { name: "Review release" })
      .first();
    const editionFailure = page.getByRole("heading", {
      name: "We could not load specific editions",
    });
    await expect(reviewRelease.or(editionFailure)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(albumCollectionHref!);
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
    await expectOptimizedArtwork(albumCollectionCard.locator("img"), "lazy");
    await albumCollectionCard.getByRole("link").click();
    await expectOptimizedArtwork(
      page.getByAltText(/kind of blue cover/i),
      "preloaded",
    );
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
    await expectOptimizedArtwork(albumWishlistCard.locator("img"), "lazy");
    await albumWishlistCard.getByRole("link").click();
    await expectOptimizedArtwork(
      page.getByAltText(/kind of blue cover/i),
      "preloaded",
    );
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
    await page.getByRole("link", { name: "Move to collection" }).click();
    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]+\/move$/);
    await page.getByRole("button", { name: "Move to collection" }).click();
    const catalogueDuplicateWarning = page.getByRole("status");
    await expect(catalogueDuplicateWarning).toContainText(
      "This may already be in your collection",
    );
    await expect(catalogueDuplicateWarning).toContainText(
      /You already have 1 copy of Kind of Blue by Miles Davis/i,
    );
    await page.getByRole("button", { name: "Move to collection" }).click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\?moved=1$/);
    await expect(page.getByAltText(/kind of blue cover/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "MusicBrainz" }),
    ).toHaveAttribute("href", /musicbrainz\.org\/release-group\//);
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);
    const remainingAlbum = page
      .getByRole("list", { name: "Records in your collection" })
      .getByRole("article", { name: /kind of blue/i });
    await expect(remainingAlbum).toHaveCount(1);
    await remainingAlbum.getByRole("link").click();
    await page.getByRole("button", { name: "Remove from collection" }).click();
    await page.getByRole("button", { name: "Yes, remove this copy" }).click();
    await expect(page).toHaveURL(/\/collection\?removed=1$/);

    await page.goto("/add/manual");

    await page.getByLabel("Artist").fill("Nina Simone");
    await page.getByLabel("Album or release title").fill("Pastel Blues");
    await page.getByRole("button", { name: "Find album artwork" }).click();
    const pastelBluesArtwork = page
      .getByRole("button", {
        name: /Use artwork for Pastel Blues by Nina Simone/i,
      })
      .first();
    await expect(pastelBluesArtwork).toBeVisible();
    await pastelBluesArtwork.click();
    await expect(pastelBluesArtwork).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(/Artwork from Cover Art Archive/).first(),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
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
    await expect(page.getByAltText("Pastel Blues cover")).toBeVisible();
    const originalCatalogueHref = await page
      .getByRole("link", { name: "MusicBrainz" })
      .getAttribute("href");
    expect(originalCatalogueHref).toMatch(/musicbrainz\.org\/release-group\//);
    await expect(page.getByText("Nina Simone", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Edit record" }).click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\/edit$/);
    await expect(page.getByLabel("Artist")).toHaveValue("Nina Simone");
    await expect(page.getByLabel("Album or release title")).toHaveValue(
      "Pastel Blues",
    );
    await expect(page.getByAltText("Pastel Blues cover")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Keep current artwork" }),
    ).toHaveAttribute("aria-pressed", "true");
    const collectionVisibility = page.getByRole("checkbox", {
      name: /Visible when my profile is public/,
    });
    await expect(collectionVisibility).not.toBeChecked();
    await collectionVisibility.check();
    await page.getByRole("button", { name: "Remove artwork" }).click();
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
    await expect(
      page.getByRole("img", {
        name: "Pastel Blues — Mono cover not available",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "MusicBrainz" }),
    ).toHaveAttribute("href", originalCatalogueHref!);
    await expect(page.getByText("PHS 600-187", { exact: true })).toBeVisible();
    await expect(page.getByText("★ Favorite")).toBeVisible();
    await expect(page.getByText("Near Mint (NM)")).toBeVisible();
    await expect(page.getByText("Very Good Plus (VG+)")).toBeVisible();
    await expect(page.getByText("Local record shop")).toBeVisible();
    await expect(page.getByText("$24.99")).toBeVisible();
    await expect(page.getByText("5 / 5")).toBeVisible();
    await expect(page.getByText("Public", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Tags")).toHaveText("JazzSunday morning");
    await expect(page.getByText("A late-night favorite.")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Edit record" }).click();
    await page.getByLabel("Album or release title").fill("Pastel Blues");
    await page.getByRole("button", { name: "Find album artwork" }).click();
    const replacementArtwork = page
      .getByRole("list", { name: "Album artwork suggestions" })
      .getByRole("button", { name: /Use artwork for/i })
      .first();
    await expect(replacementArtwork).toBeVisible();
    await replacementArtwork.click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page).toHaveURL(/\/collection\/[0-9a-f-]+\?updated=1$/);
    await expect(page.getByAltText("Pastel Blues cover")).toBeVisible();
    await expect(
      page.getByText("Artwork from Cover Art Archive"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "MusicBrainz" }),
    ).toHaveAttribute("href", originalCatalogueHref!);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Edit record" }).click();
    await page.getByLabel("Album or release title").fill("Pastel Blues — Mono");
    await expect(
      page.getByRole("button", { name: "Keep current artwork" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("checkbox", { name: /Visible when my profile is public/ })
      .uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByAltText("Pastel Blues — Mono cover")).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();

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
    await expect(
      page.getByRole("button", { name: /Keep no cover/ }),
    ).toHaveAttribute("aria-pressed", "true");
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
    const editWishControl = page.getByRole("link", { name: "Edit wish" });
    await expectCenteredSecondaryControl(editWishControl);
    await editWishControl.click();
    await expectCenteredSecondaryControl(
      page.getByRole("link", { name: "Cancel" }),
    );
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
    await expectBottomNavigation(
      page,
      "Profile",
      supportsPlainTabNavigation(testInfo),
    );
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

    await page.getByLabel("Public profile").uncheck();
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page.getByText("Your profile has been saved.")).toBeVisible();
    await expect(page.getByText("Private", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Public profile")).not.toBeChecked();
  });
});
