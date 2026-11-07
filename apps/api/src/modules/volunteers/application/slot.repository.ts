import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleSlotRepository (infra) et InMemorySlotRepository (tests).
 */
export abstract class SlotRepository {
  /** Le créneau avec son nombre d'inscrits, ou null. */
  abstract findById(id: string): Promise<Slot | null>;
  abstract insert(slot: Slot): Promise<void>;
  /**
   * Enregistre l'inscription ; lève SLOT_FULL si le créneau est déjà plein au moment de l'écriture,
   * pour que deux inscriptions simultanées ne prennent pas la même dernière place.
   * Renvoie les places restantes comptées au moment de l'écriture, et non celles d'une lecture antérieure.
   */
  abstract addRegistration(registration: Registration): Promise<number>;
}
