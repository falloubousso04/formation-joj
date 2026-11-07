# 001 — Bénévoles : ouvrir un créneau et s'y inscrire

**Statut** : Validée
**PRD** : specs/prd-benevoles.md, TR1

## Contexte

Les responsables de discipline gèrent les inscriptions des bénévoles sur papier, et des créneaux d'accueil débordent. Cette tranche ouvre des créneaux à capacité limitée et y inscrit des bénévoles, en rendant le débordement impossible.

## User stories

- En tant que responsable de discipline, je veux ouvrir un créneau avec un début, une fin et une capacité, afin de recevoir des inscriptions sans dépasser le nombre de places.
- En tant que bénévole, je veux m'inscrire à un créneau avec mon nom et mon email, afin d'accueillir le public pendant ce créneau.

## Scénarios d'acceptation

### AS1 — Ouvrir un créneau

- **Étant donné** la discipline « Lutte » · **Quand** le responsable ouvre pour elle un créneau de 9 h à 12 h le 1er novembre 2026, de capacité 2 · **Alors** le créneau est enregistré avec sa discipline, son début, sa fin, sa capacité 2 et 2 places restantes.

### AS2 — Inscrire un bénévole

- **Étant donné** un créneau de capacité 2 sans inscrit · **Quand** Awa Diop (awa@example.org) s'y inscrit · **Alors** l'inscription est enregistrée avec son nom et son email, et il reste 1 place.

### AS3 — Inscrire la dernière personne

- **Étant donné** un créneau de capacité 2 qui a déjà 1 inscrit · **Quand** un second bénévole s'y inscrit · **Alors** l'inscription est acceptée, et il reste 0 place.

### AS4 — Créneau complet

- **Étant donné** un créneau de capacité 2 qui a déjà 2 inscrits · **Quand** un troisième bénévole s'y inscrit · **Alors** refus 409 avec le code SLOT_FULL, et le créneau a toujours 2 inscrits.

### AS5 — Créneau inconnu

- **Étant donné** aucun créneau avec l'identifiant demandé · **Quand** un bénévole s'y inscrit · **Alors** c'est refusé avec un message « introuvable », et rien n'est enregistré.

### AS6 — Discipline inconnue

- **Étant donné** aucune discipline avec l'identifiant demandé · **Quand** le responsable ouvre un créneau pour elle · **Alors** c'est refusé avec un message « introuvable », et aucun créneau n'est créé.

### AS7 — Capacité invalide

- **Étant donné** une capacité de 0, négative ou non entière · **Quand** le responsable ouvre le créneau · **Alors** c'est refusé avec un message qui dit que la capacité doit être d'au moins 1, et aucun créneau n'est créé.

### AS8 — Fin pas après le début

- **Étant donné** une fin égale ou antérieure au début · **Quand** le responsable ouvre le créneau · **Alors** c'est refusé avec un message qui dit que la fin doit suivre le début, et aucun créneau n'est créé.

### AS9 — Bénévole sans nom ou avec un email invalide

- **Étant donné** un nom vide ou un email mal formé · **Quand** le bénévole s'inscrit · **Alors** c'est refusé avec un message qui dit quel champ est invalide, et la place n'est pas prise.

## Hors périmètre

- Pas d'écran : seulement l'API.
- Consulter un créneau et ses inscrits, refuser deux inscriptions du même email (TR2).
- Se désinscrire (TR3), modifier ou supprimer un créneau, emails de confirmation, comptes des bénévoles.

## Questions ouvertes

- Deux inscriptions simultanées sur la dernière place : hypothèse, une seule passe, l'autre reçoit SLOT_FULL.
- Un créneau dans le passé : hypothèse, accepté (pas de règle sur la date en TR1).
- Le même email inscrit deux fois : hypothèse, accepté en TR1 ; la règle arrive en TR2.
