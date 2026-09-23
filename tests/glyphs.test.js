// Run: node tests/glyphs.test.js
const G = require("../Glyphs.js");

let failed = 0;
function ok(name, cond) {
  console.log((cond ? "PASS " : "FAIL ") + name);
  if (!cond) failed++;
}

// clampSlot / numberFor
ok("clampSlot clamps below 1", G.clampSlot(0) === 1);
ok("clampSlot clamps above 10", G.clampSlot(15) === 10);
ok("clampSlot passes through in-range values", G.clampSlot(7) === 7);
for (let n = 1; n <= 9; n++) ok("numberFor(" + n + ") is the plain digit", G.numberFor(n) === String(n));
ok("numberFor(10) is \"0\" (Hyprland SUPER+0 convention, matches jgarza.workspaces)", G.numberFor(10) === "0");

// Nerd Font (Material Design Icons) roman numeral icons: verified (see
// Glyphs.js) as a contiguous codepoint run md-roman_numeral_1..10 starting
// at U+F1088, so the real correctness check is that romanFor(n) lands on
// that exact codepoint - not a hardcoded literal copy of it.
const ROMAN_BASE = 0xf1088;
const EXPECTED_KANJI = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九", 10: "十" };

for (let n = 1; n <= 10; n++) {
  ok("romanFor(" + n + ") is the Nerd Font roman numeral " + n + " icon",
    G.romanFor(n) === String.fromCodePoint(ROMAN_BASE + (n - 1)));
  ok("kanjiFor(" + n + ")", G.kanjiFor(n) === EXPECTED_KANJI[n]);
}

// dicePipsFor: pip count matches n, all coords in {0,1,2} - only defined
// for 1-9 (a 3x3 grid physically can't fit a 10th pip). Not currently wired
// into BarWidget.qml's rendering (DICE_NERD covers 1-10 with real icons),
// but kept as a tested, available alternative.
const EXPECTED_PIP_COUNT = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9 };
for (let n = 1; n <= 9; n++) {
  const pips = G.dicePipsFor(n);
  ok("dicePipsFor(" + n + ") has " + n + " pips", pips.length === EXPECTED_PIP_COUNT[n]);
  ok("dicePipsFor(" + n + ") coords all in {0,1,2}",
    pips.every(function (p) { return p[0] >= 0 && p[0] <= 2 && p[1] >= 0 && p[1] <= 2; }));
}
ok("dicePipsFor(9) covers all 9 grid cells with no duplicates",
  (function () {
    const seen = new Set(G.dicePipsFor(9).map(function (p) { return p[0] + "," + p[1]; }));
    return seen.size === 9;
  })());
ok("dicePipsFor(3) matches the classic diagonal",
  JSON.stringify(G.dicePipsFor(3)) === JSON.stringify([[0, 0], [1, 1], [2, 2]]));
ok("dicePipsFor(1) is the center pip",
  JSON.stringify(G.dicePipsFor(1)) === JSON.stringify([[1, 1]]));
ok("dicePipsFor falls back to the 9-pip layout for slot 10 (no 10-pip entry exists)",
  JSON.stringify(G.dicePipsFor(10)) === JSON.stringify(G.dicePipsFor(9)));
ok("dicePipsFor falls back to the 9-pip layout for a value clamped up to 10",
  JSON.stringify(G.dicePipsFor(99)) === JSON.stringify(G.dicePipsFor(9)));

// diceNerdFor: Nerd Font (Material Design Icons) icons for the Dice glyph
// set. 1-6 are real single-die-face icons, a contiguous run md-dice_1..
// md-dice_6 starting at U+F01CA (checked the same way as romanFor above).
// Real dice stop at 6 pips, so 7-10 borrow the boxed-numeral family instead
// (md-numeric_7_box..md-numeric_10_box) - not a contiguous codepoint run,
// so each is checked against its own verified codepoint.
const DICE_NERD_BASE = 0xf01ca;
for (let n = 1; n <= 6; n++) {
  ok("diceNerdFor(" + n + ") is the Nerd Font die-face " + n + " icon",
    G.diceNerdFor(n) === String.fromCodePoint(DICE_NERD_BASE + (n - 1)));
}
const EXPECTED_DICE_BOX_CODEPOINTS = { 7: 0xf03b6, 8: 0xf03b9, 9: 0xf03bc, 10: 0xf0f7d };
for (let n = 7; n <= 10; n++) {
  ok("diceNerdFor(" + n + ") is the Nerd Font boxed-numeral " + n + " icon",
    G.diceNerdFor(n) === String.fromCodePoint(EXPECTED_DICE_BOX_CODEPOINTS[n]));
}

// nerdGlyphFor
ok("nerdGlyphFor falls back to number for empty list", G.nerdGlyphFor(3, []) === "3");
ok("nerdGlyphFor falls back to number for a list shorter than n", G.nerdGlyphFor(5, ["a", "b"]) === "5");
ok("nerdGlyphFor falls back to number for a whitespace-only slot", G.nerdGlyphFor(2, ["a", "   "]) === "2");
ok("nerdGlyphFor falls back to \"0\" for slot 10, same as numberFor",
  G.nerdGlyphFor(10, []) === "0");
ok("nerdGlyphFor returns a populated slot unchanged", G.nerdGlyphFor(2, ["a", "🐍"]) === "🐍");
ok("nerdGlyphFor trims surrounding whitespace", G.nerdGlyphFor(1, [" 🐍 "]) === "🐍");

// glyphFor dispatch
// "dots" is a single Octicons dot-fill icon (U+F444, verified against the
// font) - the same glyph regardless of workspace number.
const DOTS_GLYPH = String.fromCodePoint(0xf444);
ok("glyphFor dots always returns the dot-fill icon, same for every workspace",
  [1, 5, 9, 10].every(function (n) { return G.glyphFor("dots", n) === DOTS_GLYPH; }));
ok("glyphFor numbers returns the plain number", G.glyphFor("numbers", 4) === "4");
ok("glyphFor numbers returns \"0\" for slot 10", G.glyphFor("numbers", 10) === "0");
ok("glyphFor unknown set falls back to the plain number", G.glyphFor("bogus", 4) === "4");
ok("glyphFor roman dispatches to romanFor", G.glyphFor("roman", 4) === G.romanFor(4));
ok("glyphFor kanji dispatches to kanjiFor", G.glyphFor("kanji", 4) === G.kanjiFor(4));
ok("glyphFor letters/braille are no longer real glyph sets, fall back to the plain number",
  G.glyphFor("letters", 4) === "4" && G.glyphFor("braille", 4) === "4");
ok("glyphFor nerdIcons dispatches to nerdGlyphFor",
  G.glyphFor("nerdIcons", 2, ["x", "y"]) === G.nerdGlyphFor(2, ["x", "y"]));
ok("glyphFor dice dispatches to diceNerdFor for every value 1-10",
  [1, 3, 6, 7, 9, 10].every(function (n) { return G.glyphFor("dice", n) === G.diceNerdFor(n); }));

console.log(failed === 0 ? "\nAll passed." : "\n" + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
