import { db } from '../../db';

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  image?: string;
}

export class AuthRepository {
  /**
   * Finds a user by their email address.
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return await db.queryOne<User>(
      'SELECT id, email, username, name, image FROM users WHERE email = $1',
      [email]
    );
  }
}
