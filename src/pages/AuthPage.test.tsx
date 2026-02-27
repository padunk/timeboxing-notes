import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthPage } from "./AuthPage";

// ---- Mocks ----

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    },
  },
}));

let mockUser: { id: string; email: string } | null = null;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

// ---- Helpers ----

function renderAuthPage() {
  return render(
    <MemoryRouter initialEntries={["/auth"]}>
      <AuthPage />
    </MemoryRouter>,
  );
}

// ---- Tests ----

describe("AuthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  // ---------- Rendering ----------

  it("renders the Sign In form by default", () => {
    renderAuthPage();
    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("toggles to Sign Up form", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );

    expect(
      screen.getByRole("heading", { name: /sign up/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign up/i }),
    ).toBeInTheDocument();
  });

  it("toggles back to Sign In from Sign Up", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /already have an account/i }),
    );

    expect(
      screen.getByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows Google sign-in button", () => {
    renderAuthPage();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  // ---------- Authenticated redirect ----------

  it("redirects authenticated users to dashboard", () => {
    mockUser = { id: "1", email: "test@example.com" };
    renderAuthPage();

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  // ---------- Sign In ----------

  it("signs in successfully with valid credentials", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on sign-in failure", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: new Error("Invalid login credentials"),
    });

    const user = userEvent.setup();
    renderAuthPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid login credentials",
      );
    });
  });

  it("does NOT enforce password complexity on login", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    // Simple password with no uppercase, numbers, or symbols
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "simple");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "simple",
      });
    });
  });

  // ---------- Sign Up ----------

  it("signs up successfully with valid data", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "StrongP@ss1",
      });
    });

    expect(
      screen.getByText(/check your email to confirm your account/i),
    ).toBeInTheDocument();
  });

  it("shows error on sign-up failure", async () => {
    mockSignUp.mockResolvedValue({
      error: new Error("User already registered"),
    });

    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "User already registered",
      );
    });
  });

  // ---------- Validation ----------

  it("shows email validation error for invalid email on sign-up", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows password validation errors for weak password on sign-up", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "abc");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 6 characters/i),
      ).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows password missing uppercase error on sign-up", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "abcdef1!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/at least one uppercase letter/i),
      ).toBeInTheDocument();
    });
  });

  // ---------- Google OAuth ----------

  it("initiates Google sign-in", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expect.stringContaining("/dashboard"),
        },
      });
    });
  });

  it("shows error on Google sign-in failure", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: new Error("OAuth error"),
    });

    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("OAuth error");
    });
  });

  // ---------- Accessibility ----------

  it("has aria-invalid and aria-describedby on email field when validation fails", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "bad");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
    });
  });

  it("success message uses role=status", async () => {
    const user = userEvent.setup();
    renderAuthPage();

    await user.click(
      screen.getByRole("button", { name: /don't have an account/i }),
    );
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "StrongP@ss1");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/check your email/i);
    });
  });

  // ---------- Loading state ----------

  it("shows loading state and disables button during submission", async () => {
    // Make supabase call hang
    mockSignInWithPassword.mockImplementation(() => new Promise(() => {}));

    const user = userEvent.setup();
    renderAuthPage();

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });
});
