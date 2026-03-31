/**
 * Represents a user within the authentication system.
 *
 * @property id - Unique identifier for the user.
 * @property username - The user's login name.
 * @property firstName - The user's first name.
 * @property lastName - The user's last name.
 * @property email - The user's email address.
 * @property status - Indicates whether the user is active (true) or inactive (false).
 * @property roles - (Optional) Array of roles assigned to the user.
 */
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  status: boolean;
  roles?: string[];
}
