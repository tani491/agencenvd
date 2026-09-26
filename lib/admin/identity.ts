export function isAdminIdentity({
  email,
  appMetadata
}: {
  email?: string | null;
  appMetadata?: Record<string, unknown> | null;
}) {
  const role = appMetadata?.role;
  const roles = appMetadata?.roles;

  if (role === "admin") {
    return true;
  }

  if (Array.isArray(roles) && roles.includes("admin")) {
    return true;
  }

  return getAdminEmailAllowlist().has((email ?? "").toLowerCase());
}

function getAdminEmailAllowlist() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}
