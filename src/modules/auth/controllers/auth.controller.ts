"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/modules/auth/services/auth.service";

export async function loginAction(formData: FormData) {
  const result = await login(formData);
  if (result.ok) redirect("/dashboard");
  return result;
}

export async function logoutAction() {
  await logout();
}
