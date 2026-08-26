/** Matches backend-hrms's LeaveType model (see leaveType.validator.ts / leaveType.service.ts). */
export interface LeaveType {
  id?: string;
  name: string;
  description?: string | null;
  defaultDaysPerYear?: number | null;
  requiresApproval?: boolean;
  isPaid?: boolean;
  isActive?: boolean;
}
