// Glyph-set lookup tables and resolvers for Workspace Styles, workspaces
// 1..10. Imported from BarWidget.qml as `import "Glyphs.js" as Glyphs`, and
// ES5-only so the same file runs under `node tests/glyphs.test.js`.

// Nerd Font (Material Design Icons subset) roman numeral glyphs, one icon
// per number, verified against the installed FiraCode Nerd Font's cmap/post
// tables (glyph names md-roman_numeral_1..md-roman_numeral_10, a contiguous
// codepoint run starting at U+F1088).
var ROMAN = { 1: "󱂈", 2: "󱂉", 3: "󱂊", 4: "󱂋", 5: "󱂌", 6: "󱂍", 7: "󱂎", 8: "󱂏", 9: "󱂐", 10: "󱂑" }

var KANJI = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九", 10: "十" }

// Nerd Font glyphs for the Dice glyph set, one icon per number, 1-10. Real
// dice only have faces up to 6 pips (md-dice_1..md-dice_6, verified the same
// way as ROMAN above, U+F01CA..U+F01CF); there's no such thing as a 7-10
// pip die face, so those borrow Material Design Icons' boxed-numeral family
// instead (md-numeric_7_box..md-numeric_10_box, U+F03B6/F03B9/F03BC/F0F7D -
// not a contiguous run, so each is listed explicitly) - same 61.5%-of-em ink
// density as the dice glyphs, confirmed against the font's `glyf` bounding
// boxes, so no per-value font-size adjustment is needed.
var DICE_NERD = {
  1: "󰇊", 2: "󰇋", 3: "󰇌", 4: "󰇍", 5: "󰇎", 6: "󰇏",
  7: "󰎶", 8: "󰎹", 9: "󰎼", 10: "󰽽"
}

// 3x3 pip-position grid, [row, col] pairs with row/col in {0,1,2}: 7 =
// six-pattern + center, 8 = ring of 8 minus center, 9 = full 3x3 grid (a
// 3x3 grid can't fit a 10th pip). DICE_NERD now covers every value 1-10
// with a real icon, so BarWidget.qml no longer draws these - kept as a
// tested, available alternative rendering (e.g. for a future "hand-drawn
// dice" glyph set, or if a glyph ever fails to resolve).
var DICE_PIPS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  7: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 2]],
  8: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]],
  9: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]
}

function clampSlot(n) { return Math.max(1, Math.min(10, Math.round(Number(n) || 1))) }

// Plain workspace number. Slot 10 renders as "0", matching the sibling
// jgarza.workspaces/omarchy.workspaces widgets and the common Hyprland
// keybind convention (SUPER+0 -> workspace 10), so the bar reads the same
// way no matter which workspace widget is showing it.
function numberFor(n) { var s = clampSlot(n); return s === 10 ? "0" : String(s) }

function romanFor(n) { return ROMAN[clampSlot(n)] || String(n) }
function kanjiFor(n) { return KANJI[clampSlot(n)] || String(n) }
// DICE_PIPS has no entry for 10 (clampSlot's upper bound, since a 3x3 grid
// can't fit a 10th pip) - falls back to the fullest layout (9) rather than
// the sparsest (1) for any out-of-range slot.
function dicePipsFor(n) { return DICE_PIPS[clampSlot(n)] || DICE_PIPS[9] }
// The Nerd Font icon for the Dice glyph set, 1-10 (real die faces for 1-6,
// boxed numerals for 7-10 - see DICE_NERD above).
function diceNerdFor(n) { return DICE_NERD[clampSlot(n)] || "" }

// customGlyphsList is the parsed (split on ",") customGlyphs setting;
// index i-1 for workspace id `n`. Blank/whitespace/missing slot falls back
// to the plain workspace number so a cell is never empty.
function nerdGlyphFor(n, customGlyphsList) {
  var list = customGlyphsList || []
  var idx = clampSlot(n) - 1
  var v = list.length > idx ? String(list[idx] || "").trim() : ""
  return v !== "" ? v : numberFor(n)
}

// Text drawn in the cell for a given glyphSet + workspace id. "dots" is a
// single Octicons dot-fill icon (U+F444, verified against the font) - the
// same glyph for every workspace, not number-specific - so the position
// itself (plus whichever decoration is active) is what distinguishes cells,
// not the glyph.
function glyphFor(glyphSet, n, customGlyphsList) {
  switch (glyphSet) {
    case "roman": return romanFor(n)
    case "kanji": return kanjiFor(n)
    case "nerdIcons": return nerdGlyphFor(n, customGlyphsList)
    case "dice": return diceNerdFor(n)
    case "dots": return ""
    case "numbers":
    default: return numberFor(n)
  }
}

// Fallback scramble alphabet for the Decode animation when a glyph set is
// too uniform to scramble through on its own (dots is one glyph for every
// workspace; a custom set may be mostly blank). Quadrant/shade blocks plus
// digits - reads as "cipher" in any font, no Nerd Font needed.
var DECODE_FALLBACK = [
  "▖", "▗", "▘", "▝", "▚", "▞", "▙", "▟", "█", "░", "▒", "▓",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
]

// The glyphs the Decode animation scrambles through before landing on the
// real one: the active set's own 10 glyphs (so a roman scramble flickers
// through roman numerals, dice through die faces...), de-duplicated, or
// DECODE_FALLBACK if that leaves fewer than 3 distinct glyphs.
function decodePool(glyphSet, customGlyphsList) {
  var pool = []
  for (var n = 1; n <= 10; n++) {
    var g = glyphFor(glyphSet, n, customGlyphsList)
    if (g && pool.indexOf(g) === -1) pool.push(g)
  }
  return pool.length >= 3 ? pool : DECODE_FALLBACK.slice()
}

if (typeof module !== "undefined") {
  module.exports = {
    ROMAN: ROMAN, KANJI: KANJI,
    DICE_NERD: DICE_NERD, DICE_PIPS: DICE_PIPS,
    DECODE_FALLBACK: DECODE_FALLBACK,
    clampSlot: clampSlot, numberFor: numberFor,
    romanFor: romanFor, kanjiFor: kanjiFor,
    dicePipsFor: dicePipsFor, diceNerdFor: diceNerdFor,
    nerdGlyphFor: nerdGlyphFor, glyphFor: glyphFor,
    decodePool: decodePool
  }
}
