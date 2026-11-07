import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const VOLUNTEERS_ERROR_KINDS = {
  /** Capacité non entière ou inférieure à 1. */
  SLOT_CAPACITY_INVALID: 'VALIDATION',
  /** Fin égale ou antérieure au début. */
  SLOT_END_NOT_AFTER_START: 'VALIDATION',
  /** Aucun créneau n'a cet identifiant. */
  SLOT_NOT_FOUND: 'NOT_FOUND',
  /** Le créneau a autant d'inscrits que de places. */
  SLOT_FULL: 'CONFLICT',
  /** Nom vide, ou fait seulement d'espaces. */
  REGISTRATION_NAME_REQUIRED: 'VALIDATION',
  REGISTRATION_EMAIL_INVALID: 'VALIDATION',
} as const satisfies Record<string, ErrorKind>;

export type VolunteersErrorCode = keyof typeof VOLUNTEERS_ERROR_KINDS;

export class VolunteersError extends AppError<VolunteersErrorCode> {
  constructor(code: VolunteersErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, VOLUNTEERS_ERROR_KINDS[code], message, details);
  }
}

export function slotFull(id: string): VolunteersError {
  return new VolunteersError('SLOT_FULL', `Slot ${id} is full`, { id });
}

export function slotNotFound(id: string): VolunteersError {
  return new VolunteersError('SLOT_NOT_FOUND', `No slot with id ${id}`, { id });
}
