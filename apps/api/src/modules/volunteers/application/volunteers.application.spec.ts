import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryDisciplineRepository } from '../../disciplines/application/testing/in-memory-discipline.repository';
import { Discipline } from '../../disciplines/domain/discipline';
import { InMemorySlotRepository } from './testing/in-memory-slot.repository';
import { OpenSlot } from './use-cases/open-slot';
import { RegisterVolunteer } from './use-cases/register-volunteer';

const LUTTE_ID = '0199f5c2-0000-7000-8000-000000000001';
const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';
const MORNING = {
  disciplineId: LUTTE_ID,
  startsAt: '2026-11-01T09:00:00.000Z',
  endsAt: '2026-11-01T12:00:00.000Z',
  capacity: 2,
};

async function setup() {
  const disciplines = new InMemoryDisciplineRepository();
  await disciplines.insert(
    Discipline.create({
      id: LUTTE_ID,
      name: 'Lutte',
      category: 'sports-de-combat',
      now: new Date('2026-10-31T09:00:00.000Z'),
    }),
  );
  const slots = new InMemorySlotRepository();
  return {
    slots,
    openSlot: new OpenSlot(slots, disciplines),
    registerVolunteer: new RegisterVolunteer(slots),
  };
}

describe('volunteers (application layer)', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    ctx = await setup();
  });

  it('001-AS1: opens a slot for an existing discipline and stores it', async () => {
    const slot = await ctx.openSlot.execute(MORNING);

    expect(slot).toMatchObject({
      disciplineId: LUTTE_ID,
      startsAt: new Date(MORNING.startsAt),
      endsAt: new Date(MORNING.endsAt),
      capacity: 2,
      remainingPlaces: 2,
    });
    expect(await ctx.slots.findById(slot.id)).toEqual(slot);
  });

  it('001-AS2: registers a volunteer, one place remains', async () => {
    const slot = await ctx.openSlot.execute(MORNING);

    const { registration, remainingPlaces } = await ctx.registerVolunteer.execute(slot.id, {
      name: 'Awa Diop',
      email: 'awa@example.org',
    });

    expect(registration).toMatchObject({
      slotId: slot.id,
      name: 'Awa Diop',
      email: 'awa@example.org',
    });
    expect(remainingPlaces).toBe(1);
    expect((await ctx.slots.findById(slot.id))?.remainingPlaces).toBe(1);
  });

  it('001-AS5: reports an unknown slot as not found', async () => {
    await expect(
      ctx.registerVolunteer.execute(UNKNOWN_ID, { name: 'Awa Diop', email: 'awa@example.org' }),
    ).rejects.toMatchObject({ code: 'SLOT_NOT_FOUND', kind: 'NOT_FOUND' });
    expect(ctx.slots.registrationCount()).toBe(0);
  });

  it('001-AS6: reports an unknown discipline as not found', async () => {
    await expect(
      ctx.openSlot.execute({ ...MORNING, disciplineId: UNKNOWN_ID }),
    ).rejects.toMatchObject({ code: 'DISCIPLINE_NOT_FOUND', kind: 'NOT_FOUND' });
    expect(ctx.slots.slotCount()).toBe(0);
  });
});
