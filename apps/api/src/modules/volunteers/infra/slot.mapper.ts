import { Slot } from '../domain/slot';
import type { SlotRow } from './volunteers.schema';

/** Ligne de la table + nombre d'inscrits compté en base → entité. */
export function toDomain(row: SlotRow, registrationCount: number): Slot {
  return Slot.restore({
    id: row.id,
    disciplineId: row.disciplineId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    capacity: row.capacity,
    registrationCount,
    createdAt: row.createdAt,
  });
}

/** Entité → ligne de la table ; les inscrits vivent dans leur propre table. */
export function toRow(slot: Slot): SlotRow {
  return {
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: slot.capacity,
    createdAt: slot.createdAt,
  };
}
