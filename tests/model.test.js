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
ok("ANIMATION_ORDER has 5 entries", M.ANIMATION_ORDER.length === 5);
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
ok("isAnimation false for the old \"flame\" id (renamed to neon)", M.isAnimation("flame") === false);
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

// legacyPreset - migration lookup for the pre-split combined "style" setting
ok("legacyPreset resolves a known old preset id to a decoration+glyphSet pair",
  (function () {
    var p = M.legacyPreset("boneyardDice");
    return !!p && p.decoration === "circle" && p.glyphSet === "dice";
  })());
ok("legacyPreset returns null for an unknown id", M.legacyPreset("bogus") === null);
// Several legacy presets point at decorations that were later dropped from
// DECORATIONS (square/circle/diamond/underglow, and pop once it became an
// animation) - that's expected, and is exactly what resolveDecorationSetting's
// fallback chain below covers.
ok("some legacy presets still point at a currently-valid decoration",
  M.isDecoration(M.LEGACY_PRESETS.classic.decoration)
    && M.isDecoration(M.LEGACY_PRESETS.underscore.decoration));
ok("some legacy presets point at a decoration since removed from DECORATIONS",
  !M.isDecoration(M.LEGACY_PRESETS.boneyardDice.decoration)
    && !M.isDecoration(M.LEGACY_PRESETS.diamondMarks.decoration)
    && !M.isDecoration(M.LEGACY_PRESETS.afterglow.decoration)
    && !M.isDecoration(M.LEGACY_PRESETS.kinetic.decoration));
ok("some legacy presets still point at a currently-valid glyph set",
  M.isGlyphSet(M.LEGACY_PRESETS.classic.glyphSet)
    && M.isGlyphSet(M.LEGACY_PRESETS.romanCourt.glyphSet));
ok("some legacy presets point at a glyph set since removed from GLYPH_SETS",
  !M.isGlyphSet(M.LEGACY_PRESETS.cipherBraille.glyphSet)
    && !M.isGlyphSet(M.LEGACY_PRESETS.letterGrid.glyphSet));

// resolveDecorationSetting / resolveAnimationSetting / resolveGlyphSetSetting
// - the single fallback chain BarWidget.qml relies on: current setting >
// legacy meaning > plain default, re-validating at every step.
ok("resolveDecorationSetting passes through a valid current setting",
  M.resolveDecorationSetting("underline", "classic") === "underline");
ok("resolveDecorationSetting falls back to the plain default for kinetic (its old \"pop\" decoration is now an animation, not a decoration)",
  M.resolveDecorationSetting("bogus", "kinetic") === M.DEFAULT_DECORATION);
ok("resolveDecorationSetting falls back to the plain default when the legacy preset's own decoration was removed",
  M.resolveDecorationSetting("bogus", "boneyardDice") === M.DEFAULT_DECORATION);
ok("resolveDecorationSetting falls back to the plain default with no legacy preset at all",
  M.resolveDecorationSetting("bogus", "") === M.DEFAULT_DECORATION);

ok("resolveAnimationSetting passes through a valid current setting",
  M.resolveAnimationSetting("hyprPop", "kinetic") === "hyprPop");
ok("resolveAnimationSetting maps the old \"flame\" id to \"neon\" (renamed, same effect)",
  M.resolveAnimationSetting("flame", "") === "neon");
ok("resolveAnimationSetting's \"flame\" alias takes priority over everything else",
  M.resolveAnimationSetting("flame", "kinetic", "hyprPop") === "neon");
ok("resolveAnimationSetting recovers kinetic's old \"pop\" decoration as the animation instead",
  M.resolveAnimationSetting("bogus", "kinetic") === "pop");
ok("resolveAnimationSetting recovers a rawDecoration of \"hyprPop\" (this plugin's own prior format, before animation was split out)",
  M.resolveAnimationSetting("bogus", "", "hyprPop") === "hyprPop");
ok("resolveAnimationSetting prefers a valid current animation setting over rawDecoration",
  M.resolveAnimationSetting("pop", "", "hyprPop") === "pop");
ok("resolveAnimationSetting prefers rawDecoration over the older style-preset legacy path",
  M.resolveAnimationSetting("bogus", "kinetic", "hyprPop") === "hyprPop");
ok("resolveAnimationSetting ignores a rawDecoration that isn't itself an animation id",
  M.resolveAnimationSetting("bogus", "", "pill") === M.DEFAULT_ANIMATION);
ok("resolveAnimationSetting falls back to the plain default with no matching legacy preset",
  M.resolveAnimationSetting("bogus", "classic") === M.DEFAULT_ANIMATION);
ok("resolveAnimationSetting falls back to the plain default with no legacy preset at all",
  M.resolveAnimationSetting("bogus", "") === M.DEFAULT_ANIMATION);

ok("resolveGlyphSetSetting passes through a valid current setting",
  M.resolveGlyphSetSetting("dice", "classic") === "dice");
ok("resolveGlyphSetSetting falls back to a legacy preset glyph set",
  M.resolveGlyphSetSetting("bogus", "romanCourt") === "roman");
ok("resolveGlyphSetSetting falls back to the plain default when the legacy preset's own glyph set was removed",
  M.resolveGlyphSetSetting("bogus", "cipherBraille") === M.DEFAULT_GLYPH_SET
    && M.resolveGlyphSetSetting("bogus", "letterGrid") === M.DEFAULT_GLYPH_SET);
ok("resolveGlyphSetSetting falls back to the plain default with no legacy preset at all",
  M.resolveGlyphSetSetting("bogus", "") === M.DEFAULT_GLYPH_SET);

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

console.log(failed === 0 ? "\nAll passed." : "\n" + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
