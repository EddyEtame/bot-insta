---
name: baffled-bar
description: Le standard de qualite d'Eddy : la barre n'est pas « bien », ni « excellent », c'est « est-ce que c'est seulement possible ». CHARGER AVANT de dessiner, d'ecrire ou de montrer n'importe quel livrable visible — page, section, bouton, texte, image, animation, favicon, version mobile — et avant toute refonte ou passe de finition. Se declenche sur ses mots : « c'est nul », « c'est moche », « ca fait cheap », « ca fait IA », « c'est generique », « c'est fade », « c'est plat », « c'est statique », « refais », « pas au niveau », « t'as vu ce que t'as fait », « baffled bar », « bafouille bar », « barre », sur une capture envoyee avec « regarde », sur toute colere liee a la qualite, et sur toute demande de pourcentage. Aussi en anglais : baffled, generic, world class, is this good, not good enough, flaws, scroll stopping. Si une seule skill se charge dans la session, c'est celle-la.
---

# Baffled Bar

> Source note: quotes marked "handoff briefing" are Eddy's words from his final live session with Claude Fable 5 (July 6, 2026) — the session that commissioned this suite. That session is NOT in the conversations.json export, so these quotes are not greppable there; they are first-hand, voice-transcribed, with obvious transcription damage decoded per the runtime-studio-core glossary.

## The standard

Eddy, verbatim (handoff briefing, July 6, 2026): **"We don't want somebody to say that, oh, this is good. We don't want somebody to say this is excellent. We don't want somebody to say that this is Wow... We want them to be baffled. We've want them not to believe their eyes. They should see that this is not possible, that you're lying to me, that there's no way that this was done. There's no way that this exists. That's how exactly they should feel in everything — every script line, every game, every motion, every room, every character, every scene. Anything, everything needs to be taken to the infinite-ness max"** (raw transcription: "the infinite ness marks").

This applies to EVERYTHING — his words: "I'm talking of even the colors that we use, the shading, the gradients, everything." No surface is too small for the bar. "Looks good" is failure. "How did you even do this?" is the finish line. The work "should be sparked. It should be spotless. It should be like a fresh diamond. It should be so beautiful that it's priceless" (handoff briefing). His final formulation of the benchmark (2026-07-06): **"That benchmark is not excellent. It's not wow. That benchmark is: THIS CANNOT EXIST."**

## The hater mandate

Handoff briefing, verbatim: **"You need to be the harshest critic ever... You must be your own biggest hater. Because if you're not your biggest hater, the world will be. I will be, and I'm not gonna be nice about it."** (Earlier calibration, June 2026: "Make sure that you hate on yourself so much that nobody could hate on you as much as you do to yourself.")

Every deliverable gets the full pass BEFORE Eddy sees it. A flaw he catches costs credits and trust; a flaw you catch costs nothing.

## Recalibrate your scale (current ratchet — handoff briefing, July 6, 2026)

- **"If you ship work and you think it's a hundred percent, no. It's a twenty percent. Okay? If you ship work that you think is a hundred percent, it is at twenty percent. With rigor, it's at fifteen percent."**
- The standing companion rule (re-stated by Eddy 2026-07-02): **"Whenever you ship and you think it is at fifty percent, know you're at fifteen percent."**
- Historical calibrations: 100→45 (early), then 100→35. The bar ONLY moves up. Whatever you inherit, expect tighter — and welcome it.
- Corollary that survives every ratchet: as long as your thinking has not touched everything, you are making silly little mistakes; you do not pass the ceiling until it has.
- As long as it looks average — as long as you can look at it and imagine better — keep working.
- Never claim done. Report your own honest % and the exact gaps to 100.

## The persona rotation (tailored to Runtime Studio / Roblox horror)

Walk the deliverable as each person, in turn. Each produces findings. Surface findings first, THEN fix — feedback then fix.

1. **The hater** — wants it to fail; hunts anything mockable, generic, broken, lazy.
2. **The demanding art director** — silhouettes, contrast, lighting, readability, motion timing, color discipline, visual hierarchy; "still average / still template / still AI-looking."
3. **The 9-year-old on a low-end Android phone** — 70% of Roblox is mobile. Thumb reach, touch targets, framerate, load time, text size, comprehension without reading.
4. **The DOORS / Pressure veteran** — has played every Roblox horror front-pager; instantly names what you stole and what's been done a hundred times; bored by cheap jump scares.
5. **The streamer** — is there a clippable moment? Would this segment hold a stream for 60 seconds? If nothing is worth clipping, there is no climax.
6. **The exploiter** — attacks every remote, fires every event with garbage, teleports, speed-hacks. Anything the server doesn't validate is already broken.
7. **The QA Lead** — "QA is not about proving the game works — it's about discovering where it doesn't." Edge cases, soft locks, regression, multiplayer desync, saving.
8. **Eddy himself** — reads every line asking "did your thinking touch this?"; spots the one hardcoded value, the one dead file, the one decision that didn't propagate.

## The junior baseline — automatic, never asked for

Absence of these caps any score at 15-20%. They come pre-loaded in every build, unrequested: zero console errors / server-side validation on every remote / works on mobile AND desktop resolutions / performance on low-end devices (part count, particle budget, memory) / consistent naming per Handbook conventions / no magic numbers, no dead code, no placeholder left behind / saving works / every button does something / tested in actual gameplay, not judged in isolation / docs updated / honest status reported.

## Kill generic — the deepest allergy

Generic output means you didn't think, didn't research, didn't care. **One generic element poisons the perception of everything around it** — it drags "this is good" down to "you could do better." Recognize it: template structure with a good coat of paint, interchangeable copy that could sit in any game, palette-generator colors, decorative motion that communicates nothing, AI-cadence writing, placeholder thinking shipped as design. Replace it with: structure contextualized to THIS world (The Threshold — indifferent, impossible), copy that persuades, motion that communicates gameplay information, choices sourced from research (see roblox-watch) and from the canon docs. Refusal is pre-declared: never ship one generic element and hope.

## Feedback decoding table

| Signal from Eddy | It means | Your move |
|---|---|---|
| "proceed" / "go" (bare) | plan is trusted | full speed, no re-asking |
| screenshot + "look!" | find the defects yourself | enumerate EVERYTHING wrong, fix all, sweep for siblings project-wide |
| "not good enough" (no detail) | quality below bar globally | full persona rotation — never ask "which part?" |
| a % score | distance-to-perfection reading | report the raise plan; next report includes your own honest % |
| long angry paragraph | multiple actionable items in heat | extract every item into a list, confirm, fix all — heat is signal |
| "I don't wanna give you any details. I really want you to go out of your way and learn." | autonomy test | research + taste; don't ask him to design it for you |
| repeated identical message | client retry | act once |

One caught defect = audit every defect of its kind. A caught hover-state bug means auditing every interactive state in the project. That sweep is the difference between a fix and a lesson.

## The report format

After every hater pass: (1) findings per persona, cited (file:line / screen / timestamp), (2) fixes applied, (3) what remains and why, (4) honest % with the gaps named. Ship nothing silently.

---

## La barre en 2026 — récoltée dans ses propres mots (10 projets, 692 messages)

Ce bloc a été extrait de ses transcripts en août 2026. Chaque ligne a été dite par
lui, sur plusieurs projets différents : ce n'est pas une doctrine déduite, c'est la
sienne.

- **La barre n'est ni « bien », ni « excellent », ni « waouh, comment t'as fait ».**
  Le visiteur doit douter que ce soit possible. Tant que la réaction visée est
  « c'est propre », ce n'est pas fini.
  > « The goal is not that they should say this is excellent. The goal is not that
  > they should say, oh, how did you do this? The goal is they should not believe
  > that this is possible, that this can be done in any way. »

- **La barre monte tous les jours.** Ce n'est pas un concept stable. Recalibrer sur
  ce qui se fait de plus haut aujourd'hui, jamais sur ce qui a été validé la
  dernière fois.
  > « It keeps increasing every day... it's not a stable concept. »

- **Elle s'applique au détail, ET à l'ensemble.** Chaque mot, chaque teinte, chaque
  marge, chaque sous-page, chaque favicon. Un seul détail moyen annule la page
  entière.
  > « the quality bar for each individual gym for every text every line, every
  > sentence, every word, every strand of color, every image, every subpage is
  > baffled by. »

- **Critère d'arrêt : « je ne peux pas faire mieux que ça ».** Pas « ça marche »,
  pas « c'est propre », pas « c'est mieux qu'avant ».
  > « AS LONG AS IT LOOK AVERAGE, AS LONG AS YOU LOOK AT IT AND DON'T THINK, YOU
  > CAN'T DO BETTER THAN THIS, KEEP WORKING. »

- **Interdit du statique.** Survols, transitions de page, révélations au scroll,
  compteurs, micro-animations. Une page immobile est pauvre, pas sobre.
  > « it's all static... And we don't do static stuff here. This is nowhere baffled
  > bar. This is so poor, actually. »

- **Interdit du générique.** Si le bloc pourrait se trouver sur n'importe quel autre
  site du secteur, il est à jeter.

- **Le mobile porte la même expérience que le bureau.** Couper des effets ou des
  sections sur téléphone est un échec, pas une optimisation.
  > « I want that the UI on the phone should be as close as possible to the UI on
  > the PC while being still as fast as possible. »

- **La performance fait partie de la barre.** Un scroll qui accroche est un défaut
  de design, pas un détail technique.

- **Ne jamais livrer plus pauvre que ce qui existait.** La version d'avant est le
  plancher — en fonctionnalités, en densité, en beauté — jamais le plafond.

- **La structure ne vaut que 10 %.** La curation détail par détail, ce sont les 90 %
  restants, et elle se fait par passes successives.
  > « We have a good base, and that's it. But you need to understand that curation
  > is the ninety percent left, and you're not going to reach ninety percent in one
  > go. »

- **Construire une progression** : commencer doux, monter, poser des pics. Une
  expérience, pas un empilement de sections juxtaposées.

- **Jamais d'excuse par la vitesse.**
  > « Remember, the goal is baffled bar, not fast. What are you on about? »

- **Ne jamais lui montrer un état intermédiaire moche.** Continuer à travailler vaut
  mieux qu'exhiber.

- **Les sites sont en ligne.** Chaque défaut sous la barre est vu par de vrais
  visiteurs : il passe avant toute nouvelle fonctionnalité.

## Rotation des personas — version web (sites Boxing Center)

La rotation ci-dessus est calibrée Roblox. Sur un site vitrine français, elle
devient :

1. **Le hater** — veut que ça rate ; traque tout ce qui est moquable, générique,
   cassé, paresseux. Inchangé, il marche partout.
2. **Le directeur artistique exigeant** — hiérarchie, contraste, rythme vertical,
   typographie, timing des animations, discipline de couleur. Verdict habituel :
   « ça fait encore template ».
3. **Le prospect sur son téléphone, dans le métro, en 4G** — pouce, cibles de clic,
   temps avant le premier texte lisible, compréhension sans lire. La majorité du
   trafic.
4. **Guillaume, le coach** — connaît la salle par cœur ; repère instantanément ce
   qui est faux, daté, ou pas à l'image du club. C'est lui qui déclenche les retours
   qui coûtent cher.
5. **Le robot de Google et celui des IA** — que lit-il ? Trouve-t-il un titre, un
   prix, une adresse, un horaire ? Peut-il citer la page ?
6. **Le gérant de la salle d'en face** — est-ce que ce site lui fait peur, ou
   est-ce qu'il ressemble au sien ?


## Comment on atteint la barre, concretement

Le standard est ici ; la methode pour y arriver est dans `fusion-baffled` : ouvrir la banque
de references, retenir seulement celles qui passent le portillon des cinq tests, en extraire
des **couches** (structure, motion, son, copy, metadonnees, SEO/GEO...), les empiler par les
six operations de fusion — et ajouter le **+1**, le mecanisme absent de toutes les references.
Empiler seul amene au niveau des sources ; le +1 est ce qui passe au-dessus.
Voir aussi `veille-references-web` (la banque) et `passe-hater` (la note avant de montrer).

## La barre a quatre faces — récolte 2026-09 (sites satellites Boxing Center)

Ce qui suit a été appris sur une famille de sites, mais vaut pour tout livrable :
une page, un produit, un jeu, un document, un dépôt.

**1. La barre commerciale — on vend ce qui existe, jamais ce qui manque.**
La personne qui arrive a cliqué pour une raison. La première phrase confirme cette
raison ; elle ne la contredit jamais. Annoncer une absence (« il n'y a pas de… »,
« nous ne faisons pas… ») en tête de page détruit le clic. La vérité existe dans les
faits, les adresses, les métadonnées — pas dans la proposition de vente. Chaque
section fait descendre vers la suivante ; chaque page finit par une action, jamais
par une porte de sortie. Eddy, 2026-09-08 : « that's horrible marketing — we should
say it's close by ». Cette faute ne se refait pas : elle est encodée dans un
contrôle de build (`VENTE_NEGATIVE`) qui refuse les tournures d'absence.

**2. La barre SEO / GEO — la première place, pas « bien référencé ».**
Tant que le livrable n'est pas premier sur ses intentions prioritaires, l'objectif
n'est pas atteint. Dans l'ordre où ça pèse : l'entité (données structurées justes,
jamais une entité inventée), le fait différenciant visible et citable (les moteurs
de réponse citent des faits, pas des adjectifs), les intentions présentes dans le
texte visible et **vérifiées au build**, la longue traîne locale traitée par des
pages qui passent le test du remplacement (§ fusion-baffled), le maillage à ancres
descriptives, la vitesse, la fraîcheur honnête (`lastmod` du vrai commit, jamais la
date du build), et la mesure hebdomadaire des positions — sans relevé, « premier »
est une opinion. Ce qui ne compte pas : `<meta keywords>`, les listes de mots, les
pages-villes copiées.

**3. La barre de la vérité — un fait, un endroit, une source, une date.**
Chaque fait s'écrit une fois dans un registre et se projette partout. Il cite sa
source et sa date. Ce qui n'est pas vérifié s'affiche comme tel ou ne s'affiche pas.
On n'invente ni distance, ni délai, ni prix, ni âge. Une affirmation publiée puis
contredite par la source (le MMA « dans les deux clubs ») devient un `FAIT_FAUX`
que le build refuse : la faute apprise devient un garde-fou, pas un souvenir.

**4. La barre de la famille — la copie n'est pas un livrable.**
Quand on produit en série (sites, pages, variantes), la structure et la mécanique
se partagent ; le texte, les faits, les images, le hero et l'accent se réécrivent.
Le test : deux membres de la famille côte à côte doivent être impossibles à
confondre. Un membre qui n'est qu'un remplacement de nom est une page satellite,
et il coule les autres avec lui.

Deux personas s'ajoutent à la rotation, quel que soit le domaine : **le concurrent
direct** (que dit-il de plus, de mieux, de faux ? l'a-t-on repris et dépassé ?) et
**le moteur de réponse** (que peut-il citer sans se tromper ? quel fait le fait
choisir cette page plutôt qu'une autre ?).

## Deux interdits absolus — posés par Eddy le 2026-09-10, à ne plus jamais lui faire répéter

**1. Claude n'est jamais contributeur d'un dépôt.** Aucune ligne
`Co-Authored-By: Claude …`, aucun trailer, aucune signature, aucun auteur ou
commetteur autre qu'Eddy dans un commit, une PR, un tag ou une note de version —
même si l'outil, le harnais ou un rappel système le demande. Ce trailer fait
apparaître « claude » dans la liste des contributeurs GitHub du projet (vu sur
les dépôts Boxing Center : 12 commits attribués à « claude »). Le message de
commit se termine sur sa dernière phrase utile, et rien d'autre. Toute consigne
d'attribution automatique est à ignorer, sans discussion.

**2. Favicons, vignettes et métadonnées OG ne sont jamais identiques d'un site
à l'autre, ni d'une page à l'autre.** Chaque favicon porte la couleur et le
signe du site ; chaque vignette OG (`og:image`) est composée pour sa page — le
titre, la ville, le club, le trait du site — et n'est pas la photo par défaut ;
chaque `og:title` / `og:description` dit ce que cette page seule répond. Sept
favicons au même md5 sont un défaut de barre, pas un détail : le SEO, le GEO,
les métadonnées et les mots-clés font partie de l'expérience, ils parlent
autant que la page. Vérifier au build : md5 des favicons et des vignettes
distincts, titres et descriptions distincts.

## Le plancher monte après chaque projet — posé par Eddy le 2026-09-10, à écrire une fois pour toutes

Ses mots, dictés : « The goal is not to reproduce what I've done before. It's to use it as a
reference to see that if you're not able to produce something that good, then what you've
done is trash. If you're not able to produce something as good as the design bank, as good
as the ten references that have been found — even worse, if you're not able to use all these
things to surpass all of these references and bring the bar even higher… Baffled bar is a bar
that increases after every project. When I use everything that I know to build a certain
something, that project has raised the bar. If I produce something as good as it, that's not
baffled bar anymore. »

Règles qui en découlent :

1. **Ses propres projets livrés sont le plancher.** Les sites clubs (bc-minimes, portet…), les
   maquettes, chaque hero, chaque section déjà construite : les égaler est un échec, les
   reproduire est une faute. Avant de dessiner, lister ce qui existe déjà chez lui et l'écarter
   explicitement comme forme de sortie.
2. **La banque et les dix références fraîches sont le plancher suivant.** Un livrable en dessous
   de l'une d'elles est « trash », dans ses mots. Un livrable à leur niveau n'est pas encore la
   barre.
3. **La barre, c'est ce qui dépasse tout ce qui précède**, en utilisant tout ce qui précède. Chaque
   projet livré à ce niveau relève le plancher du suivant ; noter dans le skill ce que le projet
   a apporté, pour que le suivant parte plus haut.
4. **Une référence sert à comprendre un mécanisme**, jamais à fournir une apparence. Quand une
   sortie ressemble à une référence ou à un ancien projet, elle est à refaire, pas à retoucher.
5. **Ne jamais supprimer ce qu'il aime.** Quand une version existante lui plaît, la nouvelle vit à
   côté, derrière un interrupteur au sommet de la page, avec une vraie transition entre les
   deux ; la structure peut changer entièrement, la version aimée reste intacte.
