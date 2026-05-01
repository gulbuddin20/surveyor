import { AppShell } from "@/components/layout/app-shell";
import { requireProfile } from "@/modules/auth/services/auth.service";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return <AppShell profile={profile}>{children}</AppShell>;
}
