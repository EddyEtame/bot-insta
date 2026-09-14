# Banque S/A — rangée par couche

215 sites tirés des 1336 de `scrapers\output`, retenus parce qu'ils passent le portillon des
cinq tests (**S**) ou en ratent un seul et restent maîtres de leur couche (**A**).

**Comment lire.** Une ligne = un site + **la couche dont il est maître**. On emprunte cette
couche-là, pas « le design ». Le stack entre parenthèses vient de `metadata.json` du dossier
capturé : il dit où chercher le mécanisme avant même d'ouvrir la page.

**La capture est morte.** Ouvrir le lien vivant avant d'utiliser quoi que ce soit — le
mouvement, le son et la latence ne sont pas dans le PNG. Un site peut avoir été refait ou
fermé depuis la capture : c'est le site vivant qui fait foi, pas le dossier.

---

## 1. Motion & orchestration

Le mouvement qui **communique** — pas la décoration.

| Site | Maître de | Stack détecté |
|---|---|---|
| [lusion.co](https://lusion.co) **S** | l'orchestration comme récit ; l'entrée/sortie de section | canvas ×3 |
| [darkroom.engineering](https://darkroom.engineering) **S** | les courbes et la densité de timing | — |
| [studiofreight.com](https://studiofreight.com) **S** | le scroll comme instrument (les auteurs de Lenis) | — |
| [locomotive.ca](https://locomotive.ca) **S** | scroll orchestré, jalons de section | canvas ×2 |
| [ultranoir.com](https://ultranoir.com) **S** | séquences lourdes tenues fluides | canvas ×4, three.js, gsap |
| [merci-michel.com](https://merci-michel.com) **S** | la transition-spectacle | canvas, three.js, gsap |
| [obys.agency](https://obys.agency) **S** | typographie en mouvement | canvas |
| [dogstudio.co](https://dogstudio.co) **S** | mise en scène cinéma | canvas, gsap |
| [makemepulse.com](https://makemepulse.com) **S** | micro-interaction joyeuse | — |
| [akaru.fr](https://akaru.fr) **S** | élégance de transition, sobriété active | canvas |
| [adoratorio.studio](https://adoratorio.studio) **S** | curseur, masques, révélations | canvas |
| [exoape.com](https://exoape.com) **S** | lenteur maîtrisée, fondu long | — |
| [hellomonday.com](https://hellomonday.com) **A** | rythme éditorial animé | canvas ×2, gsap |
| [cuberto.com](https://cuberto.com) **A** | micro-animation d'illustration | — |
| [uncommonmatters.com](https://uncommonmatters.com) **A** | retenue, une seule idée de motion | gsap |
| [gsap.com/showcase](https://gsap.com/showcase) | le catalogue de ce qui est faisable | — |
| [motion.dev](https://motion.dev) | la doc qui montre en montrant | canvas ×2 |
| [lenis.dev](https://lenis.dev) | le scroll doux, démontré sur lui-même | canvas |

## 2. Temps réel, 3D, shaders

| Site | Maître de | Stack |
|---|---|---|
| [activetheory.net](https://activetheory.net) **S** | l'expérience temps réel de haut de gamme | canvas |
| [resn.co.nz](https://resn.co.nz) **S** | densité d'effets sans perte de lisibilité | canvas ×6, three.js, gsap |
| [igloo.inc](https://igloo.inc) **S** | monde 3D navigable, direction artistique tenue | — |
| [zentry.com](https://zentry.com) **S** | l'échelle épique, le climax visuel | canvas |
| [bruno-simon.com](https://bruno-simon.com) **S** | le portfolio-jeu, contextualisé à fond | canvas |
| [unseen.co](https://unseen.co) **S** | matière et lumière génératives | canvas |
| [basement.studio](https://basement.studio) **S** | 3D au service du produit | canvas ×3 |
| [aristidebenoist.com](https://aristidebenoist.com) **S** | la démonstration technique élégante | canvas ×2 |
| [garden-eight.com](https://garden-eight.com) **S** | 3D + éditorial japonais | canvas, three.js, gsap |
| [immersive-g.com](https://immersive-g.com) **A** | installation, échelle spatiale | canvas ×2 |
| [phantom.land](https://phantom.land) **S** | l'expérientiel de marque | canvas |
| [unit9.com](https://unit9.com) **S** | production lourde, cas d'usage | gsap |
| [northkingdom.com](https://northkingdom.com) **S** | narration de campagne | canvas, next.js |
| [field.io](https://field.io) **S** | l'abstraction générative comme identité | next.js |
| [universaleverything.com](https://universaleverything.com) **S** | la forme en mouvement continu | — |
| [rhizomatiks.com](https://rhizomatiks.com) **S** | données + corps + scène | — |
| [teamlab.art](https://teamlab.art) **S** | l'immersion collective | next.js |
| [tha.jp](https://tha.jp) **S** | l'école japonaise de l'interaction | — |
| [cassie.codes](https://cassie.codes) **A** | SVG et 3D pédagogiques | canvas |
| [zajno.com](https://zajno.com) **A** | fluide et curseur | canvas |
| [robin-noguier.com](https://robin-noguier.com) **A** | portfolio 3D sobre | canvas, next.js |

## 3. Structure & parcours

| Site | Maître de |
|---|---|
| [a24films.com](https://a24films.com) **S** | le catalogue qui se lit comme un magazine |
| [criterion.com](https://criterion.com) **S** | la collection comme récit |
| [mubi.com](https://mubi.com) **S** | l'éditorialisation du catalogue |
| [playdead.com](https://playdead.com) **S** | le minimum absolu qui tient l'atmosphère |
| [thatgamecompany.com](https://thatgamecompany.com) **S** | l'émotion avant l'information |
| [supergiantgames.com](https://supergiantgames.com) **A** | identité forte, densité maîtrisée |
| [kojimaproductions.jp](https://kojimaproductions.jp) **A** | l'aura de studio |
| [cyberpunk.net](https://cyberpunk.net) **A** | l'univers imposé dès la première seconde |
| [meowwolf.com](https://meowwolf.com) **S** | le portail vers un autre monde |
| [laika.com](https://laika.com) **A** | l'artisanat mis en scène |
| [blumhouse.com](https://blumhouse.com) **A** | l'horreur en identité de marque |
| [big.dk](https://big.dk) **S** | l'archive massive rendue navigable |
| [oma.com](https://oma.com) **S** | la structure comme prise de position |
| [snohetta.com](https://snohetta.com) **S** | le projet raconté par le lieu |
| [herzogdemeuron.com](https://herzogdemeuron.com) **S** | l'index radical |
| [heatherwick.com](https://heatherwick.com) **A** | la narration de projet |
| [zha.com](https://zha.com) **A** | la forme comme navigation |
| [sanaa.co.jp](https://sanaa.co.jp) **A** | le vide comme composition |
| [johnpawson.com](https://johnpawson.com) **S** | la sobriété absolue |
| [dsrny.com](https://dsrny.com) **A** | l'index expérimental |
| [mvrdv.nl](https://mvrdv.nl) **A** | la couleur au service de l'archive |

## 4. Chargement & transitions

Ce qui se passe **pendant** l'attente est une décision de design, pas un vide.

| Site | Maître de |
|---|---|
| [lusion.co](https://lusion.co) **S** | le préchargeur qui joue pendant qu'il charge |
| [igloo.inc](https://igloo.inc) **S** | l'entrée dans le monde |
| [exoape.com](https://exoape.com) **S** | la transition de page invisible |
| [obys.agency](https://obys.agency) **S** | le rideau typographique |
| [buildinamsterdam.com](https://buildinamsterdam.com) **A** | l'enchaînement sans couture |
| [humaan.com](https://humaan.com) **A** | la transition sobre et rapide |
| [upperquad.com](https://upperquad.com) **A** | le passage de section |

## 5. Son

| Site | Maître de |
|---|---|
| [igloo.inc](https://igloo.inc) **S** | l'audio continu à travers la navigation |
| [zentry.com](https://zentry.com) **S** | le son qui accompagne le climax |
| [activetheory.net](https://activetheory.net) **S** | le son contextuel par interaction |
| [meowwolf.com](https://meowwolf.com) **S** | l'ambiance comme signature |
| [cyberpunk.net](https://cyberpunk.net) **A** | l'identité sonore de marque |
| [playvalorant.com](https://playvalorant.com) **A** | le retour sonore d'interface |

## 6. Composition & typographie, éditorial

| Site | Maître de |
|---|---|
| [abcdinamo.com](https://abcdinamo.com) **S** | la fonderie qui prouve ses fontes en les utilisant |
| [klim.co.nz](https://klim.co.nz) **S** | le spécimen comme récit |
| [andwalsh.com](https://andwalsh.com) **S** | l'identité graphique sans compromis |
| [pentagram.com](https://pentagram.com) **S** | l'index de travail lisible et dense |
| [dixonbaxi.com](https://dixonbaxi.com) **S** | le système de marque en mouvement |
| [koto.studio](https://koto.studio) **S** | la chaleur dans le système |
| [sagmeisterwalsh.com](https://sagmeisterwalsh.com) **A** | l'insolence assumée |
| [semipermanent.com](https://semipermanent.com) **A** | l'événement comme édition |
| [buck.co](https://buck.co) **S** | le portfolio motion-first |
| [media.monks.com](https://media.monks.com) **A** | l'échelle industrielle tenue |
| [anti.as](https://anti.as) **A** | la sobriété nordique |
| [bakkenbaeck.com](https://bakkenbaeck.com) **A** | l'index honnête |
| [momkai.com](https://momkai.com) **A** | l'éditorial numérique |
| [huncwot.com](https://huncwot.com) **A** | la composition savante |
| [weareplaygrounds.nl](https://weareplaygrounds.nl) **A** | l'énergie de festival |
| [peterandsons.com](https://peterandsons.com) **A** | le lettrage comme spectacle |
| [byfutura.com](https://byfutura.com) **A** | l'identité latino-américaine |
| [ls.graphics](https://ls.graphics) | la présentation d'asset |
| [lukacho.com](https://lukacho.com) **A** | le portfolio personnel qui ose |
| [antinomy.studio](https://antinomy.studio) **A** | la retenue extrême |
| [ochi.design](https://ochi.design) **S** | la mise en page qui bouge |
| [studiometa.fr](https://studiometa.fr) **A** | la rigueur française |
| [monopo.london](https://monopo.london) **A** | le pont Japon/Europe |
| [shiftbrain.com](https://shiftbrain.com) **A** | la grille japonaise |
| [gladeye.com](https://gladeye.com) **A** | l'humour dans le système |
| [noomoagency.com](https://noomoagency.com) **S** | la campagne comme expérience |
| [b-reel.com](https://b-reel.com) **A** | l'archive de production |
| [14islands.com](https://14islands.com) **S** | la chaleur technique |
| [ignant.com](https://ignant.com) **A** | le magazine visuel |
| [divisare.com](https://divisare.com) **S** | l'archive photographique pure |
| [leibal.com](https://leibal.com) **A** | le minimalisme éditorial |
| [minimalissimo.com](https://minimalissimo.com) **A** | l'espace comme sujet |
| [quantamagazine.org](https://quantamagazine.org) **S** | la vulgarisation illustrée |
| [semplice.com](https://semplice.com) / [readymag.com](https://readymag.com) / [cargo.site](https://cargo.site) | les outils qui montrent leur propre gamme |

## 7. Couleur & matière — le luxe

Où la lumière, le métal, le tissu et le verre sont rendus crédibles.

| Site | Maître de |
|---|---|
| [patek.com](https://patek.com) **S** | la macro horlogère et la structure de données produit |
| [richardmille.com](https://richardmille.com) **S** | la technicité comme esthétique |
| [mbandf.com](https://mbandf.com) **S** | l'objet comme personnage |
| [urwerk.com](https://urwerk.com) **A** | la science-fiction horlogère |
| [greubelforsey.com](https://greubelforsey.com) **A** | la matière en très gros plan |
| [bovet.com](https://bovet.com) **A** | l'ornement assumé |
| [vacheron-constantin.com](https://vacheron-constantin.com) **A** | le patrimoine mis en scène |
| [hermes.com](https://hermes.com) **S** | la fantaisie dans le luxe |
| [bottegaveneta.com](https://bottegaveneta.com) **S** | le refus radical des codes du secteur |
| [jacquemus.com](https://jacquemus.com) **A** | la lumière et le soleil |
| [casablancaparis.com](https://casablancaparis.com) **S** | l'univers narratif par collection |
| [a-cold-wall.com](https://a-cold-wall.com) **A** | le brutalisme textile |
| [adererror.com](https://adererror.com) **S** | l'étrangeté comme signature |
| [koenigsegg.com](https://koenigsegg.com) **S** | l'ingénierie comme récit |
| [pagani.com](https://pagani.com) **A** | l'artisanat au niveau du détail |
| [bugatti.com](https://bugatti.com) **A** | la démesure maîtrisée |
| [singervehicledesign.com](https://singervehicledesign.com) **S** | la restauration comme obsession |
| [lotuscars.com](https://lotuscars.com) **A** | la légèreté en argument |
| [polestar.com](https://polestar.com) **S** | le minimalisme scandinave appliqué |
| [stilride.com](https://stilride.com) **A** | le procédé industriel comme héros |
| [microlino-car.com](https://microlino-car.com) **A** | le charme comme positionnement |
| [luftgekuhlt.com](https://luftgekuhlt.com) **A** | la culture avant le produit |
| [petrolicious.com](https://petrolicious.com) **A** | le film court éditorial |
| [type7.com](https://type7.com) **A** | l'archive de passionné |
| [teenage.engineering](https://teenage.engineering) **S** | l'objet-produit comme interface |
| [nothing.tech](https://nothing.tech) **S** | la transparence comme identité |
| [bang-olufsen.com](https://bang-olufsen.com) **A** | la matière sonore |
| [dyson.com](https://dyson.com) **A** | l'éclaté technique |
| [apple.com](https://apple.com) **S** | la page produit défilante, référence absolue |
| [apple.com/apple-vision-pro](https://apple.com/apple-vision-pro) **S** | le scroll-récit produit |
| [nike.com/ispa](https://nike.com/ispa) **A** | la sous-marque qui casse la marque |
| [daylightcomputer.com](https://daylightcomputer.com) **A** | le produit expliqué par son problème | 

## 8. Interface & micro-états

La couche que la plupart des sites d'agence ratent, et que les produits maîtrisent.

| Site | Maître de |
|---|---|
| [linear.app](https://linear.app) **S** | la référence de l'interface produit |
| [stripe.com](https://stripe.com) **S** | la page technique qui reste belle |
| [arc.net](https://arc.net) **S** | la personnalité dans le logiciel |
| [raycast.com](https://raycast.com) **S** | la densité sans lourdeur |
| [family.co](https://family.co) **S** | l'animation d'interface mobile |
| [interfaces.rauno.me](https://interfaces.rauno.me) **S** | le catalogue des détails d'interface |
| [emilkowal.ski](https://emilkowal.ski) **S** | l'anatomie d'un composant animé |
| [paco.me](https://paco.me) **A** | le détail d'interaction |
| [maximeheckel.com](https://maximeheckel.com) **A** | le shader expliqué en jouant |
| [mxb.dev](https://mxb.dev) **A** | l'artisanat web sobre |
| [vercel.com](https://vercel.com) **S** | le système de design en production |
| [framer.com](https://framer.com) **A** | l'outil qui se démontre |
| [figma.com](https://figma.com) **A** | la démonstration par le produit |
| [resend.com](https://resend.com) **A** | la doc élégante |
| [supabase.com](https://supabase.com) **A** | la doc dense et lisible |
| [mercury.com](https://mercury.com) **A** | la finance rendue calme |
| [ramp.com](https://ramp.com) **A** | la densité d'information animée |
| [tldraw.com](https://tldraw.com) **S** | le canvas comme produit |
| [oura.com](https://oura.com) **A** | la donnée intime rendue désirable |
| [rive.app](https://rive.app) **S** | l'animation interactive comme outil |
| [spline.design](https://spline.design) **A** | la 3D accessible |
| [unicorn.studio](https://unicorn.studio) **A** | l'effet sans code |

## 9. Données comme spectacle

Pour les pages chiffrées, les preuves, les comparatifs — et le +1 le plus sous-utilisé.

| Site | Maître de | Stack |
|---|---|---|
| [ciechanow.ski](https://ciechanow.ski) **S** | l'explication interactive absolue | canvas ×120 |
| [neal.fun](https://neal.fun) **S** | le jouet qui enseigne | — |
| [neal.fun/deep-sea](https://neal.fun/deep-sea) **S** | l'échelle rendue physique par le scroll | canvas |
| [pudding.cool](https://pudding.cool) **S** | l'essai visuel | — |
| [mathigon.org](https://mathigon.org) **S** | la manipulation directe | — |
| [ncase.me](https://ncase.me) **S** | l'explication jouable | — |
| [distill.pub](https://distill.pub) **S** | la figure interactive rigoureuse | — |
| [informationisbeautiful.net](https://informationisbeautiful.net) **A** | la composition de données | — |
| [ourworldindata.org](https://ourworldindata.org) **S** | la donnée citée par tous, y compris les IA | react |
| [observablehq.com](https://observablehq.com) **A** | le notebook vivant | next.js |
| [accurat.it](https://accurat.it) **S** | la donnée comme objet graphique | — |
| [cleverfranke.com](https://cleverfranke.com) **S** | la donnée comme expérience | canvas, next.js |
| [stamen.com](https://stamen.com) **A** | la cartographie d'auteur | vue |
| [earth.nullschool.net](https://earth.nullschool.net) **S** | la simulation en direct | canvas ×6 |
| [scaleofuniverse.com](https://scaleofuniverse.com) **S** | le zoom infini | — |
| [stars.chromeexperiments.com](https://stars.chromeexperiments.com) **S** | la navigation dans l'immense | three.js |
| [eyes.nasa.gov](https://eyes.nasa.gov) **A** | l'exploration temps réel | react |
| [chronotrains.com](https://chronotrains.com) **A** | l'idée simple parfaitement exécutée | canvas |
| [sandspiel.club](https://sandspiel.club) **A** | la simulation ludique | canvas ×2 |
| [slowroads.io](https://slowroads.io) **A** | la génération procédurale calme | canvas |

## 10. Copy, persuasion & psychologie

| Site | Maître de |
|---|---|
| [growth.design](https://growth.design) **S** | l'étude de cas UX en bande dessinée |
| [designspells.com](https://designspells.com) **S** | le catalogue des détails qui enchantent |
| [linear.app](https://linear.app) **S** | la promesse en une ligne |
| [stripe.com](https://stripe.com) **S** | expliquer du complexe sans jargon |
| [bottegaveneta.com](https://bottegaveneta.com) **S** | dire presque rien et tout signifier |
| [a24films.com](https://a24films.com) **S** | le ton de marque tenu partout |
| [oura.com](https://oura.com) **A** | vendre un bénéfice, pas une spec |

## 11. Métadonnées, SEO & GEO

Jugé plus durement que tout le reste. Ce qu'on va lire dans le DOM capturé et dans le
site vivant : `<title>`, structured data, sitemaps, hreflang, OG, et ce que les robots
d'IA peuvent citer.

| Site | Maître de |
|---|---|
| [ourworldindata.org](https://ourworldindata.org) **S** | se faire citer par les IA — la référence GEO |
| [quantamagazine.org](https://quantamagazine.org) **S** | l'autorité éditoriale structurée |
| [stripe.com](https://stripe.com) **S** | l'architecture de pages et le maillage |
| [apple.com](https://apple.com) **S** | les fiches produit structurées |
| [patek.com](https://patek.com) **S** | le catalogue produit multilingue |
| [divisare.com](https://divisare.com) **A** | l'archive indexable à grande échelle |
| [dezeen.com](https://dezeen.com) · [archdaily.com](https://archdaily.com) **A** | le volume éditorial qui domine la SERP |
| [letterboxd.com](https://letterboxd.com) · [imdb.com](https://imdb.com) **A** | les pages d'entité et leur balisage |

## 12. Outils & moteurs — pour comprendre le mécanisme

Quand une référence fait quelque chose d'incompréhensible, la réponse est presque
toujours ici.

[threejs.org](https://threejs.org) · [threejs-journey.com](https://threejs-journey.com) ·
[gsap.com](https://gsap.com) · [lenis.dev](https://lenis.dev) · [motion.dev](https://motion.dev) ·
[rive.app](https://rive.app) · [spline.design](https://spline.design) ·
[playcanvas.com](https://playcanvas.com) · [babylonjs.com](https://babylonjs.com) ·
[wonderlandengine.com](https://wonderlandengine.com) · [notch.one](https://notch.one) ·
[derivative.ca](https://derivative.ca) · [cables.gl](https://cables.gl) ·
[shadertoy.com](https://shadertoy.com) · [vertexshaderart.com](https://vertexshaderart.com) ·
[p5js.org](https://p5js.org) · [lottiefiles.com](https://lottiefiles.com) ·
[tympanus.net](https://tympanus.net) · [tympanus.net/codrops](https://tympanus.net/codrops)

## 13. Rendu & image de synthèse

Pour l'imagerie produit et architecturale — la couche « matière » quand la photo n'existe pas.

[luxigon.com](https://luxigon.com) · [factoryfifteen.com](https://factoryfifteen.com) ·
[the-boundary.com](https://the-boundary.com) · [brickvisual.com](https://brickvisual.com) (gsap, lenis) ·
[forbesmassie.com](https://forbesmassie.com) · [animade.tv](https://animade.tv)

## 14. Galeries & veille — pour renouveler le pool

La banque est un instantané. **Au moins dix sources hors banque par chantier.**

[awwwards.com](https://awwwards.com) · [thefwa.com](https://thefwa.com) ·
[cssdesignawards.com](https://cssdesignawards.com) · [land-book.com](https://land-book.com) ·
[lapa.ninja](https://lapa.ninja) · [minimal.gallery](https://minimal.gallery) ·
[httpster.net](https://httpster.net) · [onepagelove.com](https://onepagelove.com) ·
[refero.design](https://refero.design) · [mobbin.com](https://mobbin.com) ·
[screensdesign.com](https://screensdesign.com) · [navbar.gallery](https://navbar.gallery) ·
[footer.design](https://footer.design) · [pageflows.com](https://pageflows.com) ·
[bentogrids.com](https://bentogrids.com) · [recent.design](https://recent.design) ·
[savee.com](https://savee.com)

---

## Ce qui n'est PAS dans cet index, et pourquoi

Les ~1120 autres dossiers de la banque restent utiles — mais comme **documentation**, pas
comme direction artistique :

- **Casinos et paris** (7bitcasino, bitstarz, stake, betway, draftkings, roobet…) — machines
  à conversion. À lire pour un tunnel, une urgence, un formulaire. Jamais pour le goût.
- **Grandes marques génériques** (adidas, airtable, akamai, hp, dell, samsung…) — bonnes en
  SEO, en architecture de pages, en accessibilité. Pas à la barre visuellement.
- **Tourisme national** (visitnorway, visiticeland, visitsingapore…) — excellents en
  structure multilingue et hreflang. Couche 11 uniquement.
- **`noble_art_portesien_com` + ses 8 sous-pages** — le concurrent direct du Boxing Center.
  À connaître par cœur, **à ne jamais imiter** : l'objectif est de ne pas lui ressembler.

Un site écarté d'ici n'est pas mauvais. Il n'est simplement pas une source de **fusion**.
