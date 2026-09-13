import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

function readPngSize(png: Buffer) {
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    colorType: png[25],
  };
}

test("introduces the product and links to sign in", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /a home for every record/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /build your collection/i }),
  ).toHaveAttribute("href", "/sign-in");
});

test("publishes an installable web app manifest", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();

  const manifest = await response.json();
  expect(manifest.id).toBe("/");
  expect(manifest.short_name).toBe("Cratebook");
  expect(manifest.start_url).toBe("/collection");
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.prefer_related_applications).toBe(false);
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(icon.src);
    expect(iconResponse.ok()).toBeTruthy();
    expect(iconResponse.headers()["content-type"]).toContain("image/png");
  }

  const maskableIcon = manifest.icons.find(
    (icon: { purpose?: string }) => icon.purpose === "maskable",
  );
  const maskableResponse = await request.get(maskableIcon.src);
  expect(readPngSize(await maskableResponse.body())).toEqual({
    width: 512,
    height: 512,
    colorType: 2,
  });
});

test("offers installation guidance and publishes Apple install metadata", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/");

  const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleTouchIcon).toHaveAttribute("href", /apple-icon/);
  const appleIconResponse = await page.request.get(
    (await appleTouchIcon.getAttribute("href"))!,
  );
  expect(readPngSize(await appleIconResponse.body())).toEqual({
    width: 180,
    height: 180,
    colorType: 2,
  });

  await page.getByRole("button", { name: /install app/i }).click();
  const dialog = page.getByRole("dialog", { name: /install cratebook/i });
  await expect(dialog).toBeVisible();
  if ((await page.evaluate(() => navigator.userAgent)).includes("iPhone")) {
    await expect(dialog).toContainText(/share menu/i);
    await expect(dialog).toContainText(/add to home screen/i);
  }

  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibilityScan.violations).toEqual([]);

  await page.getByRole("button", { name: /got it/i }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
