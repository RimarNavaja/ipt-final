import { Role } from "./role";

export interface Account {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  jwtToken?: string;
}
