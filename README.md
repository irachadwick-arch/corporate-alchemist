# Tabby Alchemist

A Little-Alchemy-style crafting game about office life, with Tabby's real products mixed in.

Start with **☕ Coffee**, **🧑‍💼 Employee**, **🛍️ Shopper** and **🏪 Merchant**, combine two elements
at a time, and work your way to 🏆 **Product of the Year**.

```
Employee + Coffee   → Code
Code     + Deadline → Bug
Bug      + Deadline → Hotfix
Deadline + Hotfix   → Burnout
Burnout  + Employee → Vacation
```

**54 elements · 50 recipes · 9 tiers deep · 10 real Tabby products.**

No dependencies, no build step, no framework.

## Play it

Open `index.html` in a browser. That's it — the scripts are classic (non-module) precisely so
double-clicking the file works.

To serve it instead:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

```bash
docker build -t tabby-alchemist .
docker run -p 8080:80 tabby-alchemist
```

`nginx.conf` sends `no-cache` for `index.html` and a one-hour cache for the CSS/JS. That split
matters: `index.html` is the only file that names the others, so serving it stale can pair new
markup with cached scripts.

## Layout

| File | What's in it |
|---|---|
| `index.html` | Markup only |
| `styles.css` | All styling |
| `data.js` | **Content** — elements, recipes, flavor text |
| `game.js` | Engine — state, persistence, rendering, hints, share card |
| `Dockerfile`, `nginx.conf` | Static hosting |

Content and engine are deliberately separate: you can add jokes and recipes without reading a
line of game code. `data.js` must load before `game.js`.

## Adding content

Everything lives in `data.js`. Add an element:

```js
allHands:{n:"All-Hands", e:"📢", f:"Nine hundred people, one unmuted microphone."},
```

| Field | Meaning |
|---|---|
| `n` | Display name |
| `e` | Emoji |
| `f` | Flavor line — shown on discovery and as a grid tooltip |
| `base` | Available from the start |
| `tabby` | A real Tabby product (green border in the grid) |
| `final` | Triggers the win screen |

Then a recipe. Input order doesn't matter — `["office","meeting","allHands"]` and
`["meeting","office","allHands"]` are the same thing:

```js
["office","meeting","allHands"],
```

### House rules

- **Flavor tone splits by element type.** Office elements are dry and self-deprecating
  ("Merge Conflict — *Two people were right*"). Real Tabby products stay warm and straight
  ("Instant Approval — *Seconds to decide, so checkout never stalls*"). The joke is never at a
  shipped product's expense.
- **No `&`, `<` or `>` in flavor text.** It renders through both `innerHTML` (result card) and
  the `.title` property (tooltip). An escaped entity renders correctly in one and literally in
  the other, so avoid the character entirely.

### Invariants to preserve

Worth re-checking after editing `data.js`:

- Every element is reachable from the four bases.
- No two recipes share an input pair (they'd silently shadow each other).
- Every id referenced in a recipe exists in `ELEMENTS`.
- Self-combos still work — `Employee+Employee` and `Code+Code` are both real recipes.

Old saves survive content changes: unknown element ids and stale recipe keys are dropped on
load, and the four bases are always restored, so editing `data.js` can't corrupt a player's
progress.

## Features

- **Progress persists** in `localStorage` under `tabbyAlchemist.v1`. Storage failures (Safari
  private mode, some `file://` contexts) degrade to an in-memory game rather than breaking.
- **Recipe book** as a second tab. Undiscovered recipes show as identical `??? + ??? → 🔒`
  rows, so you can see how much is left without spoiling which branch it's in.
- **Hints** reveal both ingredients but never the result — the payoff is the result. 30s
  cooldown, and the count follows you to the end card.
- **Share card** on winning: a 1200×630 PNG with your element count, hints used and elapsed
  time. Download always works; "Copy image" additionally appears in a secure context
  (https or localhost), since clipboard image writes require one.

