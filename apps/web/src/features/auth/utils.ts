export function redirectAfterLogin(systemRole: string) {
  return systemRole !== "user" ? "/admin/overview" : "/home";
}
