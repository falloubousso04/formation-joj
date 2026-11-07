# PRD — Bénévoles

**Statut** : Validé

## Problème

Chaque discipline a besoin de bénévoles pour accueillir le public. Aujourd'hui, les responsables de discipline gèrent les inscriptions sur papier : personne ne voit en temps réel combien de places restent, et des créneaux débordent. Pendant les Jeux, un créneau en surnombre laisse d'autres créneaux sans accueil.

## Utilisateurs

- Responsable de discipline : ouvrir des créneaux d'accueil pour sa discipline, chacun avec un nombre de places, et savoir qui s'y est inscrit.
- Bénévole : s'inscrire à un créneau qui a encore de la place, et s'en retirer s'il ne peut plus venir.

## Proposition

Le responsable ouvre un créneau pour une discipline avec une capacité ; les bénévoles s'y inscrivent avec leur nom et leur email. L'application compte les inscrits et refuse toute inscription au-delà de la capacité. Une règle appliquée par l'application, plutôt qu'une feuille partagée, rend le débordement impossible au lieu de le constater après coup.

## Mesure du succès

Pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième, avec un message qui dit que le créneau est complet.

## Tranches

### TR1 — Ouvrir un créneau et s'y inscrire

Le responsable ouvre un créneau pour une discipline existante, avec une capacité ; un bénévole s'y inscrit. Règle : une inscription est refusée quand le créneau est complet.

### TR2 — Consulter un créneau et ses inscrits

Le responsable voit un créneau, sa capacité, ses places restantes et la liste de ses inscrits. Règle : le même email ne peut pas s'inscrire deux fois au même créneau.

### TR3 — Se désinscrire, et l'écran du créneau

Un bénévole se retire d'un créneau, ce qui libère sa place. Un écran permet de voir un créneau, de s'y inscrire et de s'en désinscrire.

## Hors périmètre

- La modification ou la suppression d'un créneau.
- Les emails de confirmation.
- Les comptes des bénévoles : un bénévole est identifié par son email, sans mot de passe.

## Hypothèses et risques

- Supposé : un créneau a une date et une heure de début et de fin ; si on n'en a pas besoin, TR1 rétrécit.
- Supposé : n'importe qui peut ouvrir un créneau ou se désinscrire, faute de comptes ; un bénévole pourrait désinscrire quelqu'un d'autre en connaissant son email.
- Supposé : deux inscriptions simultanées sur la dernière place ne doivent pas toutes deux passer ; si ce n'est pas garanti, la démo peut réussir et les Jeux déborder.
- Supposé : un bénévole peut s'inscrire à plusieurs créneaux, même qui se chevauchent.
