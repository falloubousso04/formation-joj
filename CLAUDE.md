# CLAUDE.md

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

- Une fonctionnalité suit le cycle `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`, avec une validation humaine après chacune des trois premières ; les principes sont dans `specs/constitution.md`.
- Test d'abord : écrire le test, le voir échouer pour la bonne raison (`pnpm tdd:red <fichier>`), puis le code minimal.
- Ordre d'une fonctionnalité (détail dans `README.md`, « Ajouter une fonctionnalité ») : schéma partagé → domaine → cas d'usage → table et migration → repository Drizzle → controller et e2e → fausse API MSW → écran.
- `pnpm verify` sur les fichiers modifiés, `pnpm check` avant de déclarer une fonctionnalité finie.
- Une tâche = un commit Conventional Commits : `feat(disciplines): T03 add similar disciplines (001-AS2)`. Jamais `--no-verify`.
- Celui qui produit ne valide pas : relecture finale par le sous-agent `relecteur`.

## Architecture

- `packages/shared` : schémas Zod d'entrée et de réponse, importés par l'API et le front ; il n'importe ni l'un ni l'autre.
- Un module par domaine dans `apps/api/src/modules/<domaine>/`, sur le modèle de `disciplines` :
  - `domain/` : entité et erreurs, TypeScript pur (aucun import de NestJS, Drizzle ou pg : vérifié par oxlint) ;
  - `application/` : port `<entité>.repository.ts` (classe abstraite), `use-cases/` (un cas d'usage par classe), `testing/` (repository en mémoire) ;
  - `infra/` : table Drizzle `<nom>.schema.ts`, mapper `toDomain()`/`toRow()`, repository Drizzle ;
  - `http/` : controller ; `<nom>.module.ts` relie le port à son implémentation et s'ajoute à `src/app.module.ts`.
- `apps/api/src/core/` : transverse (config, `AppError`, `ProblemDetailsFilter`, base de données, santé).
- `apps/api/migrations/` : générées par `pnpm db:generate --name=<sujet>`, jamais éditées à la main.
- Front : pages dans `apps/web/src/routes/` (TanStack Router), code métier dans `src/features/<nom>/api/` (appels HTTP, hooks TanStack Query) et `components/`, composants shadcn dans `src/components/ui/`, client HTTP dans `src/lib/api/`.
- `apps/web/src/mocks/` : la fausse API MSW des tests, au même contrat (schémas, codes d'erreur) que l'API.

## Concepts appréciés

- Controller fin : valider (DTO `createZodDto`), appeler un cas d'usage, sérialiser (`toResponse`). Aucune règle métier.
- Un cas d'usage = une classe `@Injectable()` avec une seule méthode `execute()`.
- Entité à constructeur privé : `create()` applique les règles, `restore()` relit la base sans les rejouer ; état modifié par des méthodes nommées (`rename()`, `changeCategory()`).
- Le domaine revérifie ses règles : il ne fait pas confiance à la validation HTTP.
- Le cas d'usage dépend du port abstrait, jamais de Drizzle.
- Typage strict, pas de `any` ; types dérivés des schémas Zod (`z.infer`).
- Commentaires courts en français qui disent le pourquoi ; code, messages d'erreur et titres de tests en anglais.

## Bonnes pratiques

- Toute erreur métier est une sous-classe d'`AppError` (`DisciplineError`) avec un code stable et une catégorie (VALIDATION, NOT_FOUND, CONFLICT, BUSINESS_RULE), créée par une fabrique (`disciplineNotFound(id)`).
- Seul `ProblemDetailsFilter` transforme une `AppError` en HTTP (400, 404, 409, 422, format RFC 9457) : jamais de `HttpException` dans un module.
- Une entrée est validée par un schéma Zod de `packages/shared`, jamais à la main dans le controller.
- Unicité : vérifiée par le cas d'usage pour un message clair, et garantie par une contrainte en base traduite en `AppError` par le repository.
- Tests : domaine (`*.spec.ts`), cas d'usage avec le repository en mémoire (`*.application.spec.ts`), repository sur PGlite (`*.int.spec.ts`), API avec supertest (`apps/api/test/*.e2e.spec.ts`, statut et corps), front avec MSW et un audit `*.a11y.test.tsx` par route.
- Aucun secret dans le code : les valeurs sensibles vont dans `apps/api/.env` (ignoré par git).
- Pas de nouvelle dépendance sans le demander.

## Nommage

- Fichiers en kebab-case : `create-discipline.ts`, `drizzle-discipline.repository.ts`, `disciplines.errors.ts`.
- Classes en PascalCase ; cas d'usage nommés verbe + entité : `CreateDiscipline`, `ListDisciplines`.
- Implémentations préfixées par leur technique : `DrizzleDisciplineRepository`, `InMemoryDisciplineRepository`.
- Codes d'erreur en majuscules, préfixés par l'entité : `DISCIPLINE_NOT_FOUND`, `DISCIPLINE_NAME_TAKEN`.
- Schémas Zod en camelCase suffixés par `Schema` : `createDisciplineSchema` ; types en PascalCase : `CreateDisciplineInput`.
- Tests API `*.spec.ts`, front `*.test.tsx` à côté du fichier testé ; titres en anglais préfixés par le scénario : `it('000-AS2: rejects a discipline without a name (400, RFC 9457)')`.
- Commits Conventional Commits avec le domaine en portée : `feat(disciplines): …`, `docs: …`.
