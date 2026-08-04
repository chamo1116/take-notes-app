import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "test@example.com";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "testpass123";

test.describe("Login page", () => {
  test("redirects to /login from the root path", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("renders the login form with all expected elements", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Yay, You're Back!" })).toBeVisible();
    await expect(page.getByPlaceholder("Email address")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: /never been here before/i })).toBeVisible();
  });

  test("toggles password visibility", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByPlaceholder("Password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("shows an inline error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Email address").fill(TEST_EMAIL);
    await page.getByPlaceholder("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByTestId("login-error")).toHaveText("Invalid email or password.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Email address").fill(TEST_EMAIL);
    await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Logged in")).toBeVisible();
  });
});
