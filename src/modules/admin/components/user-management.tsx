import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { createUserAction } from "@/modules/admin/controllers/admin.controller";

export function UserManagement({ users }: { users: Profile[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tambah user</CardTitle>
          <CardDescription>Buat akun surveyor atau super admin.</CardDescription>
        </CardHeader>
        <form action={createUserAction} className="space-y-4">
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
            <select id="role" name="role" className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
              <option value="regular_user">Regular user</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked /> Aktif
          </label>
          <Button type="submit" className="w-full">Simpan user</Button>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar user</CardTitle>
          <CardDescription>{users.length} user terdaftar.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/40">
              <p className="font-semibold text-slate-950">{user.full_name}</p>
              <p className="break-all text-sm text-slate-500">{user.email}</p>
              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">{user.role}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
