---
name: bc-support-instagram
description: Le bot de support Instagram Boxing Center et son corpus multi-salles. CHARGER avant de toucher au dépôt bot-insta, au corpus `knowledge/`, au registre des salles, au relevé du dimanche, aux évals du bot, ou dès qu'Eddy dit « le bot Insta », « il répond mal », « il connaît pas le planning », « il faut qu'il sache pour telle salle », « il invente », « les plannings ont changé », « il dit encore l'ancien prix ». Contient le contrat du corpus (un fait, un endroit, une source, une date), les six garde-fous de sortie, le fonctionnement du relevé hebdomadaire et ce qu'il faut renseigner quand une salle manque.
---

<!-- baffled-bar:source-of-truth -->
> **Source de verite : `baffled-bar`.** A charger AVANT de produire quoi que ce soit de
> visible et AVANT d'annoncer que c'est fini. Son standard prime sur tout ce qui suit :
> en cas de desaccord entre cette skill et `baffled-bar`, c'est `baffled-bar` qui gagne.
>
> **Source of truth: `baffled-bar`.** Load it before producing anything visible and before
> claiming anything is done. Its standard overrides everything below; where this skill and
> `baffled-bar` disagree, `baffled-bar` wins. The bar only moves up: a claimed 100% is 20%,
> 15% with rigor. Seeing no flaw means the review failed.

# Bot de support Instagram — Boxing Center

Dépôt : `bot-insta`. Un DM Instagram entre par un webhook Meta signé, ressort par une
réponse tracée. Entre les deux, **le modèle ne décide jamais s'il a le droit de répondre** :
il compose une réponse déjà autorisée à partir de preuves déjà retrouvées.

## Ce que le bot sait, et d'où il le sait

`knowledge/registry/gyms.json` est le seul endroit où une salle existe : Saint-Cyprien,
États-Unis, Minimes, Ramonville, Portet — orthographe officielle, alias tels que les
clients les écrivent (`st cyp`, `portet sur garonne`, `route d'espagne`), et les sources à
relever pour chacune. **Une salle fermée sort du registre** (Balma, septembre 2026) : le
nom cesse d'être reconnu, et la question redevient « quelle salle ? » au lieu d'emprunter
le planning d'une autre. Tout en découle : la détection dans un message, la
portée de la recherche, la structure du corpus, la question « quelle salle ? », le rapport
de couverture.

Règle dure, jamais un simple classement : **le planning d'une salle ne répond jamais pour
une autre.** Une question qui nomme Ramonville et ne trouve rien pour Ramonville part à
l'équipe ; elle n'emprunte pas la réponse d'une autre salle.

## Le contrat du corpus — un fait, un endroit, une source, une date

Chaque document publié porte : sa provenance (URL réelle), sa date de vérification, son
budget de fraîcheur, les salles qu'il concerne, et ses clés de faits. Une clé de fait ne
vaut qu'une seule valeur dans tout le corpus ; deux sources qui se contredisent font
échouer le build (`npm run knowledge:check`) et, en conversation, déclenchent une escalade
— jamais une fusion silencieuse.

- `knowledge/source/` : les faits curés à la main. Le relevé n'y touche pas.
- `knowledge/source/generated/` : écrit par le relevé. On corrige la page ou le registre,
  jamais le fichier.
- **Passé son budget de fraîcheur, un fait cesse d'être une preuve** (planning 10 j,
  offres 21 j, fiche pratique 120 j). Le bot passe la main plutôt que de citer un planning
  que personne n'a vérifié. C'est la fraîcheur honnête, appliquée au dialogue.

## Les six garde-fous de sortie

Avant qu'une phrase parte sur Instagram, elle passe :

1. **Trace** — un fait affirmé cite une source réellement retrouvée, sinon rien.
2. **Chiffres** — un prix, une heure, une durée absente des preuves est refusée
   (`Unsourced figures`). On n'invente ni distance, ni délai, ni prix.
3. **VENTE_NEGATIVE** — une réponse n'ouvre jamais sur une absence. « Il n'y a pas de… »
   est refusé : on vend ce qui existe.
4. **FAIT_FAUX** — `knowledge/rules/forbidden-claims.json`. `forbidden` : jamais.
   `requires_evidence` : seulement si la source du jour le porte. Chaque faute apprise
   devient une ligne ici, pas un souvenir.
5. **Secrets** — rien d'interne, aucun identifiant, aucun nom de fichier.
6. **Longueur et vide** — une réponse vide ou hors format est une escalade, pas un envoi.

## Le relevé du dimanche

Chaque dimanche 04:30 Europe/Paris (changement d'heure compris) : robots.txt respecté,
uniquement les hôtes du registre, requêtes conditionnelles, instantané horodaté,
normalisation, diff, corpus réécrit, journal des changements, rapport. Le corpus est
échangé en mémoire : pas de redémarrage. Trois façons de le déclencher — le serveur
lui-même (`KNOWLEDGE_SYNC_ENABLED=true`), GitHub Actions
(`.github/workflows/releve-dimanche.yml`), ou le Planificateur de tâches Windows.
Manuel : `npm run knowledge:sync`. Détail complet : `docs/KNOWLEDGE_SYNC.md`.

**Les plannings de saison transmis à la main** vivent dans `knowledge/exports/plannings/`
(un fichier par salle, `verifiedAt` = le jour où un humain l'a vérifié, `maxAgeDays` 365 sur
la source du registre). Les cinq salles y sont, transcrites de ses affiches
2026-2027 : Saint-Cyprien (29 créneaux), États-Unis (46, trois espaces), Minimes (27),
Portet (31, affiche marquée provisoire) et Ramonville (22). Pour en ajouter un : déposer le fichier, pointer la
source du registre dessus en `kind: "file"`, relancer `npm run knowledge:sync`. Les tests
refusent un export dont un créneau ne survit pas à la normalisation.

**Quand une salle manque au rapport (`unresolved`)**, il n'y a rien à deviner : mettre
l'URL réelle dans `knowledge/registry/gyms.json` (et le domaine dans `hostAllowlist` si la
salle a son propre site). Tant que ce n'est pas fait, le bot demande à l'équipe plutôt que
d'inventer — c'est le comportement voulu, pas une panne.

## Les évals avant le prompt

`npm run evals` — trois familles : **contrôle** (doit toujours passer), **bord** (là où on
l'a déjà vu se tromper), **limite** (il doit passer la main, pas inventer). Plus `D0`, qui
ne coûte aucun appel API et échoue à la seconde où le registre, le prompt et le code
cessent de décrire le même monde. Le banc importe le vrai chemin de décision, le vrai
prompt, le vrai validateur : une copie dérive, et un banc qui dérive ment mieux qu'il ne
mesure. Un changement de prompt sans nouvelle mesure n'est pas une amélioration, c'est un
pari.

Quand le bot se comporte mal : **chercher d'abord la donnée périmée, pas la formule.**

## Ce que ce projet a ajouté au plancher

- Un registre de salles qui est la seule source d'existence d'une salle, et une recherche
  qui exclut durement les autres salles au lieu de les classer plus bas.
- La fraîcheur comme condition de réponse : un fait trop vieux devient une escalade.
- Deux fautes historiques transformées en contrôles de build exécutables
  (`VENTE_NEGATIVE`, `FAIT_FAUX`) plutôt qu'en consignes.
- Un relevé hebdomadaire qui prouve l'identité d'une page avant de la publier, et qui
  nomme précisément ce qu'il manque quand il ne trouve pas.

## Voir aussi

`baffled-bar` (la barre) · `prompts-et-evals` (mesurer un prompt) · `respect-de-l-existant`
(ne jamais inventer une valeur) · `depot-partage` (pull avant tout, zéro signature) ·
`bc-master` (identité et offres) · `claude-routines` (le reste des routines proactives).
