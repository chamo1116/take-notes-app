import type { Metadata } from "next";
import { AuthLayout } from "@/components/AuthLayout";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <AuthLayout imageSrc="/assets/cow.png" imageWidth={200} imageHeight={143} heading="Yay, New Friend!">
      <SignupForm />
    </AuthLayout>
  );
}
