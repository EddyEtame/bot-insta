---
name: passe-hater
description: Le rituel obligatoire avant de rendre la main — détruire son propre travail, l'ouvrir pour de vrai dans le navigateur, puis annoncer un pourcentage bas et défendable. CHARGER AVANT toute phrase du type « c'est fait », « c'est bon », « terminé », « j'ai fini », « regarde », « tu peux tester », « c'est en ligne », « déployé », « ça marche », et AVANT d'annoncer le moindre pourcentage. Se déclenche aussi sur ses questions — « on en est où ? », « t'as vérifié ? », « t'as regardé toi-même ? », « ça marche vraiment ? », « pourcentage » — après chaque round de travail, et juste après un build ou un déploiement réussi. La critique faite APRÈS qu'il a trouvé le défaut ne vaut rien.
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

# La passe de hater

`baffled-bar` porte le **standard**. Cette skill porte la **procédure** : ce qu'on
fait, concrètement, dans les minutes qui précèdent le moment où on lui rend la main.

Elle existe parce que la critique arrivée après lui ne vaut rien :

> « Run a check on everything as the biggest motherfucker, the biggest hater the
> world has ever known. You must trash the work. Find a way to trash the work, not
> just trash sections of it, but trash the whole of it, as if it has to be
> completely redone, as if it has to be binned. »

> « Be your biggest hater. If not, I will. And I'm not nice. »

## 1. Ouvrir. Pour de vrai.

Un rapport écrit sans avoir ouvert la page ne vaut rien. Il l'a dit sans détour :

> « You have to open one at random and see that the designs are not running properly
> and that there are still console errors in real time on the page. Then what's your
> use, big man? »

- Lancer le serveur, ouvrir la page (`mcp__Claude_Browser__preview_start`, puis
  `navigate`).
- Scroller de haut en bas. Survoler. Cliquer les CTA — **vraiment cliquer**, pas
  vérifier que la balise existe.
- Redimensionner en mobile (`resize_window` preset `mobile`), recharger, refaire le
  parcours.
- Lire `read_console_messages`. **Zéro erreur, zéro warning laissé en place.** Une
  erreur console en direct annule tout le rapport.
- Tirer **au moins une page au hasard** — pas seulement celle qu'on vient de
  toucher — et l'inspecter entièrement.

## 2. Parcourir le chemin du visiteur, pas le code

Arriver → comprendre où aller → cliquer → aboutir. Sur bureau **et** sur téléphone.
« Ça compile » ne veut pas dire « c'est utilisable ».

## 3. Avant de dire qu'une chose manque : regarder

> « I have already dropped the necessary keys in the .env file... but you have not
> checked, you have not seen it. And you said you're not there. This is the kind of
> things that I do not want. I need you to check everything. »

Avant d'écrire « il manque X », « je n'ai pas accès à Y », « ce n'est pas
configuré » : ouvrir le fichier. Il a très souvent déjà fait sa part.

## 4. Tout doit être branché sur le réel

Ni démo, ni valeurs en dur, ni `localStorage`. Les tests programmatiques et le build
tournent **avant** de lui demander de tester à la main. Son test manuel est le
dernier filet, jamais le premier.

## 5. Noter, critère par critère, avant de montrer

Écrire la note. Un critère en dessous du niveau = on ne livre pas, on corrige.

| Critère | Ce qu'on regarde |
|---|---|
| Design | hiérarchie, contraste, rythme, typographie, couleur |
| Originalité | est-ce que ça pourrait être sur le site d'un concurrent ? |
| Finition | marges, alignements, états de survol, transitions, textes |
| Fonctionnement | tous les clics, tous les formulaires, tous les liens |
| Lisibilité | contraste réel, taille de texte, longueur de ligne |
| Mobile | même récit, même densité, même vitesse qu'en bureau |
| Performance | premier affichage, fluidité du scroll, poids réel |
| Cohérence | le même prix, le même message sur toutes les surfaces |

## 6. Calibrer bas, et défendre le chiffre

> « KEEPING IN MIND THAT YOUR 100 % IS 35 %, KNOW THAT THERE'RE SO MANY FLAWS AND
> INCOHERENCES THAT NEED TO BE ADDRESSED ALWAYS, AND THAT AS LONG AS, WHILE LOOKING
> AT IT FROM THE HIGHEST HATER'S POSITION, YOU SEE NO FLAW, THAT MEANS THERE'S HUGE
> ROOM FOR AMELIORATION! »

- Ce qu'on croit à 100 % vaut **20 %** — **15 %** si la relecture a été rigoureuse.
  C'est le calibrage courant, fixé au briefing du 6 juillet 2026 (voir `baffled-bar`).
  L'historique de la barre : 45 %, puis 35 %, puis 20 %. Elle ne redescend jamais ;
  les citations ci-dessus (35 %) datent d'un palier antérieur et restent comme trace.
- **Ne voir aucun défaut signifie que la relecture a échoué**, pas que le travail est
  bon.
- Le pourcentage **peut reculer** : un chantier large mais superficiel ne le fait pas
  monter, et une livraison médiocre annule du travail déjà compté.
  > « So right now, with all of this being said, we just left thirty five percent
  > back to twenty percent. There's a lot of work to do. »
- Ne jamais écrire « c'est fini », « 100 % », « prêt à déployer ». C'est lui qui donne
  le chiffre, et il vérifie toujours en vrai.
  > « I don't wanna have or see a notification again telling me that you're done when
  > you are not done. »

## 7. Corriger la classe, pas l'endroit

Quand un défaut est trouvé — par soi ou par lui — le corriger **partout où cette
classe de défaut existe**, pas seulement là où il a été montré. Puis vérifier la
cohérence entre toutes les surfaces : boutons, textes, bot, métadonnées, e-mails,
pages annexes doivent raconter la même chose.

## 8. Ce qui sort de la passe

Jamais un simple « c'est corrigé ». Une liste écrite :

1. Défauts trouvés (y compris hors périmètre).
2. Corrections faites, et comment elles ont été vérifiées.
3. Améliorations proposées.
4. Incohérences et angles morts.
5. Questions, avec une réponse proposée pour chacune.
6. Le pourcentage, et ce qui manque pour atteindre le suivant.

## Voir aussi

`baffled-bar` (le standard) · `the-warden` (le registre des fautes) ·
`respect-de-l-existant` (ne jamais corriger en supprimant) ·
`prompts-et-evals` (quand le livrable est un prompt, la passe devient une suite d'évals)
