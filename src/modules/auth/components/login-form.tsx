"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/modules/auth/controllers/auth.controller";

const initialState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    const result = await loginAction(formData);
    return { ok: result.ok, message: result.message ?? "" };
  }, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>
      {state.message ? (
        <p className="rounded-2xl border border-[color:rgba(242,111,76,0.24)] bg-[color:rgba(242,111,76,0.12)] px-3 py-2 text-sm font-semibold text-[#b84025]">{state.message}</p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}
