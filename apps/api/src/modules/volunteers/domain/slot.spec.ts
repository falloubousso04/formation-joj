import { describe, expect, it } from 'vitest';
import { Slot } from './slot';
import { VolunteersError } from './volunteers.errors';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000101';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000001';
const STARTS_AT = new Date('2026-11-01T09:00:00.000Z');
const ENDS_AT = new Date('2026-11-01T12:00:00.000Z');

const open = (overrides: Partial<Parameters<typeof Slot.create>[0]> = {}) =>
  Slot.create({
    id: SLOT_ID,
    disciplineId: DISCIPLINE_ID,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    capacity: 2,
    now: NOW,
    ...overrides,
  });

describe('Slot', () => {
  it('001-AS1: opens a slot with its capacity and all places remaining', () => {
    const slot = open();
    expect(slot).toMatchObject({
      id: SLOT_ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registrationCount: 0,
      remainingPlaces: 2,
      createdAt: NOW,
    });
  });

  it('001-AS1: restores a slot with its registration count', () => {
    const slot = Slot.restore({
      id: SLOT_ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registrationCount: 1,
      createdAt: NOW,
    });
    expect(slot.remainingPlaces).toBe(1);
  });

  it.each([0, -1, 1.5])('001-AS7: rejects a capacity of %d', (capacity) => {
    expect(() => open({ capacity })).toThrow(VolunteersError);
    expect(() => open({ capacity })).toThrow(
      expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
    );
  });

  it.each([
    ['equal to', STARTS_AT],
    ['before', new Date('2026-11-01T08:00:00.000Z')],
  ])('001-AS8: rejects an end %s the start', (_label, endsAt) => {
    expect(() => open({ endsAt })).toThrow(
      expect.objectContaining({ code: 'SLOT_END_NOT_AFTER_START', kind: 'VALIDATION' }),
    );
  });
});
