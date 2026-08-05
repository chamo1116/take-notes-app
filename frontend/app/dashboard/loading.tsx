import { Spinner } from "@/components/Spinner";

export default function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <Spinner label="Loading your notes" size="lg" />
    </main>
  );
}
