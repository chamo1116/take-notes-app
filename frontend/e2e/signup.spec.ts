import { test, expect } from "@playwright/test";

test.describe("Signup page", () => {
  test("renders the signup form with all expected elements", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "Yay, New Friend!" })).toBeVisible();
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
    await expect(page.getByRole("link", { name: /already friends/i })).toBeVisible();
  });

  test("links back to the login page", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: /already friends/i }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows a placeholder message on submit", async ({ page }) => {
    await page.goto("/signup");

    await page.getByPlaceholder("Email address").fill("jane@example.com");
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page.getByTestId("signup-message")).toBeVisible();
  });
});
