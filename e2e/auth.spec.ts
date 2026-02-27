import { test, expect } from "@playwright/test";

test.describe("Auth Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  // ---------- Rendering ----------

  test("renders Sign In form by default", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  test("toggles between Sign In and Sign Up", async ({ page }) => {
    // Start on Sign In
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    // Switch to Sign Up
    await page.getByRole("button", { name: /don't have an account/i }).click();
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();

    // Switch back to Sign In
    await page
      .getByRole("button", { name: /already have an account/i })
      .click();
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  // ---------- Client-side validation ----------

  test("shows email validation error for invalid email on sign-up", async ({
    page,
  }) => {
    // Switch to Sign Up mode
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("StrongP@ss1");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("shows password too-short error on sign-up", async ({ page }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("Ab1!");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(
      page.getByText(/password must be at least 6 characters/i),
    ).toBeVisible();
  });

  test("shows password missing uppercase error on sign-up", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("abcdef1!");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(
      page.getByText(/at least one uppercase letter/i),
    ).toBeVisible();
  });

  test("shows password missing number error on sign-up", async ({ page }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("Abcdef!");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByText(/at least one number/i)).toBeVisible();
  });

  test("shows password missing symbol error on sign-up", async ({ page }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("Abcdef1a");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByText(/at least one symbol/i)).toBeVisible();
  });

  // ---------- Login does not enforce complexity ----------

  test("login allows simple password without complexity errors", async ({
    page,
  }) => {
    await page.getByLabel(/email/i).fill("user@example.com");
    await page.getByLabel(/password/i).fill("simple");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should NOT see password complexity errors
    await expect(
      page.getByText(/at least one uppercase letter/i),
    ).not.toBeVisible();
    await expect(page.getByText(/at least one number/i)).not.toBeVisible();
    await expect(page.getByText(/at least one symbol/i)).not.toBeVisible();
  });

  // ---------- Accessibility ----------

  test("email field has aria-invalid when validation fails", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("bad");
    await page.getByLabel(/password/i).fill("StrongP@ss1");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByLabel(/email/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("error messages have proper role attributes", async ({ page }) => {
    await page.getByRole("button", { name: /don't have an account/i }).click();

    await page.getByLabel(/email/i).fill("bad");
    await page.getByLabel(/password/i).fill("StrongP@ss1");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Validation error should have role="alert"
    await expect(page.getByRole("alert").first()).toBeVisible();
  });
});
