/** Matches backend-hrms's Department model (see department.validator.ts / department.service.ts). */
export interface Department {
  id?: string;
  name: string;
  description?: string | null;
  headUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
