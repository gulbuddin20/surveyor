import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#bbf7d0_0,#f8fafc_34rem)] px-4 py-10">
      <Card className="w-full max-w-md shadow-xl shadow-slate-900/10">
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
