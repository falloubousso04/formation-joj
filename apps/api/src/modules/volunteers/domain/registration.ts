import { REGISTRATION_EMAIL_MAX_LENGTH, REGISTRATION_NAME_MAX_LENGTH } from '@joj/shared';
import { VolunteersError } from './volunteers.errors';

export interface RegistrationProps {
  id: string;
  slotId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface NewRegistration {
  id: string;
  slotId: string;
  name: string;
  email: string;
  now: Date;
}

// Volontairement simple : une partie locale, un @, un domaine avec un point, sans espace.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Un bénévole inscrit sur un créneau : un nom non vide et un email bien formé. */
export class Registration {
  private constructor(private readonly props: RegistrationProps) {}

  static create({ id, slotId, name, email, now }: NewRegistration): Registration {
    return new Registration({
      id,
      slotId,
      name: validName(name),
      email: validEmail(email),
      createdAt: now,
    });
  }

  /** Reconstruit une inscription depuis la persistance, sans rejouer les règles de création. */
  static restore(props: RegistrationProps): Registration {
    return new Registration({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get slotId(): string {
    return this.props.slotId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function validName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > REGISTRATION_NAME_MAX_LENGTH) {
    throw new VolunteersError(
      'REGISTRATION_NAME_REQUIRED',
      `A volunteer needs a name of 1 to ${REGISTRATION_NAME_MAX_LENGTH} characters`,
      { field: 'name' },
    );
  }
  return trimmed;
}

function validEmail(email: string): string {
  const trimmed = email.trim();
  if (trimmed.length > REGISTRATION_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmed)) {
    throw new VolunteersError('REGISTRATION_EMAIL_INVALID', 'The email is malformed', {
      field: 'email',
    });
  }
  return trimmed;
}
