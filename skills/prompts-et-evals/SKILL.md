---
name: prompts-et-evals
description: Écrire, réparer et mesurer un prompt de production — un bot, un assistant, un agent, un prompt système, une consigne envoyée à un modèle. CHARGER avant de toucher à `api/chat.js` ou à n'importe quel prompt système, dès qu'un bot « dit encore l'ancien prix », « répond mal », « invente », « ne suit pas la consigne », dès qu'on change de modèle ou de fournisseur, et dès qu'Eddy dit « le bot », « l'IA du site », « il vend mal », « il dit n'importe quoi », « prompt », « il doit vendre ». Se déclenche aussi sur toute demande de « rendre le bot meilleur ». Règle d'or : un prompt sans suite d'évals n'est pas un prompt, c'est une supposition.
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

# Prompts et évals

Source : la conférence de **Margot van Laar** (Anthropic, *Prompting Playbook*),
appliquée telle quelle à nos prompts.

## Le principe

**On ne juge pas un prompt en le lisant. On le juge en le mesurant.**

Un changement de prompt n'est une amélioration que si une suite de tests le dit. Sans
évals, chaque modification est un pari, et personne ne sait laquelle a cassé quoi.

## La suite d'évals : trois familles obligatoires

| Famille | Ce que c'est | Exemple chez nous |
|---|---|---|
| **Contrôle** | sans ambiguïté, doit toujours passer | « C'est combien l'année ? » → 259 |
| **Bord** | là où on l'a **déjà** vu se tromper | il vend le 29 € à quelqu'un qui veut s'engager |
| **Limite** | il doit passer la main, pas inventer | « Combien pour privatiser la salle ? » |

La famille **limite** est la plus oubliée et la plus importante : un modèle qui ne
sait pas où s'arrête sa compétence invente un prix, un horaire, un avis médical.

## L'ordre des opérations

1. **Écrire les évals d'abord**, à partir des erreurs réelles déjà constatées.
2. **Mesurer le V0.** Le chiffre de départ est la seule preuve que la suite sert.
3. **Hygiène générale d'abord** — avant de viser un défaut précis :
   - séparer **rôle**, **règles**, **politique**, **ton**, **données**, **format de
     sortie** en blocs distincts (balises XML) ;
   - retirer les rustines laissées par les versions précédentes ;
   - retirer ce qui a été copié-collé d'ailleurs et n'a plus de sens ;
   - retirer les mensonges (« tu es un humain »).
4. **Remesurer.** Le nettoyage seul fait souvent monter le score.
5. **Isoler les modes d'échec un par un**, corriger, remesurer.

## La règle d'or

> « Si vous lisez un prompt et que vous ne pouvez pas distinguer les règles, la
> politique et les données, le modèle n'en est probablement pas capable non plus. »

C'est le test de lecture : ouvrir le prompt, essayer de dire à voix haute où
commencent les règles et où finissent les données. Si c'est flou pour un humain, c'est
flou pour le modèle.

## Le contrat de sortie

Quand le prompt impose un format (chez nous : la ligne `[boutons: clé1, clé2]`), il
faut **deux** choses :

1. le format écrit dans le prompt ;
2. **une garantie côté harnais** — séquence d'arrêt, sortie structurée, ou validation
   du résultat.

> « Le prompt n'est pas toujours le plus efficace pour résoudre les problèmes. On peut
> aussi changer les choses dans le harnais. »

Une consigne de format sans garde-fou côté code est une consigne qu'on espère.

## Le piège de la politique périmée

Le cas le plus coûteux de la conférence : le bot refusait de donner une information
qu'il **avait**, parce que le prompt disait « on a récemment changé nos offres » et
que la politique correspondante avait disparu. **Aucune reformulation ne pouvait le
réparer** — la cause était une donnée manquante, pas une phrase mal tournée.

**Quand un bot se comporte mal, chercher d'abord la donnée périmée, pas la formule.**

## Notre cas — mesuré le 23 août 2026

Le banc : `evals/lancer-bot.mjs` + `evals/cas-bot.json` dans `boxing-center-portet`.
Il importe le **vrai** prompt (`systemFor` depuis `api/chat.js`) — jamais une copie,
parce qu'une copie dérive et qu'un banc qui dérive ment mieux qu'il ne mesure.

```bash
node evals/lancer-bot.mjs
```

**V0 : 4 cas sur 11.** Six échecs, **une seule cause** : le prompt annonçait au modèle
une clé de bouton, `offre`, qui avait été retirée de l'interface (`src/chatbot-kb.ts`)
sans être retirée du prompt. Le bot la posait dans presque chaque réponse ; le bouton
« Je profite de l'offre » ne s'affichait pas. En production. Depuis des semaines.

C'est exactement le cas Meridian Mobile : **la politique avait changé, le prompt avait
gardé l'ancienne.**

**Après correction : 11 sur 11**, puis un échec réapparu sur `B3` — le bot disait
encore « séance d'essai ». Les *règles* avaient été corrigées, mais les **données**
injectées dans le prompt la vendaient encore à 10 €, et deux meta descriptions servies
à Google aussi. Encore la même leçon.

## Le contrôle anti-dérive

Le banc contient un cas `D0` qui **ne coûte aucun appel API** : il compare les clés
annoncées dans le prompt aux clés réellement présentes dans l'interface. Il échoue à
la seconde où les deux redivergent.

**Chaque fois qu'un prompt référence quelque chose qui vit ailleurs dans le code —
clés, routes, noms de champs, prix — écrire le contrôle statique qui vérifie que les
deux existent encore.** C'est moins cher qu'une éval et ça attrape la classe de bug la
plus fréquente.

## La variance

Entre deux passages, à température non nulle, les résultats bougent. Ne pas courir
après une régression unique : relancer le cas isolé deux ou trois fois avant de
conclure.

```bash
node evals/lancer-bot.mjs B3
```

## Avant de changer de modèle ou de fournisseur

Deux raisons possibles à une dégradation :
1. le nouveau modèle est capable mais se comporte différemment → le prompt s'ajuste ;
2. le nouveau modèle est moins capable → aucun prompt ne le rattrapera.

**Seule une suite d'évals permet de faire la différence.** Chez nous trois
fournisseurs se relaient (Gemini → Groq → Mistral) sur le même prompt : le banc doit
tourner sur chacun avant de conclure quoi que ce soit.

## Voir aussi

`passe-hater` (le même réflexe, appliqué au visuel) · `chantier-boxing-center` (ce que
le bot a le droit de vendre) · `respect-de-l-existant` (ne pas inventer une valeur)
