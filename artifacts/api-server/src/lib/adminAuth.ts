const ADMIN_ACCOUNTS: Record<string, { password: string; role: string }> = {
  ducky: { password: "adminducky", role: "admin" },
  critz: { password: "ownercritz", role: "owner" },
};

export function validateAdmin(
  username: string,
  password: string
): { username: string; role: string } | null {
  const account = ADMIN_ACCOUNTS[username.toLowerCase()];
  if (!account) return null;
  if (account.password !== password) return null;
  return { username, role: account.role };
}
