import { FiklingoLogo } from "@/components/brand/fiklingo-logo";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--atlas-lagoon)]/20 blur-3xl" />
      <Card className="atlas-reveal relative w-full max-w-md">
        <CardHeader>
          <FiklingoLogo markClassName="h-16 w-16 rounded-3xl" />
          <CardTitle className="mt-5 text-4xl">FIKLINGO</CardTitle>
          <CardDescription>
            Form Kesehatan Lingkungan Online. Masuk untuk mengelola dan mengisi inspeksi kesehatan lingkungan.
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  );
}
