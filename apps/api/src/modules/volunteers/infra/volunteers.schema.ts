// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const slots = pgTable(
  'slots',
  {
    id: uuid('id').primaryKey(),
    // Garantit qu'un créneau appartient à une discipline existante.
    disciplineId: uuid('discipline_id')
      .notNull()
      .references(() => disciplines.id),
    // Précision milliseconde = celle de Date en JavaScript.
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
    capacity: integer('capacity').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  // Doublent les règles du domaine.
  (table) => [
    check('slots_capacity_check', sql`${table.capacity} >= 1`),
    check('slots_ends_after_starts_check', sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id),
    name: varchar('name', { length: 100 }).notNull(),
    // Pas d'unicité en TR1 : la règle « un email, une inscription » arrive en TR2.
    email: varchar('email', { length: 254 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  // Sert au comptage des inscrits d'un créneau.
  (table) => [index('registrations_slot_id_idx').on(table.slotId)],
);

export type SlotRow = typeof slots.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
