import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Surveyor IKL</CardTitle>
          <CardDescription>
            Masuk untuk mengelola dan mengisi inspeksi kesehatan lingkungan.
          </CardDescription>
        </CardHeader>
        <LoginForm />
      </Card>
    </main>
  );
}
