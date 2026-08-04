import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./SignupForm";
import { signupAction } from "./actions";

vi.mock("./actions", () => ({
  signupAction: vi.fn(),
}));

const mockedSignupAction = vi.mocked(signupAction);

describe("SignupForm", () => {
  beforeEach(() => {
    mockedSignupAction.mockReset();
  });

  it("renders email and password fields and a submit button", () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("masks the password by default and reveals it when the eye icon is toggled", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const passwordInput = screen.getByPlaceholderText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows an inline error message when the server action returns one", async () => {
    mockedSignupAction.mockResolvedValue({ error: "A user with this email already exists." });
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByPlaceholderText("Email address"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "testpass123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByTestId("signup-message")).toHaveTextContent(
        "A user with this email already exists.",
      );
    });
  });

  it("links back to the login page for existing users", () => {
    render(<SignupForm />);

    const link = screen.getByRole("link", { name: /already friends/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
