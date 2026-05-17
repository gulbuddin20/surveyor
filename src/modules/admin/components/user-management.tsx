import { ActionForm } from "@/components/ui/action-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { createUserAction } from "@/modules/admin/controllers/admin.controller";
import { UserActions } from "@/modules/admin/components/user-actions";

export function UserManagement({ users }: { users: Profile[] }) {
  return (
    <div className="atlas-reveal grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tambah user</CardTitle>
          <CardDescription>Buat akun surveyor atau super admin.</CardDescription>
        </CardHeader>
        <ActionForm
          action={createUserAction}
          className="space-y-4"
          resetOnSuccess
          successMessage="User baru dibuat."
          errorMessage="User gagal dibuat"
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password awal</Label>
            <Input id="password" name="password" type="password" minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select id="role" name="role" className="atlas-select">
              <option value="regular_user">Regular user</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked /> Aktif
          </label>
          <Button type="submit" className="w-full">Simpan user</Button>
        </ActionForm>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar user</CardTitle>
          <CardDescription>{users.length} user terdaftar.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.52)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--atlas-paper)]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-extrabold text-[var(--atlas-ink)]">{user.full_name}</p>
                  <p className="break-all text-sm text-[color:rgba(22,37,29,0.58)]">{user.email}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                    <p className="inline-flex rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.68)] px-2.5 py-1 text-xs font-extrabold text-[var(--atlas-canopy)]">
                      {user.role}
                    </p>
                    <p className="inline-flex rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.68)] px-2.5 py-1 text-xs font-extrabold text-[var(--atlas-ink)]">
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                  <UserActions user={user} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
