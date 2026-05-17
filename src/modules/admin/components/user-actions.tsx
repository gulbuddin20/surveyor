"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionMenuItem, ResponsiveActionMenu } from "@/components/ui/responsive-action-menu";
import type { Profile } from "@/lib/types";
import { deleteUserAction, updateUserAction } from "@/modules/admin/controllers/admin.controller";

export function UserActions({ user }: { user: Profile }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <ResponsiveActionMenu title="Aksi user" description={`Kelola akun ${user.email}.`}>
        <ActionMenuItem onClick={() => setIsEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit user
        </ActionMenuItem>
        <ActionForm
          action={deleteUserAction}
          className="contents"
          confirmActionLabel="Hapus user"
          confirmDescription={`User ${user.email} akan dihapus jika belum memiliki riwayat survei. Jika sudah memiliki riwayat, nonaktifkan user agar data tetap utuh.`}
          confirmTitle="Hapus user?"
          confirmVariant="destructive"
          errorMessage="User gagal dihapus"
          successMessage="User dihapus."
        >
          <input type="hidden" name="userId" value={user.id} />
          <ActionMenuItem type="submit" className="text-[var(--atlas-coral)] hover:bg-[color:rgba(242,111,76,0.1)]">
            <Trash2 className="h-4 w-4" />
            Hapus user
          </ActionMenuItem>
        </ActionForm>
      </ResponsiveActionMenu>

      <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(22,37,29,0.38)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[2rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-paper)] p-5 text-[var(--atlas-ink)] shadow-[0_-28px_72px_rgba(22,37,29,0.22)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,640px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:shadow-[0_28px_72px_rgba(22,37,29,0.26)] sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[color:rgba(22,37,29,0.16)] sm:hidden" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Dialog.Title className="text-xl font-black text-[var(--atlas-ink)]">Edit user</Dialog.Title>
                <Dialog.Description className="mt-2 break-all text-sm font-semibold leading-6 text-[color:rgba(22,37,29,0.62)]">
                  Perbarui nama, email, role, status aktif, atau password untuk {user.email}.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.72)] text-[var(--atlas-ink)] transition hover:bg-[color:rgba(22,37,29,0.06)]"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <ActionForm
              action={updateUserAction}
              className="mt-5 grid gap-4 md:grid-cols-2"
              confirmActionLabel="Simpan user"
              confirmDescription={`Perubahan untuk ${user.email} akan disimpan ke database dan Supabase Auth.`}
              confirmTitle="Simpan perubahan user?"
              errorMessage="User gagal diperbarui"
              successMessage="User diperbarui."
            >
              <input type="hidden" name="userId" value={user.id} />
              <div className="space-y-2">
                <Label htmlFor={`fullName-${user.id}`}>Nama</Label>
                <Input id={`fullName-${user.id}`} name="fullName" defaultValue={user.full_name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`email-${user.id}`}>Email</Label>
                <Input id={`email-${user.id}`} name="email" type="email" defaultValue={user.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`password-${user.id}`}>Password baru</Label>
                <Input id={`password-${user.id}`} name="password" type="password" minLength={8} placeholder="Kosongkan jika tidak diganti" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`role-${user.id}`}>Role</Label>
                <select id={`role-${user.id}`} name="role" defaultValue={user.role} className="atlas-select">
                  <option value="regular_user">Regular user</option>
                  <option value="super_admin">Super admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
                <input name="isActive" type="checkbox" defaultChecked={user.is_active} /> Aktif
              </label>
              <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Batal</Button>
                </Dialog.Close>
                <Button type="submit" variant="secondary">Simpan perubahan</Button>
              </div>
            </ActionForm>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
