# 001 — Bénévoles : ouvrir un créneau et s'y inscrire : plan

**Statut** : Validé

## 1. Résumé

On construit dans l'API un module `volunteers` qui permet d'ouvrir un créneau d'accueil pour une discipline existante et d'y inscrire des bénévoles. Une fois les tâches terminées, un responsable pourra ouvrir un créneau avec un début, une fin et une capacité, et un bénévole pourra s'y inscrire avec son nom et son email ; l'API refusera toute inscription au-delà de la capacité avec un `409 SLOT_FULL`. Le travail est découpé en cinq tâches, dans l'ordre des couches : domaine du créneau, domaine de l'inscription, cas d'usage, persistance, puis routes HTTP. L'écran, la consultation d'un créneau et la règle « un email, une inscription » sont laissés aux tranches suivantes.

Les mots de la spec et leur nom dans le code :

| Dans la spec      | Dans le code        | Ce que c'est                                                       |
| ----------------- | ------------------- | ------------------------------------------------------------------ |
| créneau           | `Slot`              | une plage horaire d'accueil pour une discipline, avec une capacité |
| capacité          | `capacity`          | le nombre maximal de bénévoles inscrits sur un créneau             |
| places restantes  | `remainingPlaces`   | la capacité moins le nombre d'inscrits                             |
| inscription       | `Registration`      | un bénévole (nom, email) inscrit sur un créneau                    |
| ouvrir un créneau | `OpenSlot`          | le cas d'usage qui crée un créneau                                 |
| inscrire          | `RegisterVolunteer` | le cas d'usage qui inscrit un bénévole sur un créneau              |

## 2. Fichiers par couche

On crée le module `volunteers` dans `apps/api/src/modules/volunteers/`, organisé comme le module Disciplines : un dossier par couche.

- **shared** : `packages/shared/src/volunteers.ts` contient les schémas Zod `openSlotSchema` (discipline, début, fin, capacité entière d'au moins 1, fin après le début), `registerVolunteerSchema` (nom de 1 à 100 caractères, email valide), `slotIdParamsSchema`, et les réponses `slotSchema` et `registrationSchema` ; il est exporté par `packages/shared/src/index.ts`.
- **domain** : `domain/slot.ts` est l'entité `Slot` : `Slot.create()` vérifie la capacité et l'ordre des dates, `Slot.restore()` relit la base avec son nombre d'inscrits, `slot.register()` refuse un créneau complet et renvoie la nouvelle `Registration`, `remainingPlaces` donne les places restantes. `domain/registration.ts` est l'entité `Registration`, dont `create()` vérifie le nom et l'email. `domain/volunteers.errors.ts` déclare `VolunteersError` (sous-classe d'`AppError`) et ses fabriques `slotFull()` et `slotNotFound()`.
- **application** : `application/slot.repository.ts` est le port `SlotRepository` (`findById`, `insert`, `addRegistration`). `application/testing/in-memory-slot.repository.ts` en est le fake fidèle, qui refuse lui aussi une inscription sur un créneau complet. `application/use-cases/open-slot.ts` (`OpenSlot`) vérifie que la discipline existe via `DisciplineRepository`, puis crée et enregistre le créneau. `application/use-cases/register-volunteer.ts` (`RegisterVolunteer`) charge le créneau, appelle `slot.register()` et enregistre l'inscription.
- **infra** : `infra/volunteers.schema.ts` déclare les tables `slots` et `registrations`. `infra/slot.mapper.ts` contient `toDomain()` et `toRow()`. `infra/drizzle-slot.repository.ts` implémente le port ; `addRegistration()` verrouille la ligne du créneau (`SELECT … FOR UPDATE`) dans une transaction, recompte les inscrits et lève `SLOT_FULL` si le créneau est plein, pour que deux inscriptions simultanées ne prennent pas la même dernière place.
- **http** : `http/volunteers.controller.ts` est un controller fin qui valide avec les DTO zod, appelle un cas d'usage et sérialise. Il porte deux routes :
  - `POST /api/slots` ouvre un créneau et renvoie `201` avec le créneau (`id`, `disciplineId`, `startsAt`, `endsAt`, `capacity`, `remainingPlaces`, `createdAt`) ;
  - `POST /api/slots/:slotId/registrations` inscrit un bénévole et renvoie `201` avec l'inscription (`id`, `slotId`, `name`, `email`, `createdAt`) et les places restantes du créneau (`remainingPlaces`).
- **module** : `volunteers.module.ts` relie `SlotRepository` à `DrizzleSlotRepository` et importe `DisciplinesModule`, qui exporte désormais `DisciplineRepository` (modification de `disciplines.module.ts`) ; `VolunteersModule` est ajouté aux `imports` de `apps/api/src/app.module.ts`.
- **web** : rien, l'écran est hors périmètre.

## 3. Données

On stocke les créneaux et leurs inscriptions dans deux tables. Migration : `pnpm db:generate --name=create_slots_and_registrations`.

- `slots` : `id` (uuid, clé primaire), `discipline_id` (uuid, non nul, clé étrangère vers `disciplines.id`, qui garantit qu'un créneau appartient à une discipline existante), `starts_at` et `ends_at` (timestamptz, précision 3, non nuls), `capacity` (integer, non nul), `created_at` (timestamptz). Deux contraintes `check` doublent les règles du domaine : `capacity >= 1` et `ends_at > starts_at`.
- `registrations` : `id` (uuid, clé primaire), `slot_id` (uuid, non nul, clé étrangère vers `slots.id`, qui garantit qu'une inscription vise un créneau existant), `name` (varchar 100), `email` (varchar 254), `created_at` (timestamptz). Un index sur `slot_id` sert au comptage des inscrits. Pas d'unicité sur l'email : elle arrive en TR2.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`), avec un code stable et un statut HTTP. Par l'API, les entrées invalides (AS7, AS8, AS9) sont d'abord arrêtées par le schéma Zod, qui répond `400 VALIDATION_FAILED` ; les codes du domaine protègent les mêmes règles quand on appelle les cas d'usage directement.

| Code AppError                | Catégorie  | HTTP | Quand                                          | Scénario |
| ---------------------------- | ---------- | ---- | ---------------------------------------------- | -------- |
| `SLOT_FULL`                  | CONFLICT   | 409  | le créneau a autant d'inscrits que de places   | AS4      |
| `SLOT_NOT_FOUND`             | NOT_FOUND  | 404  | aucun créneau n'a cet identifiant              | AS5      |
| `DISCIPLINE_NOT_FOUND`       | NOT_FOUND  | 404  | aucune discipline n'a cet identifiant (existe) | AS6      |
| `SLOT_CAPACITY_INVALID`      | VALIDATION | 400  | capacité non entière ou inférieure à 1         | AS7      |
| `SLOT_END_NOT_AFTER_START`   | VALIDATION | 400  | la fin est égale ou antérieure au début        | AS8      |
| `REGISTRATION_NAME_REQUIRED` | VALIDATION | 400  | nom vide ou fait d'espaces                     | AS9      |
| `REGISTRATION_EMAIL_INVALID` | VALIDATION | 400  | email mal formé                                | AS9      |

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit ; les tests e2e vérifient en plus le statut et le corps de la réponse HTTP. Les fichiers sont relatifs à `apps/api/`.

| Scénario | Fichier de test                                                             | Niveau       | Ce que le test vérifie                                                |
| -------- | --------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| AS1      | `src/modules/volunteers/domain/slot.spec.ts`, `test/volunteers.e2e.spec.ts` | unitaire/e2e | le créneau a sa discipline, ses dates, capacité 2 et 2 places ; `201` |
| AS2      | `src/modules/volunteers/application/volunteers.application.spec.ts`, e2e    | unitaire/e2e | l'inscription garde nom et email, il reste 1 place ; `201`            |
| AS3      | `src/modules/volunteers/domain/slot.spec.ts`                                | unitaire     | la dernière inscription passe, il reste 0 place                       |
| AS4      | `domain/slot.spec.ts`, `infra/drizzle-slot.repository.int.spec.ts`, e2e     | tous         | `SLOT_FULL`, toujours 2 inscrits en base ; `409` et `code: SLOT_FULL` |
| AS5      | `application/volunteers.application.spec.ts`, e2e                           | unitaire/e2e | `SLOT_NOT_FOUND`, rien d'enregistré ; `404`                           |
| AS6      | `application/volunteers.application.spec.ts`, e2e                           | unitaire/e2e | `DISCIPLINE_NOT_FOUND`, aucun créneau créé ; `404`                    |
| AS7      | `domain/slot.spec.ts`, e2e                                                  | unitaire/e2e | capacité 0, -1 et 1,5 refusées ; `400` sur `capacity`                 |
| AS8      | `domain/slot.spec.ts`, e2e                                                  | unitaire/e2e | fin égale ou antérieure refusée ; `400` sur `endsAt`                  |
| AS9      | `domain/registration.spec.ts`, e2e                                          | unitaire/e2e | nom vide, email mal formé refusés, place non prise ; `400` sur champ  |

## 6. Tâches

Cinq tâches, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [x] T01 [001-AS1, AS7, AS8] Écrire d'abord `domain/slot.spec.ts` (« 001-AS1: opens a slot with its capacity and all places remaining »), puis `packages/shared/src/volunteers.ts`, `domain/volunteers.errors.ts` et `Slot.create()` / `Slot.restore()`
- [x] T02 [001-AS2, AS3, AS4, AS9] Écrire d'abord les tests de `slot.register()` dans `domain/slot.spec.ts` et `domain/registration.spec.ts` (« 001-AS4: refuses a registration on a full slot »), puis `domain/registration.ts` et `slot.register()`
- [x] T03 [001-AS1, AS2, AS5, AS6] Écrire d'abord `application/volunteers.application.spec.ts` (« 001-AS5: reports an unknown slot as not found »), puis le port `SlotRepository`, son fake en mémoire, `OpenSlot` et `RegisterVolunteer`
- [x] T04 [001-AS4] Écrire d'abord `infra/drizzle-slot.repository.int.spec.ts` (« 001-AS4: never stores more registrations than the capacity »), puis `infra/volunteers.schema.ts`, la migration, `infra/slot.mapper.ts` et `DrizzleSlotRepository`
- [ ] T05 [001-AS1, AS2, AS4, AS5, AS6, AS7, AS8, AS9] Écrire d'abord `test/volunteers.e2e.spec.ts` (« 001-AS4: refuses a third volunteer on a slot of capacity 2 (409, SLOT_FULL) »), puis `http/volunteers.controller.ts`, `volunteers.module.ts`, l'export de `DisciplineRepository` et l'import dans `app.module.ts`
