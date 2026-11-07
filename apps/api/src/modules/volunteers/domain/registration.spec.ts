import { describe, expect, it } from 'vitest';
import { Registration } from './registration';
import { VolunteersError } from './volunteers.errors';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000201';
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000101';

const register = (name: string, email: string) =>
  Registration.create({ id: ID, slotId: SLOT_ID, name, email, now: NOW });

describe('Registration', () => {
  it('001-AS2: keeps the trimmed name and the email of the volunteer', () => {
    expect(register('  Awa Diop ', 'awa@example.org')).toMatchObject({
      id: ID,
      slotId: SLOT_ID,
      name: 'Awa Diop',
      email: 'awa@example.org',
      createdAt: NOW,
    });
  });

  it.each(['', '   '])('001-AS9: rejects a volunteer without a name (%j)', (name) => {
    expect(() => register(name, 'awa@example.org')).toThrow(VolunteersError);
    expect(() => register(name, 'awa@example.org')).toThrow(
      expect.objectContaining({ code: 'REGISTRATION_NAME_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it.each(['not-an-email', 'awa@', '@example.org', 'awa diop@example.org'])(
    '001-AS9: rejects a malformed email (%j)',
    (email) => {
      expect(() => register('Awa Diop', email)).toThrow(
        expect.objectContaining({ code: 'REGISTRATION_EMAIL_INVALID', kind: 'VALIDATION' }),
      );
    },
  );
});
