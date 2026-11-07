import { z } from 'zod';

export const REGISTRATION_NAME_MAX_LENGTH = 100;
export const REGISTRATION_EMAIL_MAX_LENGTH = 254;

const CAPACITY_MESSAGE = 'Capacity must be at least 1';

/** Corps de `POST /api/slots`. */
export const openSlotSchema = z
  .object({
    disciplineId: z.uuid(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    // Même message pour une capacité non entière que pour une capacité trop petite.
    capacity: z.int(CAPACITY_MESSAGE).min(1, CAPACITY_MESSAGE),
  })
  .refine((input) => new Date(input.endsAt) > new Date(input.startsAt), {
    message: 'The end must come after the start',
    path: ['endsAt'],
  });
export type OpenSlotInput = z.infer<typeof openSlotSchema>;

/** Corps de `POST /api/slots/:slotId/registrations`. */
export const registerVolunteerSchema = z.object({
  name: z.string().trim().min(1).max(REGISTRATION_NAME_MAX_LENGTH),
  email: z.email().max(REGISTRATION_EMAIL_MAX_LENGTH),
});
export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;

/** Paramètre `:slotId` des routes d'un créneau. */
export const slotIdParamsSchema = z.object({ slotId: z.uuid() });

/** Un créneau tel que l'API le renvoie. */
export const slotSchema = z.object({
  id: z.uuid(),
  disciplineId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.int(),
  remainingPlaces: z.int(),
  createdAt: z.iso.datetime(),
});
export type SlotResponse = z.infer<typeof slotSchema>;

/** Une inscription telle que l'API la renvoie, avec les places restantes du créneau. */
export const registrationSchema = z.object({
  id: z.uuid(),
  slotId: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
  remainingPlaces: z.int(),
});
export type RegistrationResponse = z.infer<typeof registrationSchema>;
