import { test, expect } from "@playwright/test";

test.describe("Note creation", () => {
  test.beforeEach(async ({ page }) => {
    const uniqueEmail = `e2e-notes-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(uniqueEmail);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("lists all four categories in the sidebar", async ({ page }) => {
    for (const name of ["Random Thoughts", "Personal", "School", "Drama"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test("opens the note editor and autosaves, showing the last-edited timestamp", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Note" }).click();

    await expect(page.getByTestId("note-title-input")).toBeVisible();
    await page.getByTestId("note-title-input").fill("My first note");
    await page.getByTestId("note-body-textarea").fill("Pouring my heart out.");

    await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
      timeout: 5000,
    });
  });

  test("changes the note rectangle color when switching category", async ({ page }) => {
    await page.getByRole("button", { name: "New Note" }).click();
    const editor = page.getByTestId("note-editor");

    const rectangle = page.getByTestId("note-rectangle");
    const initialColor = await rectangle.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );

    await editor.getByRole("button", { name: "Random Thoughts", exact: true }).click();
    await editor.getByRole("option", { name: "Drama" }).click();

    await expect(editor.getByRole("button", { name: "Drama", exact: true })).toBeVisible();
    const updatedColor = await rectangle.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(updatedColor).not.toBe(initialColor);
  });

  test("closes the editor and returns to the dashboard", async ({ page }) => {
    await page.getByRole("button", { name: "New Note" }).click();
    await expect(page.getByTestId("note-title-input")).toBeVisible();

    await page.getByRole("button", { name: "Close note editor" }).click();
    await expect(page.getByTestId("note-title-input")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "New Note" })).toBeVisible();
  });

  test("a saved note appears as a colored card with today's date after closing the editor", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Note" }).click();
    const editor = page.getByTestId("note-editor");
    await editor.getByRole("button", { name: "Random Thoughts", exact: true }).click();
    await editor.getByRole("option", { name: "School" }).click();
    await page.getByTestId("note-title-input").fill("Meeting with Team");
    await page.getByTestId("note-body-textarea").fill("Discuss timeline.");

    await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Close note editor" }).click();

    const card = page.getByTestId("note-card").filter({ hasText: "Meeting with Team" });
    await expect(card).toBeVisible();
    await expect(card.getByTestId("note-card-date")).toHaveText("today");
    await expect(card).toHaveCSS("background-color", "rgb(233, 222, 142)"); // School's color
  });

  test("reopens an existing note pre-filled when its card is clicked", async ({ page }) => {
    await page.getByRole("button", { name: "New Note" }).click();
    await page.getByTestId("note-title-input").fill("Vacation Ideas");
    await page.getByTestId("note-body-textarea").fill("Visit Bali");
    await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Close note editor" }).click();

    await page.getByTestId("note-card").filter({ hasText: "Vacation Ideas" }).click();

    await expect(page.getByTestId("note-title-input")).toHaveValue("Vacation Ideas");
    await expect(page.getByTestId("note-body-textarea")).toHaveValue("Visit Bali");
  });

  test("filters the grid by category from the sidebar, and clears with All Categories", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Note" }).click();
    await page.getByTestId("note-title-input").fill("Grocery List");
    await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Close note editor" }).click();

    await page.getByRole("button", { name: "New Note" }).click();
    const editor = page.getByTestId("note-editor");
    await editor.getByRole("button", { name: "Random Thoughts", exact: true }).click();
    await editor.getByRole("option", { name: "School" }).click();
    await page.getByTestId("note-title-input").fill("Meeting with Team");
    await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
      timeout: 5000,
    });
    await page.getByRole("button", { name: "Close note editor" }).click();

    await expect(page.getByTestId("note-card")).toHaveCount(2);

    await page.getByRole("button", { name: "Filter by School" }).click();
    await expect(page.getByTestId("note-card")).toHaveCount(1);
    await expect(page.getByTestId("note-card")).toContainText("Meeting with Team");

    await page.getByRole("button", { name: "All Categories" }).click();
    await expect(page.getByTestId("note-card")).toHaveCount(2);
  });

  test("loads more notes on scroll (infinite scroll)", async ({ page }) => {
    // The backend paginates notes at 6 per page; create a 7th so a second
    // page exists to be loaded by scrolling.
    for (let i = 1; i <= 7; i++) {
      await page.getByRole("button", { name: "New Note" }).click();
      await page.getByTestId("note-title-input").fill(`Note ${i}`);
      await expect(page.getByTestId("note-last-edited")).toContainText("Last Edited:", {
        timeout: 5000,
      });
      await page.getByRole("button", { name: "Close note editor" }).click();
    }

    await expect(page.getByTestId("note-card")).toHaveCount(6);

    // Six cards can already fit above the fold at some viewport sizes, so the
    // IntersectionObserver may fire before this even runs. Scroll the window
    // rather than a specific note-card element: that card can get reflowed
    // (or appended past) mid-action by the very fetch this triggers, which
    // made `.last().scrollIntoViewIfNeeded()` flaky ("element is not stable"
    // / "not attached to the DOM").
    await page.mouse.wheel(0, 2000);

    await expect(page.getByTestId("note-card")).toHaveCount(7, { timeout: 5000 });
  });
});

test.describe("Session expiry", () => {
  test("redirects to /login once the access token is gone", async ({ page, context }) => {
    const uniqueEmail = `e2e-expiry-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(uniqueEmail);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    // Simulate the access token having expired: drop the cookie the way
    // the browser would once its maxAge elapses, then reload the page a
    // server-rendered auth check has to run for.
    await context.clearCookies({ name: "access_token" });
    await page.reload();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("redirects to /login if the token expires mid-session, on the next save", async ({
    page,
    context,
  }) => {
    const uniqueEmail = `e2e-expiry-mid-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    await page.goto("/signup");
    await page.getByPlaceholder("Email address").fill(uniqueEmail);
    await page.getByPlaceholder("Password").fill("testpass123");
    await page.getByRole("button", { name: "Sign Up" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: "New Note" }).click();

    await context.clearCookies({ name: "access_token" });
    await page.getByTestId("note-title-input").fill("Will not save");

    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });
  });
});
