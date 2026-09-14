---
name: depot-partage
description: Discipline de dépôt — pull avant tout, zéro signature, zéro secret. CHARGER AVANT tout git add / commit / push / merge / rebase / déploiement, AVANT d'ouvrir un chantier sur un dépôt où d'autres développeurs travaillent (box-plus, la boutique, bc-minimes, bc-st-cyprien, bc-ramonville), et dès qu'une clé, une URL de base, un identifiant, un business plan ou un document interne entre dans le projet. Se déclenche sur « commit », « commite », « pousse », « push », « déploie », « mets en ligne », « pull », « merge », « branche », « en prod ». Pousser sans avoir pull sur un dépôt partagé est la faute pour laquelle il a dit qu'il ne pardonnerait jamais.
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

# Dépôt partagé

Eddy n'est pas seul sur ces dépôts. **brad** et **angoularaphael** poussent en temps
réel. Un dépôt analysé sans `pull` produit des constats faux, et un `push` sans
`pull` écrase le travail de quelqu'un.

> « I hope you have not done the same thing for box plus because if you did, I will
> never forgive you, because I'm not the only one working on that. I also have other
> developers working on it. So I told you to be very careful not to touch anything,
> to pull before you do any push. Do not send any code. Do not push anything if you
> have not pulled. »

> « make sure to pull, before working on any of the websites as changes are happening
> in real time »

## Le rituel, dans l'ordre

1. **`git pull`** — au début de chaque tour de travail, pas seulement avant de
   pousser.
2. **Lire les commits des autres** depuis la dernière fois (`git log --oneline
   <dernier-vu>..HEAD`). Ce qu'ils ont changé peut invalider l'analyse en cours.
3. Travailler.
4. **`git pull` à nouveau** avant de pousser.
5. Pousser.

**Jamais de `push --force`** sans une autorisation explicite et nominative de sa
part, dans le fil, pour ce dépôt-là.

**Ne jamais toucher au travail d'un autre développeur**, même pour « harmoniser ».

## Signatures : interdit absolu

> « also, stop adding yourself to commits. I WON'T WANT TO SAY IT AGAIN! NEVER DO IT
> AGAIN! »

> « DO NOT INCLUDE YOURSELF INTO THE COMMIT NAMES! »

Aucune mention de l'assistant dans un message de commit. Pas de `Co-Authored-By`,
pas de trailer, pas de « Generated with », **sur aucun dépôt, jamais**.

Le crochet `.githooks/commit-msg` est installé sur les six dépôts et refuse le
commit si une signature apparaît. Il est branché par `npm install` (`"prepare": "git
config core.hooksPath .githooks"`). **Un dépôt fraîchement cloné n'a pas le crochet
tant que `npm install` n'a pas tourné.**

## Style des messages

En français, style maison, court et factuel : **ce qui change pour le visiteur**,
pas le nom du fichier touché.

```
design(portet): le billet brille, une phrase l'amène, et la fin du ring s'affiche enfin sur téléphone
fix(portet): le premier bouton du site vend l'année, plus la rentrée
```

## Rien de sensible dans le dépôt

> « how have you been working if there was no .env file? have you been HARDCODING DB
> INFO IN THE PROJECT CODE BASE!? »

- Aucune clé, aucun identifiant, aucune URL de base en dur dans le code. Tout passe
  par `.env`, vérifié **avant** chaque commit.
- Les documents internes (plans, business, notes de recherche, transcripts) vivent
  dans un dossier gitignoré et ne partent jamais sur GitHub.

## Sécurité

> « we need security on this. I don't want anybody just sneaking in, entering through
> any back doors or anything. A security to the fucking roof. »

Toute route admin, toute session, tout mot de passe : pas de porte dérobée, même sur
un petit projet privé. Les protections se prévoient sans qu'il ait à les demander une
deuxième fois.

## La production passe avant tout

> « Remember the website is already live, and every second we waste is people looking
> at the website at a state that is not baffled bar. »

Un défaut détecté en production passe avant toute nouvelle fonctionnalité.

## Le terrain

| Dépôt | Techno | Autres développeurs |
|---|---|---|
| `boxing-center-portet` | Vite (MPA) | — |
| `bc-minimes` | Astro | **angoularaphael** — le dépôt a changé, voir `chantier-boxing-center` |
| `bc-st-cyprien` | Astro | oui |
| `bc-ramonville` | Astro | oui |
| `box-plus` (la boutique) | — | **oui, plusieurs** — pull impératif |
| Plannings | — | — |

## Détail d'environnement

Les commandes qu'on **lui** donne à exécuter sont en **PowerShell**, jamais en bash.

## Voir aussi

`chantier-boxing-center` · `respect-de-l-existant` · `ship-real`
