import { UserManagement } from "@/modules/admin/components/user-management";
import { loadUsersController } from "@/modules/admin/controllers/admin.controller";

export default async function AdminUsersPage() {
  const { users } = await loadUsersController();
  return <UserManagement users={users} />;
}
