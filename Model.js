// Pure helpers for the Workspace Styles bar widget. Imported from
// BarWidget.qml as `import "Model.js" as Model`, and ES5-only so the same
// file runs under `node tests/model.test.js`.

// Same math as jgarza.workspaces' workspaceIds(), parameterized by `count`
// (clamped 2..10 - Hyprland's conventional single-key workspace range,
// 1-9 then 0 for the 10th). Starts from [1..count], unions in any live
// workspace id in (0, 10], sorted - so a workspace opened beyond `count`
// (occupied or focused) still shows, matching the existing widget's
// live-overflow behavior.
function workspaceIds(count, liveIds) {
  // Number(count) || 9 would treat a genuine 0 as falsy and skip clamping
  // straight to the default, so check finiteness explicitly instead.
  var raw = Number(count)
  var n = Math.max(2, Math.min(10, Math.round(isFinite(raw) ? raw : 9)))
  var ids = []
  for (var i = 1; i <= n; i++) ids.push(i)

  var live = liveIds || []
  for (var j = 0; j < live.length; j++) {
    var id = live[j]
    if (id > 0 && id <= 10 && ids.indexOf(id) === -1) ids.push(id)
  }

  ids.sort(function (a, b) { return a - b })
  return ids
}

// Decoration = the static shape/style that marks the active workspace.
// Animation = motion played on top of it every time focus switches to that
// workspace. Glyph set = what's drawn inside each cell. Indicator color =
// which theme color role paints the decoration/animation. All four are
// independent settings so users can mix and match freely (e.g. dice glyphs
// in a Glow indicator tinted Muted, animated with Hypr-pop).
var DECORATION_ORDER = [
  "pill", "roundedSquare", "underline", "bold", "glow"
]
var DECORATIONS = {
  pill:          { label: "Pill",           description: "Rounded accent capsule fills the active cell." },
  roundedSquare: { label: "Rounded Square", description: "Like Pill, but with squared-off corners instead of a full capsule." },
  underline:     { label: "Underline",      description: "Minimal accent bar under the active cell." },
  bold:          { label: "Bold",           description: "No shape - the active glyph just goes bold and bright." },
  glow:          { label: "Glow",           description: "A soft glow fills the active cell behind the glyph - no shape, no border." }
}
var DEFAULT_DECORATION = "pill"

// Other animation ideas raised and deferred for a future session:
// - Flash: a quick brightness/color flash overlay behind the glyph.
// - Shake: a quick decaying horizontal jitter/rattle (no color change).
// - Pulse: a soft repeating breathe/heartbeat scale pulse (2-3 beats),
//   calmer than Pop's single bounce.
// - Ember burst: a literal "fire" treatment - small flame-colored
//   particles bursting outward and fading (Hypr-pop's shockwave-ring
//   idea, but embers), distinct from Neon's in-place accent-color flicker
//   (Neon was originally "Flame" with a fixed red/orange/yellow palette,
//   renamed once it became an accent-color brightness flicker instead -
//   see resolveAnimationSetting's "flame" alias below).
var ANIMATION_ORDER = ["none", "pop", "hyprPop", "glitch", "neon"]
var ANIMATIONS = {
  none:    { label: "None",     description: "No animation on switch - the indicator just appears." },
  pop:     { label: "Pop",      description: "The active glyph scales up briefly on every switch." },
  hyprPop: { label: "Hypr-pop", description: "A much bigger, springier multi-stage bounce + rotation wobble, plus its own expanding shockwave ring - deliberately over the top." },
  glitch:  { label: "Glitch",   description: "A bigger digital-glitch burst - rapid position jitter with a color-tint flash and a cyan/magenta chromatic-aberration fringe." },
  neon:    { label: "Neon",     description: "The glyph flickers through brightness variations of your theme's accent color, with a lick-of-flame scale wobble." }
}
var DEFAULT_ANIMATION = "none"

var GLYPH_SET_ORDER = [
  "numbers", "roman", "kanji", "dice", "dots", "nerdIcons"
]
var GLYPH_SETS = {
  numbers:  { label: "Numbers",       description: "Plain workspace numbers (10 shows as 0)." },
  roman:    { label: "Roman",         description: "Roman numerals, I through X." },
  kanji:    { label: "Japanese",      description: "Japanese numerals, 一 through 十." },
  dice:     { label: "Dice",          description: "Die-face icons 1-6, boxed numerals 7-10." },
  dots:     { label: "Dots",          description: "No numerals - a plain position dot per workspace." },
  nerdIcons:{ label: "Custom icons",  description: "Your own Nerd Font glyph or emoji per workspace." }
}
var DEFAULT_GLYPH_SET = "numbers"

// Which theme color role paints the active decoration (fill, border, glow,
// or the accent-on-focus text color for Bold/Pop/Hypr-pop).
var INDICATOR_COLOR_ORDER = ["accent", "selection", "muted"]
var INDICATOR_COLORS = {
  accent:    { label: "Accent",    description: "Your theme's accent color." },
  selection: { label: "Selection", description: "Your theme's selection/highlight color." },
  muted:     { label: "Muted",     description: "Your theme's muted, lower-contrast color." }
}
var DEFAULT_INDICATOR_COLOR = "accent"

function isDecoration(id) { return Object.prototype.hasOwnProperty.call(DECORATIONS, id) }
function isAnimation(id) { return Object.prototype.hasOwnProperty.call(ANIMATIONS, id) }
function isGlyphSet(id) { return Object.prototype.hasOwnProperty.call(GLYPH_SETS, id) }
function isIndicatorColor(id) { return Object.prototype.hasOwnProperty.call(INDICATOR_COLORS, id) }

function resolveDecoration(id) { return isDecoration(id) ? id : DEFAULT_DECORATION }
function resolveAnimation(id) { return isAnimation(id) ? id : DEFAULT_ANIMATION }
function resolveGlyphSet(id) { return isGlyphSet(id) ? id : DEFAULT_GLYPH_SET }
function resolveIndicatorColor(id) { return isIndicatorColor(id) ? id : DEFAULT_INDICATOR_COLOR }

// Legacy combined "style" preset -> { decoration, glyphSet }, kept only so a
// widget instance saved under the old single-preset model (schemaVersion
// before decoration/glyphSet were split apart) still opens looking the way
// it did, instead of snapping back to the plain defaults. Some of these
// preset decorations (square, circle, diamond, underglow, and later pop/
// hyprPop once animation became its own setting) were dropped from
// DECORATIONS, and some glyph sets (letters, braille) were dropped from
// GLYPH_SETS, so resolveDecorationSetting/resolveGlyphSetSetting below
// re-validate them and fall back to the plain default if they're no longer
// a real decoration/glyph set. `kinetic`'s old "pop" decoration is instead
// recovered as an *animation* by resolveAnimationSetting, below, since that
// preset's whole point was the bounce.
var LEGACY_PRESETS = {
  classic:       { decoration: "pill",      glyphSet: "numbers" },
  framedSquare:  { decoration: "square",    glyphSet: "numbers" },
  halo:          { decoration: "circle",    glyphSet: "numbers" },
  underscore:    { decoration: "underline", glyphSet: "numbers" },
  boldType:      { decoration: "bold",      glyphSet: "numbers" },
  kinetic:       { decoration: "pop",       glyphSet: "numbers" },
  romanCourt:    { decoration: "pill",      glyphSet: "roman" },
  kanjiZen:      { decoration: "underline", glyphSet: "kanji" },
  boneyardDice:  { decoration: "circle",    glyphSet: "dice" },
  cipherBraille: { decoration: "underline", glyphSet: "braille" },
  letterGrid:    { decoration: "square",    glyphSet: "letters" },
  nerdSignals:   { decoration: "pill",      glyphSet: "nerdIcons" },
  diamondMarks:  { decoration: "diamond",   glyphSet: "numbers" },
  afterglow:     { decoration: "underglow", glyphSet: "dots" }
}

function legacyPreset(styleId) { return LEGACY_PRESETS[styleId] || null }

// Single source of truth for "what decoration/glyphSet does this widget
// instance actually use": the current setting if it's still a real one,
// else the old combined preset's meaning if THAT is still a real one, else
// the plain default. Used by BarWidget.qml so the fallback chain lives in
// one tested place instead of being re-implemented inline in QML.
function resolveDecorationSetting(rawSetting, legacyStyleId) {
  if (isDecoration(rawSetting)) return rawSetting
  var legacy = legacyPreset(legacyStyleId)
  if (legacy && isDecoration(legacy.decoration)) return legacy.decoration
  return DEFAULT_DECORATION
}
function resolveGlyphSetSetting(rawSetting, legacyStyleId) {
  if (isGlyphSet(rawSetting)) return rawSetting
  var legacy = legacyPreset(legacyStyleId)
  if (legacy && isGlyphSet(legacy.glyphSet)) return legacy.glyphSet
  return DEFAULT_GLYPH_SET
}
// Same fallback chain, but for the animation setting. Three different
// kinds of "legacy" can be recovered here:
// - rawSetting === "flame": this animation's own former id, renamed to
//   "neon" once it stopped using a fixed red/orange/yellow palette and
//   became an accent-color brightness flicker instead - checked first so
//   an already-saved "flame" value keeps working with zero disruption.
// - rawDecoration: a widget saved between the point animation was split out
//   of decoration and now still has its OWN `decoration` key set to "pop"/
//   "hyprPop" (this plugin's own prior format, not the older style-preset
//   one).
// - legacyStyleId: the older combined "style" preset, whose `decoration`
//   sometimes happened to be "pop" (the `kinetic` preset) - checked last.
function resolveAnimationSetting(rawSetting, legacyStyleId, rawDecoration) {
  if (rawSetting === "flame") return "neon"
  if (isAnimation(rawSetting)) return rawSetting
  if (isAnimation(rawDecoration)) return rawDecoration
  var legacy = legacyPreset(legacyStyleId)
  if (legacy && isAnimation(legacy.decoration)) return legacy.decoration
  return DEFAULT_ANIMATION
}

// Pulls flat `key = "#rrggbb"` values straight out of the active theme's
// colors.toml (~/.local/state/omarchy/current/theme/colors.toml), for the
// given list of keys - same tolerant line regex qs.Commons/Color.qml's own
// loadColors() uses. This widget needs the theme's literal `selection` hex,
// which Color.qml's singleton never parses (it only keeps foreground/
// background/accent/muted/urgent), so indicator coloring reads the file
// directly instead of going through Color's derived "selection state"
// system (a different, unrelated concept - see BarWidget.qml). Returns
// only the keys actually found; a missing key is simply absent.
function parseThemeColors(raw, keys) {
  var wanted = {}
  for (var i = 0; i < keys.length; i++) wanted[keys[i]] = true
  var out = {}
  var lines = String(raw || "").split("\n")
  for (var j = 0; j < lines.length; j++) {
    var m = lines[j].match(/^\s*([A-Za-z0-9_-]+)\s*=\s*["']?(#[0-9A-Fa-f]{6})/)
    if (!m) continue
    var key = m[1]
    if (wanted[key] && out[key] === undefined) out[key] = m[2]
  }
  return out
}

// customGlyphs setting is a single comma-separated string (the manifest
// schema has no array/object type). Index i (0-based) => workspace i+1.
function parseCustomGlyphs(raw) {
  return String(raw || "").split(",")
}
function customGlyphsToString(list) {
  return (list || []).join(",")
}

if (typeof module !== "undefined") {
  module.exports = {
    workspaceIds: workspaceIds,
    DECORATION_ORDER: DECORATION_ORDER,
    DECORATIONS: DECORATIONS,
    DEFAULT_DECORATION: DEFAULT_DECORATION,
    ANIMATION_ORDER: ANIMATION_ORDER,
    ANIMATIONS: ANIMATIONS,
    DEFAULT_ANIMATION: DEFAULT_ANIMATION,
    GLYPH_SET_ORDER: GLYPH_SET_ORDER,
    GLYPH_SETS: GLYPH_SETS,
    DEFAULT_GLYPH_SET: DEFAULT_GLYPH_SET,
    INDICATOR_COLOR_ORDER: INDICATOR_COLOR_ORDER,
    INDICATOR_COLORS: INDICATOR_COLORS,
    DEFAULT_INDICATOR_COLOR: DEFAULT_INDICATOR_COLOR,
    isDecoration: isDecoration,
    isAnimation: isAnimation,
    isGlyphSet: isGlyphSet,
    isIndicatorColor: isIndicatorColor,
    resolveDecoration: resolveDecoration,
    resolveAnimation: resolveAnimation,
    resolveGlyphSet: resolveGlyphSet,
    resolveIndicatorColor: resolveIndicatorColor,
    LEGACY_PRESETS: LEGACY_PRESETS,
    legacyPreset: legacyPreset,
    resolveDecorationSetting: resolveDecorationSetting,
    resolveAnimationSetting: resolveAnimationSetting,
    resolveGlyphSetSetting: resolveGlyphSetSetting,
    parseThemeColors: parseThemeColors,
    parseCustomGlyphs: parseCustomGlyphs,
    customGlyphsToString: customGlyphsToString
  }
}
