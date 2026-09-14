---
name: fusion-baffled
description: Fusionner la banque de références avec la barre — comment atteindre le niveau baffled bar ET le dépasser, en empilant des mécanismes issus de plusieurs sites d'élite au lieu d'en copier un seul. CHARGER AVANT toute création ou direction artistique : nouvelle page, section, refonte, palette, typographie, animation, concept, nom, offre, métadonnées. Se déclenche sur « fusionne », « empile », « merge », « la banque », « les références », « au-dessus de baffled bar », « et au-delà », « inspire-toi », « niveau mondial », « scroll stopping », « comment on fait mieux que », et par défaut dès qu'un travail visuel commence. Aussi en anglais : merge references, stack, design bank, beyond baffled bar, world class, state of the art. Reproduire une référence n'est PAS baffled bar — c'est le défaut que cette skill existe pour empêcher.
---

<!-- baffled-bar:source-of-truth -->
> **Source de vérité : `baffled-bar`.** À charger AVANT de produire quoi que ce soit de
> visible et AVANT d'annoncer que c'est fini. Son standard prime sur tout ce qui suit :
> en cas de désaccord, `baffled-bar` gagne.
>
> **Source of truth: `baffled-bar`.** Its standard overrides everything below. The bar only
> moves up: a claimed 100% is 20%, 15% with rigor. Seeing no flaw means the review failed.

# Fusion baffled

`veille-references-web` dit **d'ouvrir la banque**. `baffled-bar` dit **où il faut arriver**.
Cette skill est le pont entre les deux : **comment on transforme 1336 sites capturés en
quelque chose qu'aucun d'eux n'est.**

## Le postulat, et sa correction

Eddy : *« ces designs ne sont pas à répliquer — sinon ce n'est pas baffled bar — mais à
fusionner et empiler de différentes façons. »* Correct, et incomplet. Voici la correction,
et c'est la règle centrale de cette skill :

> **Empiler n'amène qu'au niveau des sources.**
> Fusionner trois sites excellents produit un site excellent. Excellent est un échec.
> La fusion est le **plancher**, pas le plafond. Le franchissement se fait par le **+1** :
> après la fusion, le livrable doit porter **au moins un mécanisme qui n'existe dans aucune
> des références utilisées**. C'est ce mécanisme, et lui seul, qui produit « ce n'est pas
> possible ». Sans +1, on a fait de la marqueterie de luxe.

Un livrable sans +1 nommé n'est pas fini. Le +1 se déclare explicitement dans le rapport.

## La banque

```
C:\Users\Mommy Jayce\Desktop\Boxing Center\Portet\scrapers\output
```

1336 dossiers, un par site. Chacun contient :

| Fichier | Ce qu'on en tire |
|---|---|
| `screenshot_desktop.png`, `screenshot_mobile.png` | la composition, en **pleine résolution** — un aperçu dégradé produit des conclusions fausses |
| `index.html` + `assets/` | le DOM réel, les fontes, les scripts — le mécanisme, pas l'impression |
| `metadata.json` | **le raccourci** : `url` (le site vivant) et `tech_stack` — `canvas_count`, `three_js`, `gsap`, `lenis`, `framer_motion`, `next_js`… |

**`metadata.json` est le filtre le plus rapide qui existe et il est sous-utilisé.**
`canvas_count: 6` sur resn.co.nz, `120` sur ciechanow.ski, `gsap + lenis` sur brickvisual :
on sait avant d'ouvrir quoi que ce soit où est le travail. Filtrer la banque par
`tech_stack` avant de regarder une seule image.

**La capture est un instantané mort.** Le mouvement, le son, la latence, les états de survol
n'y sont pas. Toute référence retenue doit être **ouverte en vrai sur son URL** avant d'être
utilisée — c'est pour ça que l'index porte les liens. La capture sert au tri, jamais à
la décision.

Banque interne, à traiter à égalité : les projets du Desktop — `EAM`, `eddy-v2`, `eddy-v3`,
`eddy-portfolio`, `Boxing Center`, `RuntimeStudio`, `ImmoHome`, `Microdidact`,
`logiciel-formulaire`, `Trinity School Website`, `Law firm`, `marketzone`, `Nummis`,
`FARENO-TRANSIT`, `JCBO`. La version précédente est le **plancher** : ne jamais livrer plus
pauvre qu'elle (voir `respect-de-l-existant`).

## Le portillon — une référence est-elle à la barre ?

« À la barre ou proche » n'est pas une impression. Cinq tests, tous éliminatoires.
Une référence qui en rate un est de la documentation, pas une source de fusion.

1. **Incrédulité** — la réaction visée est « ce n'est pas possible », pas « c'est propre ».
   Si la première pensée est « je saurais faire », le site sort.
2. **Mécanisme nommable** — on peut décrire l'astuce en une phrase technique (le vortex avec
   imagerie contextuelle dedans, le shader de fluide sur le curseur, l'audio continu à
   travers la navigation). Si on ne sait dire que « c'est beau », on n'a rien vu.
3. **Cohérence sur toutes les surfaces** — le niveau tient sur les sous-pages, le 404, les
   e-mails, les métadonnées. Un hero génial suivi de sections template : sort.
4. **Parité mobile** — la même expérience, pas une version amputée. Couper les effets sur
   téléphone est un échec, pas une optimisation.
5. **Performance** — le scroll ne accroche pas, le premier affichage arrive. Un site
   somptueux qui rame est sous la barre par définition.

Trois niveaux dans l'index : **S** = passe les cinq. **A** = passe quatre, rate un (souvent
mobile ou perf) — utilisable pour la couche où il excelle, jamais comme modèle global.
Tout le reste de la banque = **documentation** : bon pour un pattern d'UX, un schéma de
métadonnées, un tunnel de conversion, jamais pour la direction artistique.

## Les couches à extraire

Ne jamais prendre « le design » d'un site. On prend **une couche**. Onze couches, et une
référence n'est presque jamais maîtresse de plus de deux ou trois :

1. **Structure & parcours** — le récit, l'ordre des sections, les portails d'entrée/sortie
2. **Composition & typographie** — hiérarchie, échelle, rythme vertical, largeur de ligne
3. **Couleur & matière** — d'où vient la teinte, comment la lumière se comporte
4. **Motion & orchestration** — timings, courbes, ce que le mouvement *communique*
5. **Temps réel / 3D** — shaders, particules, physique, ce que le canvas apporte au récit
6. **Chargement & transitions** — préchargeur, entre-deux, ce qui se passe pendant l'attente
7. **Son** — effets contextuels, continuité, où la cloche tombe
8. **Copy & persuasion** — ethos, pathos, logos ; les accroches, ce qui fait rester
9. **Micro-états** — survols, focus, vides, erreurs, désactivé, chargement
10. **Métadonnées, SEO & GEO** — titles, structured data, sitemaps, hreflang, OG, ce que
    lisent les robots de Google **et ceux des IA**. Jugé plus durement que le reste.
11. **Performance & accessibilité** — budget, images, contraste réel, clavier, `prefers-reduced-motion`

**Une couche non traitée est une couche générique.** Le SEO et les métadonnées se fusionnent
comme le motion : on va voir comment patek.com structure ses données, comment
ourworldindata.org se fait citer par les IA, comment stripe.com titre ses pages.

L'index des références est rangé **par couche**, pas par secteur : `references/banque-s.md`.

## Les six opérations de fusion

Répliquer est interdit. Voici ce qu'on fait à la place. Chaque opération produit quelque
chose que la source ne contient pas.

| Opération | Ce qu'on fait | Exemple de forme |
|---|---|---|
| **Greffe inter-couches** | prendre la couche L de A et la poser sur la structure de B | le timing d'orchestration de lusion.co sur une structure éditoriale à la a24films.com |
| **Inversion** | faire l'inverse du geste dominant de la référence | là où exoape.com révèle par fondu lent, révéler par coupe sèche et laisser le son porter |
| **Compression** | faire en un moment ce que la référence étale sur trois | trois scènes de igloo.inc fusionnées en une transition unique |
| **Escalade** | prendre le pic de la référence comme **niveau de départ** | ce que zentry.com fait à son climax devient notre section 2 |
| **Collision** | fusionner deux domaines qui ne se rencontrent jamais | la rigueur de données de ciechanow.ski appliquée à une page produit de boxe |
| **Soustraction** | retirer la signature de la référence, garder seulement son timing ou sa densité | les courbes de darkroom.engineering sans aucun de ses effets |

Une fusion sérieuse en enchaîne **trois ou quatre**, pas une.

## Le portillon anti-clone

Avant toute implémentation, ces trois tests. Un seul échec = ce n'est pas de la fusion,
c'est un plagiat mieux habillé.

1. **Test du nom** — un designer qui regarde le résultat peut-il nommer LA référence ?
   Si oui, on a cloné. Une fusion réussie fait dire « d'où ça sort ? », pas « ah, c'est du
   Lusion ».
2. **Règle des trois sources, deux domaines** — chaque surface visible emprunte à **au
   moins trois références**, dont au moins deux de **domaines différents** (un studio WebGL
   + une maison d'horlogerie + un site de données). Une seule source = clone.
3. **Test de recontextualisation** — chaque geste emprunté a été traduit dans le domaine
   du projet. La boxe a ses rounds, son ring, son entrée d'arène ; l'immobilier a la
   visite et les clés. Un geste transplanté tel quel se voit immédiatement.

Et le rappel de `veille-references-web` : *« avant de vouloir faire mieux, comprendre
pourquoi ça marche »*. Sinon on reproduit fidèlement. **Jamais de version tiède entre les
deux.**

## Le contrat de sortie

La fusion ne se raconte pas, elle se tabule. **Avant** d'implémenter, section par section :

| Section | Couche empruntée | Référence (lien) | Opération | Ce que ça devient chez nous | +1 |
|---|---|---|---|---|---|

Plus, en dessous :

- **Ce qu'on ne prend PAS**, et pourquoi. Les décisions justifiées donnent vie au projet.
- **Le +1 du projet** — le mécanisme absent de toutes les références, nommé et défendu.
- **Le registre des références utilisées**, écrit dans le projet (dossier gitignoré, voir
  `second-brain`) : la prochaine session ne réempile pas la même pile.

## La boucle d'auto-échelle

C'est le sens de « pour qu'on se mette à l'échelle nous-mêmes » :

1. Le livrable fini **rentre dans la banque** comme référence interne, et passe le portillon
   des cinq tests comme n'importe quel site scrapé. S'il ne les passe pas, il n'est pas fini.
2. Le registre des références interdit de reprendre la même pile au chantier suivant —
   *« sinon on va produire les mêmes sites à chaque fois »*.
3. Le pool se renouvelle : au moins **dix sources en ligne hors banque** à chaque chantier
   (Awwwards, FWA, Dribbble, YouTube, TikTok, Reddit), parce que la banque est un instantané
   et que la barre monte tous les jours.
4. Le +1 du chantier N devient une couche disponible au chantier N+1. C'est comme ça que le
   plancher monte tout seul.

## Ce que cette skill refuse

- Dessiner d'imagination quand la banque existe en local.
- Prendre une seule référence comme modèle, même « adaptée ».
- Se limiter au secteur du client : *« focus on the ones with insane UI »*.
- Copier un concurrent — l'objectif est de ne ressembler à personne.
- Livrer une fusion sans +1.
- Répondre « je n'ai pas trouvé » ou « je n'ai pas accès ».

## Voir aussi

`baffled-bar` (le standard) · `veille-references-web` (ouvrir la banque, les six règles) ·
`kill-generic` (ce qu'on fuit) · `respect-de-l-existant` (s'inspirer sans copier) ·
`passe-hater` (la note avant de montrer) · `second-brain` (le registre, le protocole A→B) ·
`roblox-watch` (la même méthode côté jeu)

**Index par couche : `references/banque-s.md`** — le tier jugé, rangé par couche.
**Index intégral : `references/banque-complete.md`** — les 1331 sites, liens vivants, les
non-jugés triés par force de signal.
**Journal du portillon : `references/portillon-journal.md`** — ce qui a été réellement
ouvert et jugé, daté. Un site absent de ce journal n'est pas jugé.

> **Le tri mécanique n'est pas un jugement.** Passe 1 : sur 4 candidats promus par le
> signal technique, zéro passe la barre. `canvas_count` mesure l'activité, pas l'intention.

**Index des références : `references/banque-s.md`** — 215 sites de la banque, rangés par
couche, avec les liens vivants et le stack détecté.

## Fusionner une famille — récolte 2026-09

**Le gabarit + le registre.** Un membre de référence porte la mécanique (structure,
composants, contrôles de build) ; chaque autre membre est une copie où l'on
remplace le registre de vérité, les intentions, le texte, les images et l'accent —
jamais la mécanique. Ce qui se partage se factorise ; ce qui se vit se réécrit.

**Le test du remplacement.** Remplacer le nom (ville, client, produit, personnage)
par un autre : si la page reste vraie, c'est une page satellite. Un membre doit
porter au moins 40 % de contenu qui n'appartient qu'à lui — ses accès, ses voisins,
ses questions, son fait local, ses preuves.

**Le membre porte la couleur de là où il envoie.** Quand une famille renvoie vers
plusieurs destinations, la sous-famille prend son accent du monde matériel réel de
sa destination (le cuir des sacs, la fresque, le gazon, le bronze) — jamais la
palette de la destination elle-même, jamais celle d'un autre membre. Une seule
typographie et une seule grammaire pour la famille ; hero et photo différents pour
chaque membre.

**Le +1 par inversion de l'incertitude.** Chercher quelle variable est réellement
incertaine pour la personne. Quand le choix existe (deux destinations), le
mécanisme résout le choix ; quand la destination est connue d'avance, ce qui se
mérite devient *quand*, ou *comment*, ou *avec qui* — et le mécanisme signature
change de sujet sans changer de grammaire. Reprendre le même +1 sur un cas où il n'a
plus d'objet est une copie, pas une fusion.

**Les registres à fentes.** Une liste d'intentions n'est pas un livrable : un
registre de motifs à fentes (`{ville}`, `{client}`, `{produit}`, `{accès}`) avec
rôle, page cible, variantes orthographiques, vérité conditionnelle (« ne cibler que
si la source le publie ») et exclusions motivées, instancié par un script sur les
faits de chaque membre, puis coupé à la main. C'est ce qui rend une famille
produisible en série sans devenir du bruit.
