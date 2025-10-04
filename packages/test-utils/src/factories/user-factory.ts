import { BaseFactory, createSequentialId } from './base-factory';
import type { TestUser, UserRole } from './types';

export class TestUserFactory extends BaseFactory<TestUser> {
  protected create(sequence: number): TestUser {
    const id = createSequentialId('user', sequence);
    const createdAt = new Date(Date.UTC(2024, 0, 1, 12, 0, sequence));

    return {
      id,
      displayName: `Test User ${sequence}`,
      email: `user${sequence}@example.com`,
      role: sequence === 1 ? 'dm' : 'player',
      avatarUrl: `https://example.com/avatars/${id}.png`,
      createdAt,
      updatedAt: createdAt,
    };
  }

  withRole(role: UserRole): TestUser {
    return this.build({ role });
  }
}

export const testUserFactory = () => new TestUserFactory();

export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser =>
  testUserFactory().build(overrides);
