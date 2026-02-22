export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function daLiJeValidanEmail(email: string): boolean {
  return emailRegex.test(email.trim().toLowerCase());
}