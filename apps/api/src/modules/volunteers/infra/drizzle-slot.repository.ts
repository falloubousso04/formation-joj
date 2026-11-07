import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { SlotRepository } from '../application/slot.repository';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';
import { slotFull, slotNotFound } from '../domain/volunteers.errors';
import { toDomain, toRow } from './slot.mapper';
import { registrations, slots } from './volunteers.schema';

type Executor = Pick<Database, 'select'>;

@Injectable()
export class DrizzleSlotRepository extends SlotRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Slot | null> {
    const [row] = await this.db.select().from(slots).where(eq(slots.id, id)).limit(1);
    return row ? toDomain(row, await countRegistrations(this.db, id)) : null;
  }

  async insert(slot: Slot): Promise<void> {
    await this.db.insert(slots).values(toRow(slot));
  }

  async addRegistration(registration: Registration): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Verrou sur la ligne du créneau : deux inscriptions simultanées comptent l'une après l'autre.
      const [row] = await tx
        .select({ capacity: slots.capacity })
        .from(slots)
        .where(eq(slots.id, registration.slotId))
        .for('update');
      if (!row) throw slotNotFound(registration.slotId);
      if ((await countRegistrations(tx, registration.slotId)) >= row.capacity) {
        throw slotFull(registration.slotId);
      }
      await tx.insert(registrations).values({
        id: registration.id,
        slotId: registration.slotId,
        name: registration.name,
        email: registration.email,
        createdAt: registration.createdAt,
      });
    });
  }
}

async function countRegistrations(executor: Executor, slotId: string): Promise<number> {
  const [result] = await executor
    .select({ value: count() })
    .from(registrations)
    .where(eq(registrations.slotId, slotId));
  return result?.value ?? 0;
}
