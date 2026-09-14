# Journal du portillon — passes visuelles

Registre daté des sites **réellement ouverts** et passés aux cinq tests. Rien n'entre ici
sans que la capture ait été regardée. Un site absent de ce journal n'est pas jugé, quel que
soit son rang dans `banque-complete.md`.

---

## Passe 1 — 02.09.2026 · 6 sites ouverts

Choix : 2 témoins du tier S (calibrage) + 4 candidats en tête du tri mécanique de
`banque-complete.md`, pour tester si le signal technique prédit la barre.

### Confirmés

**[lusion.co](https://lusion.co) — S confirmé.** Cluster 3D vivant en hero, dans un
conteneur à coins arrondis : le canvas se lit comme un **objet posé sur la page**, pas comme
un fond. Même primitive déclinée en verni, mat et translucide — la variété vient de la
matière, pas de la forme. Capture prise en pleine animation (titre à moitié tombé) : la
page bouge avant même le scroll. *Couche à emprunter : orchestration, matière.*

**[igloo.inc](https://igloo.inc) — S confirmé.** Paysage plein cadre avec profondeur de
brouillard ; l'igloo est bâti de briques éclairées et **des points de données vivants
(76, 82, 29, 27, 19) sont câblés dans l'objet 3D** — la donnée devient ornement structurel.
Aucun hero centré : les blocs de texte sont ancrés aux quatre coins, en mono. Et
`Sound: Off` est exposé en bas à gauche — le son est une décision déclarée, pas un réglage
caché. *Couche à emprunter : données-dans-la-3D, ancrage aux coins, défaut sonore assumé.*

### Écartés — et c'est là que le tri mécanique s'effondre

**[splice.com](https://splice.com) — écarté.** `canvas ×35`, 63 scripts : premier du tri
mécanique parmi les non-jugés. Et la capture montre une page SaaS de manuel — bandeau promo,
nav, photo plein cadre, titre à gauche, bouton bleu en pilule. Les 35 canvas viennent du
gribouillis de forme d'onde en bas. **Structure générique avec une bonne couche de peinture**,
la faute nommée par `kill-generic`. Zéro emprunt.

**[trigger.dev](https://trigger.dev) — A pour une seule couche, écarté comme modèle.**
Page sombre soignée, mais c'est un empilement vertical de sections features : bento, blocs
de code, barre de logos, mur de témoignages, gros chiffres, CTA final. Compétent, prévisible.
*À ne garder que pour la lisibilité des blocs de code en page marketing.*

**[landonorris.com](https://landonorris.com) — A, couche typographie.** Vert acide sur
quasi-noir, et **deux familles mélangées à l'intérieur d'une même phrase** (grotesque
condensée + serif italique sur « WINS », « LEGACY ») avec alternance de couleur mot à mot.
Grille « HELMETS HALL OF FAME » à coins encochés. *À emprunter : le titre bi-typographique.*

**[sui.io](https://sui.io) — écarté.** `canvas ×15 · gsap · lenis` promettait beaucoup ;
la capture donne un halo dégradé bleu en hero (cliché 2024-25) puis une longue page sombre
de panneaux flottants. Rien à prendre.

### Verdict de la passe

**Sur 4 candidats promus par le signal technique, aucun ne passe la barre comme modèle
global.** Le tri mécanique remonte des pages SaaS et crypto riches en canvas, pas des sites
baffled bar. Le tri sert à **ordonner la file d'attente**, jamais à juger.

---

## Trois corrections de méthode, trouvées en ouvrant

1. **`canvas_count` est un générateur de faux positifs.** splice.com : 35 canvas pour une
   forme d'onde décorative. Le nombre mesure l'activité, pas l'intention.
2. **Les captures ne sont pas au même format.** lusion, igloo et splice sont en hauteur
   d'écran ; trigger.dev fait 11 337 px, landonorris 14 510, sui.io 18 231 — ce sont des
   **pleines pages**. Sur celles-là on lit toute la structure sans ouvrir le site : c'est le
   moyen le plus rapide de juger le test n°3 (cohérence sur toutes les surfaces).
3. **Une grande zone vide dans une capture pleine page ne veut pas dire un site pauvre** —
   elle veut dire que le contenu se révèle au scroll et que le capteur ne l'a pas déclenché.
   landonorris.com est plein de blocs noirs vides et reste bien dirigé. Ne jamais écarter sur
   du vide : ouvrir le site.

---

## File d'attente — prochaine passe

Restants du haut de `banque-complete.md` non ouverts : `elektron.se` (canvas ×45, le plus
haut signal de toute la banque), `lightyear.com`, `apple.com/apple-tv-plus`, `polar.sh`,
`asana.com`. Puis descendre la liste des jugés pour re-vérifier le tier S sur capture, qui
n'a encore jamais été fait — le classement S/A de `banque-s.md` vient des noms de domaine,
du stack et de la connaissance du milieu, **pas des images**.

**Compteur : 6 sites ouverts sur 1331. La banque est jugée à 0,5 %.**
