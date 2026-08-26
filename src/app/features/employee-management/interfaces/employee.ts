export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'TEMPORARY';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

/**
 * Matches backend-hrms's Employee model (see employee.validator.ts / employee.service.ts).
 * `salary`/`bankName`/`bankAccountNumber`/`nationalId` are sensitive — the backend strips
 * them from any response unless the caller holds `employee.manage_sensitive` or is viewing
 * their own record (see `sanitizeEmployee`), so they're always optional here too.
 */
export interface Employee {
  id?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  managerId?: string | null;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
  hireDate: string;
  terminationDate?: string | null;
  salary?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  nationalId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
