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

  test("signs up with a new email and reaches the dashboard", async ({ page }) => {
    const uniqueEmail = `e2e-signup-${Date.now()}@example.com`;

    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(uniqueEmail);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "All Categories" })).toBeVisible();
  });

  test("shows an inline error when the email is already taken", async ({ page }) => {
    const email = `e2e-signup-dupe-${Date.now()}@example.com`;

    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(email);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page.getByTestId("signup-message")).toHaveText(
      "A user with this email already exists.",
    );
    await expect(page).toHaveURL(/\/signup$/);
  });
});
