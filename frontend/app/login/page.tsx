import type { Metadata } from "next";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <AuthLayout imageSrc="/assets/cactus.png" imageWidth={134} imageHeight={160} heading="Yay, You're Back!">
      <LoginForm />
    </AuthLayout>
  );
}
