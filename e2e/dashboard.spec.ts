import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("sidebar is visible on page load", async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto("/dashboard");

    // Verify the sidebar is visible
    // The sidebar has data-slot="sidebar"
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Also verify branding is visible in the sidebar specifically to avoid strict mode violation with breadcrumb
    await expect(sidebar.getByText("Frontpage")).toBeVisible();
  });

  test("clicking 'Add Feed' opens the dialog", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator('[data-slot="sidebar"]');

    await sidebar.getByRole("button", { name: /add feed/i }).click();

    const dialog = page.getByRole("dialog");

    await expect(
      dialog.getByRole("heading", { name: /add feed/i }),
    ).toBeVisible();
    await expect(dialog.getByText(/enter the url/i)).toBeVisible();
  });

  test("dialog contains URL input and Add button", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /add feed/i }).click();

    const dialog = page.getByRole("dialog");
    const urlInput = dialog.getByLabel(/feed url/i);
    const addButton = dialog.getByRole("button", { name: /add/i });

    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute("type", "url");
    await expect(urlInput).toHaveAttribute(
      "placeholder",
      "https://example.com/feed.xml",
    );
    await expect(addButton).toBeVisible();
  });
});
