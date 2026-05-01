import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/schemas";
import type { Profile } from "@/lib/types";
import {
  getCurrentProfile,
  signInWithPassword,
  signOut,
} from "@/modules/auth/repositories/auth.repository";

export type AuthResult = {
  ok: boolean;
  message?: string;
};

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) redirect("/login");
  return profile;
}

export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "super_admin") redirect("/dashboard");
  return profile;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Login tidak valid" };
  }

  const { error } = await signInWithPassword(parsed.data.email, parsed.data.password);
  if (error) return { ok: false, message: "Email atau password tidak sesuai" };
  return { ok: true };
}

export async function logout() {
  await signOut();
  redirect("/login");
}
