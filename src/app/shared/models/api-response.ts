/**
 * The standard response envelope every backend-hrms endpoint returns
 * (see backend-hrms/src/shared/utils/response.ts's `successResponse`).
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
