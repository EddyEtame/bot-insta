---
name: bc-design-production
description: Activate for any Boxing Center design task — flyers, posters, social media, billboards, stories, banners, or any visual production. Contains the full production system for any tool (Grok, Canva, Figma, Adobe Express, HTML), format specifications, AI prompting protocols, French text enforcement rules, and the quality standards that define world-class BC design.
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

# BC DESIGN PRODUCTION — Universal Design System
## Works with: Grok · Canva · Figma · Adobe Express · HTML artifacts · Any future tool

---

## SECTION 1 — THE THREE QUALITY TESTS

Every BC design must pass all three before delivery:

**THE BILLBOARD TEST**
Would this stop traffic at 80km/h on a Toulouse highway?
Price/message/emotion readable in 2 seconds at 50 meters?
If no → it fails.

**THE SCROLL TEST**
Would someone stop mid-scroll on Instagram for this?
Does it look like every other gym ad → it fails.
Does it feel like a world-class sports brand campaign → it passes.

**THE PERMISSION TEST** (Axe 2 and Axe 4 specifically)
Would a woman who has never boxed feel this is for her?
Does it look intimidating, exclusive, or aggressive → it fails.
Does it feel like an open door → it passes.

---

## SECTION 2 — TOOL SELECTION GUIDE

| Situation | Best Tool | Why |
|---|---|---|
| Fast typographic poster (Axe 1 style) | Grok | Handles atmospheric/typographic designs well |
| Photo + headline (Axe 2 style) | Grok with uploaded real photo | Strong at cinematic photo treatment |
| Grid with real photos (Axe 4) | HTML artifact or Canva | Grok replaces uploaded photos with AI |
| Network/map design (Axe 3) | Grok | Good at graphic overlay designs |
| Print-ready files (flyer A5, A4, A3) | Canva Free | Proper export, correct DPI |
| Billboard (bâche 2m×1m) | Canva Free or Figma | Vector/high-res needed |
| Rapid design preview for boss approval | HTML artifact | Built directly, no tool needed, perfect control |
| Social media Stories (1080×1920) | Canva Free | Best template library for this format |
| Meta Ads (1200×628) | Canva Free or Grok | Standard format |

---

## SECTION 3 — FORMAT SPECIFICATIONS

### Print Formats
```
Flyer A5:        148 × 210 mm · 300 DPI · CMJN
Affiche A4:      210 × 297 mm · 300 DPI · CMJN
Affiche A3:      297 × 420 mm · 300 DPI · CMJN
Bâche 2m×1m:    2000 × 1000 mm · 150 DPI minimum · CMJN
```

### Digital Formats
```
Instagram carré:    1080 × 1080 px · 72 DPI · RGB
Instagram Story:    1080 × 1920 px · 72 DPI · RGB
Instagram Portrait: 1080 × 1350 px · 72 DPI · RGB
Facebook lien:      1200 × 628 px  · 72 DPI · RGB
Meta Ad carré:      1080 × 1080 px · 72 DPI · RGB
TikTok/Reels:       1080 × 1920 px · 72 DPI · RGB
```

### Design Hierarchy Rule
Always design at the **most constraining format first** (usually 1080×1080 or A5), then adapt. Never design for billboard first — text that reads at billboard scale is unreadable on mobile.

---

## SECTION 4 — CANVA FREE PRODUCTION SYSTEM

### The "No Brand Kit" Workaround (3 techniques)

**Technique 1 — Recent Colors:**
Type a hex code once in any design → it appears in "Couleurs récentes" for the entire project. Type all 6 brand colors in your first design and they're accessible forever in that project.

**Technique 2 — Duplicate Page:**
Build one complete design → "Dupliquer la page" → modify content without re-entering any styles. Use this to produce all 3 formats from one master.

**Technique 3 — Copy Style:**
Right-click any element → "Copier le style" → right-click target element → "Coller le style." Transfers all formatting instantly. This replaces Brand Kit.

### Canva Free — What to NEVER Do
- Never use Magic Design / Canva AI — produces generic output
- Never use Magic Resize (Pro feature, breaks free workflow)
- Never use Background Remover (Pro feature)
- Never use Premium elements (watermarked in export)

### Canva Free Font Setup
Search these exactly in the Canva font menu:
```
Headlines/Impact:  "Bebas Neue" — always available, free
Subtitles:        "Montserrat SemiBold"
Body text:        "Montserrat Regular"  
Labels/Small:     "Montserrat Light Italic"
```

### Canva Photo Upload
Onglet "Importer des médias" → drag & drop → photos appear in "Vos médias."
**Photos are NEVER modified when uploaded.** Safe, private, original quality preserved.

---

## SECTION 5 — GROK PROMPTING PROTOCOL

### Grok's 3 Systematic Failures

| Failure | What Happens | Fix |
|---|---|---|
| Text hallucination | Invents words, adds phrases, changes spellings | Provide EVERY word explicitly. End with: "Delete any text not in this exact list." |
| Error repetition | Repeats previous mistakes in next generation | Quote exact error + correction in every new prompt |
| Photo replacement | Generates AI images instead of using uploaded photos | Upload photo first, describe it visually, write: "DO NOT generate new images. Use ONLY the uploaded photo." |

### Grok Prompt Architecture (use this order EVERY time)
```
1. ABSOLUTE RULES (what not to do — written FIRST)
2. UPLOADED PHOTO DESCRIPTION (if applicable)
3. KEEP EXACTLY (preserve from previous version)
4. CINEMATIC TREATMENT (color/light instructions)
5. EXACT TEXT LIST (every word, every line)
6. LAYOUT SPECIFICATIONS (sizes, positions)
7. THE FEELING (emotional brief — last, most important)
```

### Correction Prompt Template
```
Take the previous poster EXACTLY as it is.
Keep 100% of the design.

Make ONLY these corrections:

CORRECTION 1: Change "[exact wrong text]" to "[exact correct text]"
CORRECTION 2: [specific change with exact values]

DO NOT change anything else — no colors, no layout, no typography.
```

---

## SECTION 6 — FRENCH TEXT ENFORCEMENT

Copy-paste this block into every Grok prompt:

```
CRITICAL TEXT RULES — READ BEFORE GENERATING:

All text on this poster is in FRENCH. Zero English words.

EXACT SPELLINGS (copy character by character):
"salles"        = S-A-L-L-E-S    (not "salas", not "sales")
"Confiance"     = C-O-N-F-I-A-N-C-E  (not "Comfiance")
"Crosstraining" = one word, no hyphen  (not "Cross Training")
"BALMA"         = B-A-L-M-A      (not "BALMAS")

FORBIDDEN English words: "The Decision", "Lady" standalone,
any English phrase anywhere.

MANDATORY on ALL designs (bottom right, dark gray, 9pt):
"Planning aménagé fin juillet–mi-août"

The 6 BC locations (exact spelling, always):
BALMA · SAINT-CYPRIEN · ÉTATS-UNIS · MINIMES · RAMONVILLE · PORTET

LOGO: never typed as text. Always the official file
(BC_Logo_Officiel_Transparent.png on dark / _FondBlanc.png on light).
Logo navy = #20254B, bronze contour = #6D3111.
```

---

## SECTION 7 — AXIS-SPECIFIC DESIGN RULES

### Axe 1 — Prix Choc
- **RED belongs to ONE element only: 89€.** Everything else white or gray.
- 150€ = white 30% opacity + blade slash (not a line — a CUT, tapering at ends)
- CTA button "Je prends l'offre" = digital only. Remove for print/billboard.
- The 89€ must feel like it exists in physical space: outer red glow, drop shadow, crack texture.

### Axe 2 — Décision d'Été
- **"TOUT LE MONDE PEUT BOXER."** — this headline is FINAL. Do not change, rephrase, or suggest alternatives.
- Sub: "Cet été, c'est ton tour." — exact.
- Golden-white aura on headline text (not pure white, golden-white glow).
- FORBIDDEN in copy: "compétition", "combat", "fighter", "champion".
- USE: "cours", "énergie", "découvrir", "essayer", "tous niveaux".
- Hero photo: BC-013 (women sparring in ring, group of 4).

### Axe 3 — Pass Toulouse
- "6 SALLES. / 1 PASS. / TOUT TOULOUSE." — three separate lines, each a statement.
- 6 glowing red dots + network connecting lines = the city belongs to BC.
- Cold blue color grade (not warm — this axis is urban and territorial, not human and warm).
- Hero photo: BC-003 (empty ring, "BOXING CENTER" on wall).

### Axe 4 — Découverte des Disciplines
- **Headline: "ENTRE. ESSAIE. REVIENS."** — not "Viens tout tester." That's too commercial.
- The boss's three sentences in Panel 6 (EXACT): "Viens tester. / Prends tes repères. / Reviens à la rentrée."
- These are NOT copy. They are the emotional promise. Never paraphrase.
- If using grid: 2×3, portrait only (never landscape/banner).
- Photo assignment: BC-001(P1) · BC-013(P2) · BC-017(P3) · BC-018(P4) · BC-012(P5) · Red graphic(P6).
- If Grok can't handle grid with real photos → use single-hero with BC-013 + "ENTRE. ESSAIE. REVIENS."

---

## SECTION 8 — INFORMATION BAR (all formats)

```
Background: #000000 (pure black)
Left accent: 6px vertical red bar (#E8001C)

Line 1 — Bold white condensed [Bebas Neue 20pt]:
"3 MOIS ILLIMITÉS · 6 SALLES · TOUS NIVEAUX"

Line 2 — Gray [Montserrat Regular 13pt, #BBBBBB]:
"Boxe · Thaï · MMA · Grappling · Fitness · Hyrox · Crosstraining"

Bottom strip (same line):
LEFT  — White italic 11pt: "Offre valable jusqu'au 26 juin"
RIGHT — Dark gray 9pt, #666666: "Planning aménagé fin juillet–mi-août"
```

---

## SECTION 9 — PRICE BADGE SPECIFICATION

For all axes requiring a price badge (Axe 2, Axe 4):

```
Shape:      Parallelogram, tilted 8° — NO decorative borders
Background: Deep red #C8001A with subtle gradient (darker top)
Edge:       2px bright red #E8001C only — clean, like a credit card
Shadow:     Black, 8px down, 25px blur — floats above poster

Internal hierarchy:
[1] "89€"              — white ultra-bold, 96pt (DOMINANT)
[2] "AU LIEU DE 150 €" — white strikethrough, 70% opacity, 24pt
[3] "3 MOIS ILLIMITÉS · 6 SALLES" — white bold, 20pt
```

---

## SECTION 10 — WHEN GROK FAILS, ESCALATE HERE

**After 3 failed attempts on same output → stop and escalate:**

| Problem | Escalation |
|---|---|
| Photo always gets replaced | Switch to Canva or build as HTML artifact |
| Text errors keep repeating | Rebuild from scratch with all text pre-written |
| Correct content but wrong emotion | Add "THE FEELING" section + reference campaign from Nike/UFC/Adidas |
| Good poster but basic quality | Add cinematic treatments: grain, glow, split-tone, selective color |
| Wrong format orientation | State format dimensions as first line: "Portrait orientation. Ratio 3:4. Width 750px." |

---
*BC Design Production Skill v2.0 — Boxing Center Toulouse — June 2026*
