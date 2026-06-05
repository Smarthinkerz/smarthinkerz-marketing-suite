import { getAdminUsers } from "../actions";
import { UsersClient } from "./users-client";
import { isSetupMode } from "@/lib/session";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  return <UsersClient users={users} setupMode={isSetupMode()} />;
}
