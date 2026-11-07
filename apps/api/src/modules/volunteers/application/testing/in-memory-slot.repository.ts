import { Registration } from '../../domain/registration';
import { Slot } from '../../domain/slot';
import { slotFull, slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

/** Fake fidèle au contrat du port (comptage des inscrits, refus d'un créneau plein), sans base. */
export class InMemorySlotRepository extends SlotRepository {
  private readonly slots = new Map<string, Slot>();
  private readonly registrations: Registration[] = [];

  async findById(id: string): Promise<Slot | null> {
    const found = this.slots.get(id);
    return found ? this.withCount(found) : null;
  }

  async insert(slot: Slot): Promise<void> {
    this.slots.set(slot.id, this.withCount(slot));
  }

  async addRegistration(registration: Registration): Promise<number> {
    // Lecture, vérification et écriture sans `await` entre elles : comme le verrou du repository
    // Drizzle, deux inscriptions simultanées comptent l'une après l'autre.
    const stored = this.slots.get(registration.slotId);
    // Comme la clé étrangère en base : pas d'inscription sur un créneau inexistant.
    if (!stored) throw slotNotFound(registration.slotId);
    const slot = this.withCount(stored);
    if (slot.remainingPlaces <= 0) throw slotFull(slot.id);
    this.registrations.push(Registration.restore(snapshot(registration)));
    return slot.remainingPlaces - 1;
  }

  /** Pour les tests : vérifier que rien n'a été enregistré. */
  slotCount(): number {
    return this.slots.size;
  }

  registrationCount(): number {
    return this.registrations.length;
  }

  /** Copie avec le nombre d'inscrits réellement stockés : un test ne voit que ce qui est persisté. */
  private withCount(slot: Slot): Slot {
    return Slot.restore({
      id: slot.id,
      disciplineId: slot.disciplineId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      capacity: slot.capacity,
      registrationCount: this.registrations.filter((r) => r.slotId === slot.id).length,
      createdAt: slot.createdAt,
    });
  }
}

function snapshot(registration: Registration) {
  return {
    id: registration.id,
    slotId: registration.slotId,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt,
  };
}
