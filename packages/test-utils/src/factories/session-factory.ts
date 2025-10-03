import { BaseFactory, createSequentialId } from './base-factory';
import { TestUserFactory } from './user-factory';
import type { TestSession, TestSessionParticipant } from './types';

const userFactory = new TestUserFactory();

export class TestSessionFactory extends BaseFactory<TestSession> {
  protected create(sequence: number): TestSession {
    const sessionId = createSequentialId('session', sequence);
    const startedAt = new Date(Date.UTC(2024, 0, 2, 18, sequence % 60));
    const participants = this.createParticipants(sequence);

    const session: TestSession = {
      sessionId,
      title: `Session ${sequence}`,
      description: `Automated test session #${sequence}`,
      status: 'running',
      startedAt,
      participants,
    };

    if (sequence % 5 === 0) {
      session.endedAt = new Date(startedAt.getTime() + 60 * 60 * 1000);
      session.status = 'completed';
    }

    return session;
  }

  private createParticipants(sequence: number): TestSessionParticipant[] {
    const count = Math.max(2, (sequence % 4) + 2);
    return Array.from({ length: count }, (_, index) => {
      const user = userFactory.build({
        role: index === 0 ? 'dm' : 'player',
      });
      return {
        user,
        characterName: index === 0 ? 'Narrator' : `Hero ${sequence}-${index}`,
        isSpeaking: index === 1,
        joinedAt: new Date(Date.UTC(2024, 0, 2, 17, 45 + index)),
      };
    });
  }
}

export const testSessionFactory = () => new TestSessionFactory();

export const createTestSession = (
  overrides: Partial<TestSession> = {}
): TestSession => testSessionFactory().build(overrides);
