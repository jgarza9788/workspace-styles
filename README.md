# Workspace Styles

A bar widget that shows workspaces `1..N` (configurable 2-10) with four
independently pickable settings: an **indicator** shape for the active
workspace, a switch **animation**, a **glyph set** for what's drawn in each
cell, and an **indicator color**. Mix and match freely (e.g. dice glyphs in
a Glow indicator tinted Muted, animated with Hypr-pop). Click a workspace to
switch to it; right-click the widget for the settings popup.

## Indicators

| Value | Label | Look |
|---|---|---|
| `pill` | Pill | Rounded accent capsule fills the active cell. |
| `roundedSquare` | Rounded Square | Like Pill, but with squared-off corners instead of a full capsule. |
| `underline` | Underline | Minimal accent bar under the active cell. |
| `bold` | Bold | No shape - the active glyph just goes bold and bright. |
| `glow` | Glow | A soft glow fills the active cell behind the glyph - no shape, no border. |

## Animations

Independent of Indicator - any animation combines with any indicator shape.

| Value | Label | Look |
|---|---|---|
| `none` | None | No animation on switch - the indicator just appears. |
| `pop` | Pop | The active glyph scales up briefly on every switch. |
| `hyprPop` | Hypr-pop | A much bigger, springier multi-stage bounce + rotation wobble, plus its own expanding "shockwave" ring - deliberately over the top. |
| `glitch` | Glitch | A bigger digital-glitch burst - rapid position jitter with a color-tint flash and a cyan/magenta chromatic-aberration fringe. |
| `neon` | Neon | The glyph flickers through brightness variations (`Qt.lighter`/`Qt.darker`) of your theme's actual accent color - not a fixed red/orange/yellow palette - with a lick-of-flame scale wobble, settling back on the accent color regardless of the Indicator Color setting. (Originally named "Flame" with fixed fire colors; renamed once it became an accent-color flicker instead - an old saved `"flame"` value still works, mapped to `neon`.) |

## Glyph sets

| Value | Label | Look |
|---|---|---|
| `numbers` | Numbers | Plain workspace numbers (10 shows as `0`, matching the sibling `jgarza.workspaces`/`omarchy.workspaces` widgets and the SUPER+0 Hyprland keybind convention). |
| `roman` | Roman | Nerd Font roman numeral icons, I through X. |
| `kanji` | Japanese | Japanese numerals, 一 through 十. |
| `dice` | Dice | Nerd Font die-face icons for 1-6, boxed-numeral icons for 7-10 (real dice don't have faces above 6 pips, so those borrow Material Design Icons' boxed-numeral family instead - same ink density, verified against the font). |
| `dots` | Dots | A single Octicons dot-fill icon, the same glyph for every workspace - position (plus whichever indicator/animation is active) is what marks the focused one, not the glyph. |
| `nerdIcons` | Custom icons | Your own Nerd Font glyph or emoji per workspace. |

The roman-numeral, dice, and dots glyphs are real icon glyphs baked into the
system's patched Nerd Font (verified against the installed FiraCode Nerd
Font's `cmap`/`post` tables), not hand-drawn or guessed:
`md-roman_numeral_1..10` at `U+F1088..U+F1091`, `md-dice_1..6` at
`U+F01CA..U+F01CF`, `md-numeric_7_box..md-numeric_10_box` at
`U+F03B6`/`F03B9`/`F03BC`/`F0F7D`, `oct-dot_fill` at `U+F444`.

## Indicator colors

| Value | Label | Source |
|---|---|---|
| `accent` | Accent | `accent` key |
| `selection` | Selection | `selection` key |
| `muted` | Muted | `muted` key |

Read directly out of the active theme's
`~/.local/state/omarchy/current/theme/colors.toml` (not through
`qs.Commons.Color`/`Style`, which never parses the theme's `selection` key
at all and would otherwise resolve it to an unrelated generic UI-control
concept). Re-reads live on a theme switch. Falls back to `Color.accent`/
`Color.muted` if the file can't be read or a key is missing.

## Behaviour

- **Scope** — global Hyprland workspaces, same as the stock workspace widget:
  ids `1..count` are always shown, and any live workspace above `count` that's
  occupied or focused still appears (live-overflow).
- **Click** — left-click a workspace to `hl.dsp.focus` it; right-click
  anywhere on the widget for the settings popup.
- **Custom icons** — when this glyph set is active, the settings popup grows
  a text field per workspace slot so you can assign your own glyph or emoji;
  blank slots fall back to the plain number.

## Settings

Right-click the widget for a popup with a slider and four radio lists
(Indicator, Animation, Glyphs, Indicator color), or edit the keys directly
in `~/.config/omarchy/shell.json`.

| Key | Default | Meaning |
|---|---|---|
| `count` | `9` | How many workspace slots to show (2–10). |
| `decoration` | `pill` | One of the indicator values above. |
| `animation` | `none` | One of the animation values above. |
| `glyphSet` | `numbers` | One of the glyph set values above. |
| `indicatorColor` | `accent` | One of the indicator color values above. |
| `customGlyphs` | `""` | Comma-separated glyph/emoji per slot, only used by `nerdIcons`. |

A widget saved under an older version of this plugin keeps looking the way
it did, via fallback chains re-validated against the current option sets:

- Before `decoration`/`glyphSet` were split out of a single combined `style`
  preset: falls back to what that preset used to mean.
- A decoration later dropped (`square`, `circle`, `diamond`, `underglow`)
  falls back to `pill`.
- A glyph set later dropped (`letters`, `braille`) falls back to `numbers`.
- Before `animation` existed as its own setting, `pop` was a decoration
  (the `kinetic` preset). That's recovered as the `animation` fallback
  instead, since decorations no longer include `pop`/`hyprPop` at all.
- The `neon` animation's old id, `flame`, still works too (mapped straight
  to `neon`).

### Editing `shell.json` by hand

```json
"left": [
  {
    "id": "jgarza.workspace-styles",
    "count": 10,
    "decoration": "glow",
    "animation": "hyprPop",
    "glyphSet": "dice",
    "indicatorColor": "selection"
  }
]
```

Restart the shell (`omarchy restart shell`) to pick up the change. Omarchy
persists a widget's settings back into `shell.json` whenever they're changed
from the popup, so a bare `id` may get expanded into the full block after the
first edit.

## Layout

Placed in the bar `left` section by default.

## Development

```
node tests/model.test.js                     # workspace-id math + decoration/animation/glyph-set/color registries
node tests/glyphs.test.js                     # glyph tables + resolvers
omarchy-plugin-validate .                     # manifest check
omarchy restart shell                         # reload widget QML (hot-reload is unreliable for bar widgets)
```

Do **not** run `omarchy refresh shell` while iterating — it resets
`shell.json` to the Omarchy default. If QML edits don't seem to take effect
after a restart, clear the compiled-QML cache: `rm -rf
~/.cache/quickshell/qmlcache/*` then `omarchy restart shell` again.

`Model.js` holds workspace-id math, the decoration/animation/glyph-set/
indicator-color registries, the legacy combined-preset migration table, and
the `colors.toml` line parser. `Glyphs.js` holds the glyph-set lookup tables
and resolvers (Nerd Font roman numerals, kanji, Nerd Font dice +
boxed-numeral icons, the dots icon, custom-glyph fallback). Both are ES5 so
they run in QML and under Node.
