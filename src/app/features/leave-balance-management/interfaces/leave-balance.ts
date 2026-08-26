/** Matches backend-hrms's LeaveBalance model, joined with its LeaveType (see leaveBalance.service.ts). */
export interface LeaveBalance {
  id: string;
  tenantId?: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
  leaveType?: { id: string; name: string; isPaid: boolean };
  createdAt?: string;
  updatedAt?: string;
}
