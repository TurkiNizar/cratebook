import { expect, test } from "@playwright/test";

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
  expect(manifest.short_name).toBe("Cratebook");
  expect(manifest.display).toBe("standalone");

  for (const icon of manifest.icons) {
    const iconResponse = await request.get(icon.src);
    expect(iconResponse.ok()).toBeTruthy();
    expect(iconResponse.headers()["content-type"]).toContain("image/png");
  }
});
