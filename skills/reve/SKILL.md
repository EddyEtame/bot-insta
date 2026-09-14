---
name: reve
description: La passe de rêve — relire les sessions passées hors du feu de l'action, y repérer les fautes qui reviennent, et proposer des mises à jour de la mémoire et des skills. CHARGER quand Eddy dit « rêve », « fais un rêve », « relis nos sessions », « qu'est-ce que t'as appris », « pourquoi tu refais toujours la même erreur », « range la mémoire », « mets à jour tes règles », « bilan », « rétrospective », « tu m'as encore fait répéter » — et de soi-même après une session où il s'est fâché plus de deux fois. Ne modifie jamais la mémoire sans lui montrer les propositions d'abord.
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

# Le rêve

Source : la conférence de **Lamis** (Anthropic, *context engineering*), section
*dreaming*.

## Pourquoi ça existe

Un agent qui écrit sa mémoire **pendant** une session a deux handicaps :

1. **Il partage ses ressources.** On lui demande de faire le travail *et* d'investir
   dans sa mémoire future. Combien de son attention doit aller à aider sa version de
   demain plutôt qu'à finir la tâche d'aujourd'hui ? C'est un arbitrage insoluble en
   direct.
2. **Il ne voit qu'une session.** Il ne peut pas voir qu'il fait la même erreur pour
   la quatrième fois, parce que chaque fois il repart d'un contexte vierge. Quand
   Eddy s'agace qu'on refasse toujours la même chose, l'agent, lui, la fait pour la
   première fois.

Le rêve est un processus **hors-bande** : il tourne à part, avec ses propres
ressources, et il voit **toutes** les sessions à la fois.

L'analogie de la conférence : dans une école, les élèves rendent des copies, les
professeurs corrigent, et **un directeur relit tout**. Il voit ce qu'aucun élève ne
peut voir — que toute la classe s'est trompée au même endroit. Alors il ne corrige
pas les copies : **il change le programme.**

Ses deux exemples :
- Tous les élèves de géographie ratent la même question → le sujet manque du
  programme. On ajoute le sujet.
- Tous les élèves de maths donnent des radians au lieu de degrés → ce n'est pas un
  problème de connaissance, c'est la **calculatrice** qui est mal réglée. Chez un
  agent : un outil mal configuré, un chemin faux, une clé morte.

## Comment on la lance

```bash
python "C:\Users\Mommy Jayce\.claude\memoire-boxing-center\_reve.py" 7
```

Le script prépare la matière dans `_reve/` — il ne décide rien :

| Fichier | Contenu |
|---|---|
| `voix-<projet>.txt` | ce qu'Eddy a réellement écrit ou dicté, par projet |
| `reprises.txt` | **le fichier qui compte** : chaque moment où il a corrigé, répété ou reproché |
| `inventaire.txt` | ce que le magasin de mémoire contient déjà |

`reprises.txt` est la matière la plus dense du corpus : **une reprise = une règle qui
manquait.**

## La passe, en cinq temps

**1. Lire l'inventaire d'abord.** On ne peut pas juger qu'une leçon manque sans
savoir ce qui est déjà écrit.

**2. Répartir les transcripts sur plusieurs agents.** Un par projet ou par tranche.
Chacun rapporte : les schémas qu'il voit, avec les extraits qui les prouvent.

**3. Chercher des schémas, pas des incidents.** Une erreur unique n'est pas un
schéma. Le seuil est **deux occurrences dans deux sessions différentes**. En dessous,
c'est du bruit, et une mémoire qui se remplit de bruit cesse d'être lue.

**4. Classer chaque schéma.** C'est là que se joue la qualité de la passe :

| Type | Ce qui manque | Où ça se corrige |
|---|---|---|
| **Programme** | une connaissance absente | une fiche du magasin |
| **Calculatrice** | un outil mal réglé, un chemin faux, une clé morte | le code ou la configuration |
| **Déclencheur** | la règle existe mais ne se charge jamais | la `description` d'une skill |
| **Périmé** | la fiche existe mais n'est plus vraie | on la corrige ou on la supprime |

La catégorie **calculatrice** est celle qu'on rate le plus : la tentation est
d'écrire une règle (« pense à vérifier X ») là où il fallait réparer l'outil. Une
règle qui compense un outil cassé sera oubliée ; l'outil réparé, jamais.

**5. Proposer, jamais appliquer.** Chaque proposition porte, comme dans la
conférence :
- ce qui change, en toutes lettres ;
- **au moins deux extraits datés** qui le prouvent ;
- combien de fois le schéma est apparu ;
- ce que ça évite la prochaine fois.

Il accepte ou il refuse, fiche par fiche.

## Ne pas regarder que ce qu'il a dit

La conférence insiste : dans les transcripts, on ne lit pas seulement les échanges,
on scrute **les appels d'outils et leurs métadonnées**. Un outil qui échoue toujours
de la même façon est un signal plus fiable que n'importe quelle phrase.

## Les mémoires périment

C'est l'autre moitié du travail, et la plus négligée : une fiche écrite il y a trois
mois peut être devenue fausse. **Le rêve coupe autant qu'il ajoute.** Une fiche que
plus rien ne confirme dans les sessions récentes est une candidate à la suppression.

## Une mémoire partagée impose une règle d'écriture

Depuis le 24 août 2026, tous les dépôts Boxing Center écrivent dans le **même**
dossier (`~/.claude/memoire-boxing-center`, branché par jonction). Deux sessions
Claude ouvertes en même temps peuvent donc viser la même fiche.

**La règle : relire le fichier juste avant d'écrire.** Si son contenu a changé depuis
la lecture, on repart de la version fraîche et on refait la modification dessus.
Jamais d'écrasement à l'aveugle. C'est la version simple du verrouillage par
empreinte décrit dans la conférence.

## Quand la lancer

- Après une session où il s'est fâché plus de deux fois.
- Après une grosse livraison.
- Quand `MEMORY.md` dépasse une vingtaine de lignes — c'est le signe qu'il faut
  fusionner et couper.
- Quand il dit lui-même qu'on lui fait répéter.

## Voir aussi

`the-warden` (le registre en direct, pendant la session) · `passe-hater` ·
`second-brain` · `prompts-et-evals` (mêmes réflexes appliqués à un prompt)
