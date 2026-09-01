// List of authorized Super Admin emails
export const SUPER_ADMIN_EMAILS = [
  "danielabishek60@gmail.com",
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
