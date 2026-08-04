import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import { loginAction } from "./actions";

vi.mock("./actions", () => ({
  loginAction: vi.fn(),
}));

const mockedLoginAction = vi.mocked(loginAction);

describe("LoginForm", () => {
  beforeEach(() => {
    mockedLoginAction.mockReset();
  });

  it("renders email and password fields and a submit button", () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("masks the password by default and reveals it when the eye icon is toggled", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByPlaceholderText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows an inline error message when the server action returns one", async () => {
    mockedLoginAction.mockResolvedValue({ error: "Invalid email or password." });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Email address"), "jane@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
    });
  });

  it("links to the signup page for new visitors", () => {
    render(<LoginForm />);

    const link = screen.getByRole("link", { name: /never been here before/i });
    expect(link).toHaveAttribute("href", "/signup");
  });
});
