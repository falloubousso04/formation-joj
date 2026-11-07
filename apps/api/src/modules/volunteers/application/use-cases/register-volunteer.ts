import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { RegisterVolunteerInput } from '@joj/shared';
import type { Registration } from '../../domain/registration';
import { slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

export interface RegisterVolunteerResult {
  registration: Registration;
  remainingPlaces: number;
}

@Injectable()
export class RegisterVolunteer {
  constructor(private readonly slots: SlotRepository) {}

  async execute(slotId: string, input: RegisterVolunteerInput): Promise<RegisterVolunteerResult> {
    const slot = await this.slots.findById(slotId);
    if (!slot) throw slotNotFound(slotId);
    // Le domaine refuse un créneau déjà plein ; le repository revérifie au moment d'écrire.
    const registration = slot.register({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      now: new Date(),
    });
    // Les places restantes viennent de l'écriture, pas de la lecture : une autre inscription a pu passer entre-temps.
    const remainingPlaces = await this.slots.addRegistration(registration);
    return { registration, remainingPlaces };
  }
}
