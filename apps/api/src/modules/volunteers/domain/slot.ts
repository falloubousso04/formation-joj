import { type NewRegistration, Registration } from './registration';
import { slotFull, VolunteersError } from './volunteers.errors';

export interface SlotProps {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  registrationCount: number;
  createdAt: Date;
}

export interface NewSlot {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  /** Vérifiée ici : le domaine ne fait pas confiance à la validation HTTP. */
  capacity: number;
  now: Date;
}

/** Un créneau d'accueil pour une discipline, qui n'accepte pas plus d'inscrits que sa capacité. */
export class Slot {
  private constructor(private props: SlotProps) {}

  static create({ id, disciplineId, startsAt, endsAt, capacity, now }: NewSlot): Slot {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new VolunteersError('SLOT_CAPACITY_INVALID', 'Capacity must be at least 1', {
        capacity,
      });
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new VolunteersError('SLOT_END_NOT_AFTER_START', 'The end must come after the start', {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    }
    return new Slot({
      id,
      disciplineId,
      startsAt,
      endsAt,
      capacity,
      registrationCount: 0,
      createdAt: now,
    });
  }

  /** Reconstruit un créneau depuis la persistance, sans rejouer les règles de création. */
  static restore(props: SlotProps): Slot {
    return new Slot({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get disciplineId(): string {
    return this.props.disciplineId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get registrationCount(): number {
    return this.props.registrationCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get remainingPlaces(): number {
    return this.props.capacity - this.props.registrationCount;
  }

  /** Prend une place ; un créneau complet refuse, et une inscription invalide ne prend rien. */
  register(volunteer: NewVolunteer): Registration {
    if (this.remainingPlaces <= 0) {
      throw slotFull(this.id);
    }
    const registration = Registration.create({ ...volunteer, slotId: this.id });
    this.props = { ...this.props, registrationCount: this.props.registrationCount + 1 };
    return registration;
  }
}

export type NewVolunteer = Omit<NewRegistration, 'slotId'>;
