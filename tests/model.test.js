// Run: node tests/model.test.js
const M = require("../Model.js");

let failed = 0;
function ok(name, cond) {
  console.log((cond ? "PASS " : "FAIL ") + name);
  if (!cond) failed++;
}

// workspaceIds
ok("workspaceIds count=2 -> [1,2]", M.workspaceIds(2, []).join(",") === "1,2");
ok("workspaceIds count=9 -> [1..9]", M.workspaceIds(9, []).join(",") === "1,2,3,4,5,6,7,8,9");
ok("workspaceIds count=10 -> [1..10]", M.workspaceIds(10, []).join(",") === "1,2,3,4,5,6,7,8,9,10");
ok("workspaceIds clamps below 2", M.workspaceIds(0, []).join(",") === "1,2");
ok("workspaceIds clamps below 2 (negative)", M.workspaceIds(-5, []).join(",") === "1,2");
ok("workspaceIds clamps above 10", M.workspaceIds(20, []).join(",") === "1,2,3,4,5,6,7,8,9,10");
ok("workspaceIds defaults to 9 when count is not a number",
  M.workspaceIds(undefined, []).join(",") === "1,2,3,4,5,6,7,8,9");

ok("workspaceIds live-overflow adds ids beyond count",
  M.workspaceIds(3, [7]).join(",") === "1,2,3,7");
ok("workspaceIds excludes live id 0", M.workspaceIds(3, [0]).join(",") === "1,2,3");
ok("workspaceIds excludes live id > 10", M.workspaceIds(3, [11]).join(",") === "1,2,3");
ok("workspaceIds does not duplicate an already-listed live id",
  M.workspaceIds(3, [1, 2]).join(",") === "1,2,3");
ok("workspaceIds sorts multiple overflow ids",
  M.workspaceIds(2, [9, 5]).join(",") === "1,2,5,9");

// DECORATION_ORDER / DECORATIONS
ok("DECORATION_ORDER has 5 entries", M.DECORATION_ORDER.length === 5);
ok("every DECORATION_ORDER id resolves to a decoration with label+description",
  M.DECORATION_ORDER.every(function (id) {
    var d = M.DECORATIONS[id];
    return !!d && typeof d.label === "string" && d.label !== ""
      && typeof d.description === "string" && d.description !== "";
  }));
ok("DECORATION_ORDER has no duplicate ids",
  M.DECORATION_ORDER.length === Array.from(new Set(M.DECORATION_ORDER)).length);
ok("DEFAULT_DECORATION is a real decoration", M.isDecoration(M.DEFAULT_DECORATION));
ok("DEFAULT_DECORATION is pill", M.DEFAULT_DECORATION === "pill");
ok("pop/hyprPop are no longer decorations - they moved to ANIMATIONS",
  M.isDecoration("pop") === false && M.isDecoration("hyprPop") === false);

// ANIMATION_ORDER / ANIMATIONS
ok("ANIMATION_ORDER has 8 entries", M.ANIMATION_ORDER.length === 8);
ok("isAnimation true for ripple", M.isAnimation("ripple"));
ok("isAnimation true for decode and emberBurst", M.isAnimation("decode") && M.isAnimation("emberBurst"));
ok("every ANIMATION_ORDER id resolves to an animation with label+description",
  M.ANIMATION_ORDER.every(function (id) {
    var a = M.ANIMATIONS[id];
    return !!a && typeof a.label === "string" && a.label !== ""
      && typeof a.description === "string" && a.description !== "";
  }));
ok("ANIMATION_ORDER has no duplicate ids",
  M.ANIMATION_ORDER.length === Array.from(new Set(M.ANIMATION_ORDER)).length);
ok("DEFAULT_ANIMATION is a real animation", M.isAnimation(M.DEFAULT_ANIMATION));
ok("DEFAULT_ANIMATION is none", M.DEFAULT_ANIMATION === "none");
ok("isAnimation true for pop and hyprPop", M.isAnimation("pop") && M.isAnimation("hyprPop"));
ok("isAnimation true for glitch and neon", M.isAnimation("glitch") && M.isAnimation("neon"));
ok("isAnimation false for a decoration id", M.isAnimation("pill") === false);
ok("resolveAnimation passes through a known id", M.resolveAnimation("hyprPop") === "hyprPop");
ok("resolveAnimation passes through glitch and neon",
  M.resolveAnimation("glitch") === "glitch" && M.resolveAnimation("neon") === "neon");
ok("resolveAnimation falls back to default for an unknown id",
  M.resolveAnimation("bogus") === M.DEFAULT_ANIMATION);

// GLYPH_SET_ORDER / GLYPH_SETS
ok("GLYPH_SET_ORDER has 6 entries", M.GLYPH_SET_ORDER.length === 6);
ok("letters/braille are no longer glyph sets", M.isGlyphSet("letters") === false && M.isGlyphSet("braille") === false);
ok("every GLYPH_SET_ORDER id resolves to a glyph set with label+description",
  M.GLYPH_SET_ORDER.every(function (id) {
    var g = M.GLYPH_SETS[id];
    return !!g && typeof g.label === "string" && g.label !== ""
      && typeof g.description === "string" && g.description !== "";
  }));
ok("GLYPH_SET_ORDER has no duplicate ids",
  M.GLYPH_SET_ORDER.length === Array.from(new Set(M.GLYPH_SET_ORDER)).length);
ok("DEFAULT_GLYPH_SET is a real glyph set", M.isGlyphSet(M.DEFAULT_GLYPH_SET));
ok("DEFAULT_GLYPH_SET is numbers", M.DEFAULT_GLYPH_SET === "numbers");

// isDecoration / isGlyphSet
ok("isDecoration true for a known id", M.isDecoration("glow") === true);
ok("isDecoration false for an unknown id", M.isDecoration("bogus") === false);
ok("isDecoration false for a glyphSet id", M.isDecoration("roman") === false);
ok("isDecoration false for a decoration removed from the current set",
  M.isDecoration("circle") === false && M.isDecoration("square") === false
    && M.isDecoration("diamond") === false && M.isDecoration("underglow") === false);
ok("isGlyphSet true for a known id", M.isGlyphSet("dice") === true);
ok("isGlyphSet false for an unknown id", M.isGlyphSet("bogus") === false);
ok("isGlyphSet false for a decoration id", M.isGlyphSet("pill") === false);

// resolveDecoration / resolveGlyphSet
ok("resolveDecoration passes through a known id", M.resolveDecoration("glow") === "glow");
ok("resolveDecoration falls back to default for an unknown id",
  M.resolveDecoration("bogus") === M.DEFAULT_DECORATION);
ok("resolveDecoration falls back to default for undefined",
  M.resolveDecoration(undefined) === M.DEFAULT_DECORATION);
ok("resolveGlyphSet passes through a known id", M.resolveGlyphSet("dice") === "dice");
ok("resolveGlyphSet falls back to default for an unknown id",
  M.resolveGlyphSet("bogus") === M.DEFAULT_GLYPH_SET);
ok("resolveGlyphSet falls back to default for undefined",
  M.resolveGlyphSet(undefined) === M.DEFAULT_GLYPH_SET);

// INDICATOR_COLOR_ORDER / INDICATOR_COLORS
ok("INDICATOR_COLOR_ORDER has 3 entries", M.INDICATOR_COLOR_ORDER.length === 3);
ok("every INDICATOR_COLOR_ORDER id resolves to a color role with label+description",
  M.INDICATOR_COLOR_ORDER.every(function (id) {
    var c = M.INDICATOR_COLORS[id];
    return !!c && typeof c.label === "string" && c.label !== ""
      && typeof c.description === "string" && c.description !== "";
  }));
ok("DEFAULT_INDICATOR_COLOR is a real color role", M.isIndicatorColor(M.DEFAULT_INDICATOR_COLOR));
ok("DEFAULT_INDICATOR_COLOR is accent", M.DEFAULT_INDICATOR_COLOR === "accent");
ok("isIndicatorColor true for a known id", M.isIndicatorColor("selection") === true);
ok("isIndicatorColor false for an unknown id", M.isIndicatorColor("bogus") === false);
ok("resolveIndicatorColor passes through a known id", M.resolveIndicatorColor("muted") === "muted");
ok("resolveIndicatorColor falls back to default for an unknown id",
  M.resolveIndicatorColor("bogus") === M.DEFAULT_INDICATOR_COLOR);

// parseCustomGlyphs / customGlyphsToString round-trip
ok("parseCustomGlyphs empty string -> single empty slot",
  M.parseCustomGlyphs("").length === 1 && M.parseCustomGlyphs("")[0] === "");
ok("parseCustomGlyphs splits on comma",
  M.parseCustomGlyphs("🦊,,🐝").join("|") === "🦊||🐝");
ok("parseCustomGlyphs handles undefined", M.parseCustomGlyphs(undefined).join(",") === "");
ok("customGlyphsToString joins with comma",
  M.customGlyphsToString(["a", "", "b"]) === "a,,b");
ok("customGlyphsToString handles empty list", M.customGlyphsToString([]) === "");
ok("customGlyphsToString handles undefined", M.customGlyphsToString(undefined) === "");

const roundTrip = "🦊,,🐝";
ok("custom glyphs round-trip through parse/stringify",
  M.customGlyphsToString(M.parseCustomGlyphs(roundTrip)) === roundTrip);

// parseThemeColors - matches the real colors.toml shape (this repo's own
// current theme file, checked verbatim as a fixture).
const THEME_TOML = [
  'mode = "dark"',
  '',
  'accent = "#84b64d"',
  'selection = "#283f5b"',
  'muted = "#546071"',
  '',
  'background = "#000f24"',
  'foreground = "#cae0b6"',
  '',
  'red = "#84b450"'
].join("\n");
ok("parseThemeColors extracts the requested keys",
  (function () {
    var c = M.parseThemeColors(THEME_TOML, ["accent", "selection", "muted"]);
    return c.accent === "#84b64d" && c.selection === "#283f5b" && c.muted === "#546071";
  })());
ok("parseThemeColors omits keys not present in the input",
  M.parseThemeColors(THEME_TOML, ["accent", "bogusKey"]).bogusKey === undefined);
ok("parseThemeColors omits keys not asked for even if present",
  M.parseThemeColors(THEME_TOML, ["accent"]).selection === undefined);
ok("parseThemeColors keeps the first match when a key repeats",
  M.parseThemeColors("accent = \"#111111\"\naccent = \"#222222\"", ["accent"]).accent === "#111111");
ok("parseThemeColors handles empty input", Object.keys(M.parseThemeColors("", ["accent"])).length === 0);
ok("parseThemeColors handles undefined input", Object.keys(M.parseThemeColors(undefined, ["accent"])).length === 0);
ok("parseThemeColors ignores malformed color lines",
  M.parseThemeColors('accent = "not-a-color"\naccent = "#333333"', ["accent"]).accent === "#333333");

// DECODE_TICKS_MS: slot-machine deceleration
ok("DECODE_TICKS_MS is non-empty", M.DECODE_TICKS_MS.length > 0);
ok("DECODE_TICKS_MS never speeds up",
  M.DECODE_TICKS_MS.every(function (t, i, a) { return i === 0 || t >= a[i - 1]; }));

// THEME_COLOR_KEYS covers everything the animations draw from
ok("THEME_COLOR_KEYS includes accent/selection/muted and every palette key",
  ["accent", "selection", "muted"].concat(M.EMBER_PALETTE_KEYS, M.DECODE_PALETTE_KEYS)
    .every(function (k) { return M.THEME_COLOR_KEYS.indexOf(k) !== -1; }));
ok("THEME_COLOR_KEYS has no duplicates",
  M.THEME_COLOR_KEYS.length === Array.from(new Set(M.THEME_COLOR_KEYS)).length);

// themePalette
ok("themePalette returns found keys in key order",
  M.themePalette({ red: "#ff0000", accent: "#00ff00" }, ["accent", "orange", "red"], "#fff").join(",") === "#00ff00,#ff0000");
ok("themePalette de-duplicates repeated hex values case-insensitively",
  M.themePalette({ a: "#ABCDEF", b: "#abcdef", c: "#123456" }, ["a", "b", "c"], "#fff").join(",") === "#ABCDEF,#123456");
ok("themePalette falls back when nothing is found",
  M.themePalette({}, ["orange"], "#fff").join(",") === "#fff");
ok("themePalette tolerates undefined themeColors",
  M.themePalette(undefined, ["orange"], "#fff").join(",") === "#fff");

// emberVectors (seeded rand for determinism)
function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
(function () {
  const R = 20;
  const v = M.emberVectors(12, R, seeded(42));
  ok("emberVectors returns count vectors", v.length === 12);
  ok("emberVectors delays are within 0..60ms", v.every(function (e) { return e.delay >= 0 && e.delay <= 60; }));
  ok("emberVectors sizes are within 2..4px", v.every(function (e) { return e.size >= 2 && e.size <= 4; }));
  ok("emberVectors always rise (embers float up)", v.every(function (e) { return e.rise > 0; }));
  ok("emberVectors are biased upward on average",
    v.reduce(function (s, e) { return s + e.dy; }, 0) / v.length < 0);
  ok("emberVectors distances stay within 1.3x radius",
    v.every(function (e) { return Math.hypot(e.dx, e.dy + R * 0.25) <= R * 1.3 + 1e-9; }));
  ok("emberVectors spread around the circle (both left and right)",
    v.some(function (e) { return e.dx < 0; }) && v.some(function (e) { return e.dx > 0; }));
  ok("emberVectors colorIndex is 0..count-1", v.every(function (e, i) { return e.colorIndex === i; }));
  ok("emberVectors defaults to Math.random", M.emberVectors(3, R).length === 3);
})();

// rippleRadius: ink always reaches the farthest corner
ok("rippleRadius from the center is half the diagonal", Math.abs(M.rippleRadius(30, 40, 15, 20) - 25) < 1e-9);
ok("rippleRadius from a corner is the full diagonal", Math.abs(M.rippleRadius(30, 40, 0, 0) - 50) < 1e-9);
ok("rippleRadius from an off-center point reaches the far corner",
  Math.abs(M.rippleRadius(30, 40, 27, 4) - Math.hypot(27, 36)) < 1e-9);

// readableOn: the active-tab text-contrast fix
function hex(h, a) {
  return { r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255,
           b: parseInt(h.slice(5, 7), 16) / 255, a: a === undefined ? 1 : a };
}
ok("contrastRatio of black on white is 21", Math.abs(M.contrastRatio(hex("#000000"), hex("#ffffff")) - 21) < 1e-9);
ok("readableOn picks light foreground on a solid dark selected fill (the reported theme)",
  M.readableOn(hex("#2d470e"), hex("#0f0f0f"), hex("#d7d7d7"), hex("#0f0f0f")) === "primary");
ok("readableOn picks the dark alt on a solid light fill",
  M.readableOn(hex("#f0f0f0"), hex("#0f0f0f"), hex("#d7d7d7"), hex("#0f0f0f")) === "alt");
ok("readableOn composites a translucent fill over the surface behind it",
  M.readableOn(hex("#ffffff", 0.05), hex("#000000"), hex("#ffffff"), hex("#000000")) === "primary");
ok("readableOn treats a missing alpha as opaque",
  M.readableOn({ r: 1, g: 1, b: 1 }, hex("#000000"), hex("#ffffff"), hex("#000000")) === "alt");

console.log(failed === 0 ? "\nAll passed." : "\n" + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
