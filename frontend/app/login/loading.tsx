import { Spinner } from "@/components/Spinner";

export default function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <Spinner label="Loading" size="lg" />
    </main>
  );
}
