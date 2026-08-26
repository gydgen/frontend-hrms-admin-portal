/** Matches backend-hrms's JobTitle model (see jobTitle.validator.ts / jobTitle.service.ts). */
export interface JobTitle {
  id?: string;
  title: string;
  departmentId?: string | null;
  createdAt?: string;
}
