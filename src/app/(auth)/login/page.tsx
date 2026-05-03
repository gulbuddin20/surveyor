import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--atlas-lagoon)]/20 blur-3xl" />
      <Card className="atlas-reveal relative w-full max-w-md">
        <CardHeader>
          <p className="atlas-kicker w-fit">Field access</p>
          <CardTitle className="mt-4 text-4xl">Surveyor IKL</CardTitle>
          <CardDescription>
            Masuk untuk mengelola dan mengisi inspeksi kesehatan lingkungan.
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  );
}
