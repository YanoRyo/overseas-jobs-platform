const adminIds = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(userId: string): boolean {
  return adminIds.includes(userId);
}
