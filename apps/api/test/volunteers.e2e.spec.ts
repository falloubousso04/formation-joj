import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, registrationSchema, slotSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';
const STARTS_AT = '2026-11-01T09:00:00.000Z';
const ENDS_AT = '2026-11-01T12:00:00.000Z';

describe('/api/slots (e2e)', () => {
  let app: INestApplication;
  let lutteId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    lutteId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  const morning = () => ({
    disciplineId: lutteId,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    capacity: 2,
  });

  const openSlot = async () =>
    slotSchema.parse((await api().post('/api/slots').send(morning()).expect(201)).body);

  const register = (slotId: string, name: string, email: string) =>
    api().post(`/api/slots/${slotId}/registrations`).send({ name, email });

  it('001-AS1: opens a slot of capacity 2 for a discipline (201)', async () => {
    const response = await api().post('/api/slots').send(morning()).expect(201);

    expect(slotSchema.parse(response.body)).toMatchObject({
      disciplineId: lutteId,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      remainingPlaces: 2,
    });
  });

  it('001-AS2: registers a volunteer, one place remains (201)', async () => {
    const slot = await openSlot();

    const response = await register(slot.id, 'Awa Diop', 'awa@example.org').expect(201);

    expect(registrationSchema.parse(response.body)).toMatchObject({
      slotId: slot.id,
      name: 'Awa Diop',
      email: 'awa@example.org',
      remainingPlaces: 1,
    });
  });

  it('001-AS4: refuses a third volunteer on a slot of capacity 2 (409, SLOT_FULL)', async () => {
    const slot = await openSlot();
    await register(slot.id, 'Awa Diop', 'awa@example.org').expect(201);
    await register(slot.id, 'Moussa Ndiaye', 'moussa@example.org').expect(201);

    const response = await register(slot.id, 'Fatou Sall', 'fatou@example.org').expect(409);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 409, code: 'SLOT_FULL' });
  });

  it('001-AS5: reports an unknown slot as not found (404)', async () => {
    const response = await register(UNKNOWN_ID, 'Awa Diop', 'awa@example.org').expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_NOT_FOUND' });
  });

  it('001-AS6: reports an unknown discipline as not found (404)', async () => {
    const response = await api()
      .post('/api/slots')
      .send({ ...morning(), disciplineId: UNKNOWN_ID })
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'DISCIPLINE_NOT_FOUND' });
  });

  it.each([0, -1, 1.5])('001-AS7: rejects a capacity of %d (400 on capacity)', async (capacity) => {
    const response = await api()
      .post('/api/slots')
      .send({ ...morning(), capacity })
      .expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([
      expect.objectContaining({ path: 'capacity', message: 'Capacity must be at least 1' }),
    ]);
  });

  it.each([STARTS_AT, '2026-11-01T08:00:00.000Z'])(
    '001-AS8: rejects an end %s not after the start (400 on endsAt)',
    async (endsAt) => {
      const response = await api()
        .post('/api/slots')
        .send({ ...morning(), endsAt })
        .expect(400);

      expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
      expect(response.body.errors).toEqual([expect.objectContaining({ path: 'endsAt' })]);
    },
  );

  it.each([
    ['name', '', 'awa@example.org'],
    ['email', 'Awa Diop', 'not-an-email'],
  ])('001-AS9: rejects an invalid %s without taking a place (400)', async (field, name, email) => {
    const slot = await openSlot();

    const response = await register(slot.id, name, email).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: field })]);
    // La place n'a pas été prise : deux inscriptions valides passent encore.
    await register(slot.id, 'Awa Diop', 'awa@example.org').expect(201);
    const last = await register(slot.id, 'Moussa Ndiaye', 'moussa@example.org').expect(201);
    expect(last.body.remainingPlaces).toBe(0);
  });
});
