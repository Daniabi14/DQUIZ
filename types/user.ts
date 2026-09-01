export type UserRole = "admin" | "host" | "student";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  institution?: string;
  department?: string;
  createdAt?: any;
  updatedAt?: any;
  disabled?: boolean;
}
