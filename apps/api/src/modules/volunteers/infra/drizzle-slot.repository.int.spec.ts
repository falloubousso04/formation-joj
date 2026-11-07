import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Discipline } from '../../disciplines/domain/discipline';
import { DrizzleDisciplineRepository } from '../../disciplines/infra/drizzle-discipline.repository';
import { Registration } from '../domain/registration';
import { Slot } from '../domain/slot';
import { DrizzleSlotRepository } from './drizzle-slot.repository';

const NOW = new Date('2026-10-31T09:00:00.123Z');

const volunteer = (slotId: string, n: number) =>
  Registration.create({
    id: randomUUID(),
    slotId,
    name: `Volunteer ${n}`,
    email: `volunteer${n}@example.org`,
    now: NOW,
  });

describe('DrizzleSlotRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleSlotRepository;
  let disciplineId: string;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleSlotRepository(connection.db);
    const discipline = Discipline.create({
      id: randomUUID(),
      name: 'Lutte',
      category: 'sports-de-combat',
      now: NOW,
    });
    await new DrizzleDisciplineRepository(connection.db).insert(discipline);
    disciplineId = discipline.id;
  });

  afterAll(() => connection?.close());

  const newSlot = () =>
    Slot.create({
      id: randomUUID(),
      disciplineId,
      startsAt: new Date('2026-11-01T09:00:00.000Z'),
      endsAt: new Date('2026-11-01T12:00:00.000Z'),
      capacity: 2,
      now: NOW,
    });

  it('001-AS1: reads back exactly what it wrote, with no registration', async () => {
    const slot = newSlot();
    await repository.insert(slot);

    expect(await repository.findById(slot.id)).toEqual(slot);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('001-AS1: refuses to delete a discipline that has a slot', async () => {
    const disciplines = new DrizzleDisciplineRepository(connection.db);
    const judo = Discipline.create({
      id: randomUUID(),
      name: 'Judo',
      category: 'sports-de-combat',
      now: NOW,
    });
    await disciplines.insert(judo);
    await repository.insert(
      Slot.create({
        id: randomUUID(),
        disciplineId: judo.id,
        startsAt: new Date('2026-11-01T09:00:00.000Z'),
        endsAt: new Date('2026-11-01T12:00:00.000Z'),
        capacity: 2,
        now: NOW,
      }),
    );

    await expect(disciplines.delete(judo.id)).rejects.toMatchObject({
      code: 'DISCIPLINE_IN_USE',
      kind: 'CONFLICT',
    });
    expect(await disciplines.findById(judo.id)).toEqual(judo);
  });

  it('001-AS3: reports 0 remaining places to the last of two simultaneous registrations', async () => {
    const slot = newSlot();
    await repository.insert(slot);

    const remaining = await Promise.all([
      repository.addRegistration(volunteer(slot.id, 1)),
      repository.addRegistration(volunteer(slot.id, 2)),
    ]);

    expect([...remaining].sort()).toEqual([0, 1]);
  });

  it('001-AS2: counts the stored registrations of a slot', async () => {
    const slot = newSlot();
    await repository.insert(slot);
    await repository.addRegistration(volunteer(slot.id, 1));

    expect(await repository.findById(slot.id)).toMatchObject({
      registrationCount: 1,
      remainingPlaces: 1,
    });
  });

  it('001-AS4: never stores more registrations than the capacity', async () => {
    const slot = newSlot();
    await repository.insert(slot);
    await repository.addRegistration(volunteer(slot.id, 1));
    await repository.addRegistration(volunteer(slot.id, 2));

    await expect(repository.addRegistration(volunteer(slot.id, 3))).rejects.toMatchObject({
      code: 'SLOT_FULL',
    });
    expect((await repository.findById(slot.id))?.registrationCount).toBe(2);
  });

  it('001-AS4: lets only one of two simultaneous registrations take the last place', async () => {
    const slot = newSlot();
    await repository.insert(slot);
    await repository.addRegistration(volunteer(slot.id, 1));

    const results = await Promise.allSettled([
      repository.addRegistration(volunteer(slot.id, 2)),
      repository.addRegistration(volunteer(slot.id, 3)),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: expect.objectContaining({ code: 'SLOT_FULL' }),
    });
    expect((await repository.findById(slot.id))?.registrationCount).toBe(2);
  });
});
