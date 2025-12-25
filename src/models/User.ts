import { ObjectId, type Collection, type Db } from 'mongodb';
import { getMongoClient } from '../lib/mongodb';
import bcrypt from 'bcryptjs';

/**
 * User roles in the system
 */
export type Role = 'dev' | 'qc' | 'cto' | 'ceo' | 'admin';

/**
 * Valid roles array for validation
 */
export const VALID_ROLES: Role[] = ['dev', 'qc', 'cto', 'ceo', 'admin'];

/**
 * User interface representing a user document in MongoDB
 */
export interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  avatar?: string;
  teamIds?: string[];
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input type for creating a new user
 */
export type CreateUserInput = Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & {
  password: string;
};

/**
 * Validate that a role is valid
 */
export function isValidRole(role: string): role is Role {
  return VALID_ROLES.includes(role as Role);
}

/**
 * Validate that all roles in an array are valid
 */
export function validateRoles(roles: string[]): roles is Role[] {
  return roles.every(isValidRole);
}

/**
 * User Repository for CRUD operations
 */
export class UserRepository {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('users');
  }

  /**
   * Get a UserRepository instance
   */
  static async getInstance(): Promise<UserRepository> {
    const { db } = await getMongoClient();
    return new UserRepository(db);
  }


  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return this.collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  /**
   * Create a new user with validation
   */
  async create(input: Partial<CreateUserInput>): Promise<User> {
    // Validate email
    if (!input.email || input.email.trim() === '') {
      throw new Error('Email is required and cannot be empty');
    }

    // Validate password
    if (!input.password || input.password.trim() === '') {
      throw new Error('Password is required and cannot be empty');
    }

    // Check email uniqueness
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Validate roles if provided
    const roles = input.roles || ['dev']; // Default role is 'dev'
    if (!validateRoles(roles)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    const now = new Date();
    const user: Omit<User, '_id'> = {
      email: input.email.trim(),
      passwordHash,
      name: input.name || '',
      roles,
      isActive: input.isActive !== undefined ? input.isActive : true,
      avatar: input.avatar || '',
      teamIds: input.teamIds || [],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(user as User);
    return { ...user, _id: result.insertedId } as User;
  }

  /**
   * Update user roles
   */
  async updateRoles(id: string, roles: Role[]): Promise<User | null> {
    if (!validateRoles(roles)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { roles, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Verify password for a user
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    // Check if user has a password hash (for migration safety)
    if (!user.passwordHash) {
      console.error(`[User] User ${email} has no password hash. Run migration script.`);
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<User | null> {
    if (!newPassword || newPassword.trim() === '') {
      throw new Error('Password cannot be empty');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { passwordHash, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update user active status
   */
  async updateActiveStatus(id: string, isActive: boolean): Promise<User | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { isActive, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Update user info (name, email)
   */
  async updateInfo(id: string, updates: { name?: string; email?: string }): Promise<User | null> {
    // If email is being updated, check uniqueness
    if (updates.email) {
      const existing = await this.findByEmail(updates.email);
      if (existing && existing._id.toString() !== id) {
        throw new Error('Email already in use by another user');
      }
    }

    try {
      const result = await this.collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updates, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return this.collection.find().toArray();
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch {
      return false;
    }
  }

  /**
   * Ensure indexes are created
   */
  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ email: 1 }, { unique: true });
  }
}
