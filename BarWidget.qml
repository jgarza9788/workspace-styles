import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import qs.Commons
import qs.Ui
import "Model.js" as Model
import "Glyphs.js" as Glyphs

// Workspace 1..N switcher with four independently pickable settings: an
// active-workspace decoration (pill / rounded square / underline / bold /
// glow), a switch animation (none / pop / hypr-pop / glitch / neon), a
// glyph set (numbers / roman / kanji / dice / dots / user Nerd Font
// glyphs), and an indicator color role (accent / selection / muted) -
// mixed and matched from the right-click settings popup.
BarWidget {
  id: root
  moduleName: "jgarza.workspace-styles"

  // Bar-provided theme values, with the same fallback pattern the base
  // BarWidget class itself uses for `vertical`/`barSize` (and jgarza.scrollmap
  // uses for its own `fg`) - shared here since nearly every label/glyph in
  // this widget needs one or both.
  readonly property color fg: root.bar ? root.bar.foreground : Color.foreground
  readonly property string fontFamily: root.bar ? root.bar.fontFamily : Style.font.family

  readonly property int count: {
    var raw = Number(setting("count", 9))
    return Math.max(2, Math.min(10, Math.round(isFinite(raw) ? raw : 9)))
  }

  // A widget saved under the old combined "style" preset (before decoration
  // and glyphSet were split into independent settings) has no `decoration`/
  // `glyphSet` key yet - Model.resolve*Setting falls back to what that
  // preset used to mean (re-validated, since some of those old decorations
  // were later dropped) instead of snapping to the plain defaults.
  readonly property string legacyStyleId: String(setting("style", ""))

  readonly property string decoration: Model.resolveDecorationSetting(
    String(setting("decoration", "")), root.legacyStyleId)
  // Two "legacy" cases recovered as the animation instead: a widget saved
  // under this plugin's own prior format (before animation was split out -
  // its `decoration` might still literally be "pop"/"hyprPop"), or the
  // older combined "style" preset, where "kinetic" used "pop" as its
  // (now-removed) decoration.
  readonly property string animation: Model.resolveAnimationSetting(
    String(setting("animation", "")), root.legacyStyleId, String(setting("decoration", "")))
  readonly property string glyphSet: Model.resolveGlyphSetSetting(
    String(setting("glyphSet", "")), root.legacyStyleId)
  readonly property string indicatorColorId: Model.resolveIndicatorColor(
    String(setting("indicatorColor", "")))

  // Read straight from the active theme's colors.toml rather than through
  // qs.Commons.Color/Style: Color.qml only ever parses foreground/
  // background/accent/muted/urgent out of that file, never the theme's own
  // `selection` key, and Style's "selection state" is an unrelated generic
  // UI-control concept (a themeable token that usually just resolves back
  // to accent) - not this file's literal selection color. Re-reads live if
  // the file changes (e.g. a theme switch), same as Color.qml's own
  // colorsFile pattern.
  property var themeColors: ({})
  FileView {
    id: themeColorsFile
    path: Quickshell.env("HOME") + "/.local/state/omarchy/current/theme/colors.toml"
    watchChanges: true
    printErrors: false
    onLoaded: root.themeColors = Model.parseThemeColors(text(), ["accent", "selection", "muted"])
    onFileChanged: reload()
    onLoadFailed: root.themeColors = {}
  }

  readonly property color indicatorColorValue: {
    var hex = root.themeColors[root.indicatorColorId]
    if (hex) return hex
    // Fallback if colors.toml couldn't be read or the key is missing.
    if (root.indicatorColorId === "muted") return Color.muted
    return Color.accent
  }

  // Always the theme's literal accent color, regardless of the Indicator
  // Color setting (which might be Selection or Muted). Neon anchors on
  // this specifically, so its flicker reads as an accent thing even when
  // the rest of the indicator is tinted Selection/Muted.
  readonly property color themeAccentColor: root.themeColors["accent"] || Color.accent
  readonly property string customGlyphsRaw: String(setting("customGlyphs", ""))
  readonly property var customGlyphsList: Model.parseCustomGlyphs(root.customGlyphsRaw)

  readonly property var decorationOptions: Model.DECORATION_ORDER.map(function (id) {
    var d = Model.DECORATIONS[id]
    return { value: id, label: d.label, description: d.description || "" }
  })
  readonly property var animationOptions: Model.ANIMATION_ORDER.map(function (id) {
    var a = Model.ANIMATIONS[id]
    return { value: id, label: a.label, description: a.description || "" }
  })
  readonly property var glyphSetOptions: Model.GLYPH_SET_ORDER.map(function (id) {
    var g = Model.GLYPH_SETS[id]
    return { value: id, label: g.label, description: g.description || "" }
  })
  readonly property var indicatorColorOptions: Model.INDICATOR_COLOR_ORDER.map(function (id) {
    var c = Model.INDICATOR_COLORS[id]
    return { value: id, label: c.label, description: c.description || "" }
  })

  // ---- Settings popup tabs --------------------------------------------------
  // Which category's option list is showing. Local popup UI state, not a
  // saved setting - not read through setting()/saveSetting().
  property string activeSection: "decoration"

  readonly property var sectionTabs: [
    { value: "decoration", label: "Indicator" },
    { value: "animation", label: "Animation" },
    { value: "glyphSet", label: "Glyphs" },
    { value: "indicatorColor", label: "Color" }
  ]

  // Resolves the active tab to {options, current, key} so a single shared
  // RadioRow list in the popup can serve all four categories instead of
  // one hand-written block per category.
  readonly property var activeSectionMeta: {
    if (root.activeSection === "animation")
      return { options: root.animationOptions, current: root.animation, key: "animation" }
    if (root.activeSection === "glyphSet")
      return { options: root.glyphSetOptions, current: root.glyphSet, key: "glyphSet" }
    if (root.activeSection === "indicatorColor")
      return { options: root.indicatorColorOptions, current: root.indicatorColorId, key: "indicatorColor" }
    return { options: root.decorationOptions, current: root.decoration, key: "decoration" }
  }

  function workspaceById(id) {
    var values = Hyprland.workspaces.values
    for (var i = 0; i < values.length; i++) {
      if (values[i].id === id) return values[i]
    }
    return null
  }

  function liveWorkspaceIds() {
    var values = Hyprland.workspaces.values
    var out = []
    for (var i = 0; i < values.length; i++) out.push(values[i].id)
    return out
  }

  function workspaceIds() {
    return Model.workspaceIds(root.count, root.liveWorkspaceIds())
  }

  function focusWorkspace(id) {
    if (!root.bar) return
    root.bar.run("hyprctl dispatch " + Util.shellQuote("hl.dsp.focus({ workspace = \"" + id + "\" })"))
  }

  // ---- Settings popup ------------------------------------------------------
  property bool settingsOpen: false
  readonly property bool opened: settingsOpen
  function open() { settingsOpen = true }
  function close() { settingsOpen = false }
  function toggle() { settingsOpen = !settingsOpen }

  function previewSetting(key, value) {
    var next = Object.assign({}, settings || {})
    next[key] = value
    settings = next
  }
  function saveSetting(key, value) {
    previewSetting(key, value)
    if (bar && bar.shell && typeof bar.shell.updateEntryInline === "function")
      bar.shell.updateEntryInline(moduleName, settings)
  }

  readonly property real trailingGap: root.vertical ? 0 : Style.spaceReal(1.5)

  implicitWidth: grid.implicitWidth + trailingGap
  implicitHeight: grid.implicitHeight

  GridLayout {
    id: grid
    anchors.fill: parent
    anchors.rightMargin: root.trailingGap
    columns: root.vertical ? 1 : root.workspaceIds().length
    columnSpacing: root.vertical ? 0 : Style.space(1)
    rowSpacing: root.vertical ? Style.space(2) : 0

    Repeater {
      model: root.workspaceIds()

      Item {
        id: cell
        required property int modelData

        readonly property var workspace: root.workspaceById(modelData)
        readonly property bool occupied: workspace !== null && workspace.toplevels.values.length > 0
        readonly property bool focused: Hyprland.focusedWorkspace !== null && Hyprland.focusedWorkspace.id === modelData
        readonly property real cellMin: Math.min(width, height)

        Layout.preferredWidth: root.vertical ? root.barSize : Style.space(20)
        Layout.preferredHeight: root.barSize
        implicitWidth: Layout.preferredWidth
        implicitHeight: Layout.preferredHeight

        // ---- Decoration layer, one per style, gated on root.decoration.
        // "bold" has no shape here - it acts on the glyph Text itself,
        // below, same as the Pop/Hypr-pop animations (a separate, independent
        // setting - see root.animation further down). Color comes from
        // root.indicatorColorValue (Accent / Selection / Muted, user-picked)
        // everywhere. ----

        Rectangle { // pill
          anchors.fill: parent
          anchors.margins: 2
          radius: height / 2
          color: Util.alpha(root.indicatorColorValue, Style.selectedFillAlpha)
          visible: root.decoration === "pill" && cell.focused
        }

        Rectangle { // roundedSquare - filled like pill, but with a smaller,
                    // more squared-off corner radius instead of a full capsule
          anchors.fill: parent
          anchors.margins: 2
          radius: Style.cornerRadius
          color: Util.alpha(root.indicatorColorValue, Style.selectedFillAlpha)
          visible: root.decoration === "roundedSquare" && cell.focused
        }

        Rectangle { // underline
          readonly property real thick: 2
          x: root.vertical ? 0 : (parent.width - width) / 2
          y: root.vertical ? (parent.height - height) / 2 : parent.height - thick - 2
          width: root.vertical ? thick : Math.min(parent.width * 0.6, 18)
          height: root.vertical ? Math.min(parent.height * 0.6, 18) : thick
          radius: thick / 2
          color: root.indicatorColorValue
          visible: root.decoration === "underline" && cell.focused
        }

        Item { // glow - a soft glow fills the active cell behind the glyph,
               // built from a few stacked low-alpha circles shrinking toward
               // the center (no real blur effect, so it never bleeds past
               // neighboring cells)
          anchors.fill: parent
          visible: root.decoration === "glow" && cell.focused
          opacity: cell.focused ? 1 : 0
          Behavior on opacity { NumberAnimation { duration: 140 } }

          Rectangle {
            anchors.centerIn: parent
            width: parent.width; height: parent.height
            radius: Math.min(width, height) / 2
            color: root.indicatorColorValue
            opacity: 0.18
          }
          Rectangle {
            anchors.centerIn: parent
            width: parent.width * 0.72; height: parent.height * 0.72
            radius: Math.min(width, height) / 2
            color: root.indicatorColorValue
            opacity: 0.30
          }
          Rectangle {
            anchors.centerIn: parent
            width: parent.width * 0.42; height: parent.height * 0.42
            radius: Math.min(width, height) / 2
            color: root.indicatorColorValue
            opacity: 0.45
          }
        }

        // ---- Text glyph, always visible (numbers / roman / kanji /
        // nerdIcons / dice / dots - dice is a Nerd Font icon for every
        // value 1-10: real die faces for 1-6, boxed-numeral icons for
        // 7-10 since dice don't have faces above 6 pips; dots is a
        // single Octicons dot-fill icon, same glyph for every workspace) ----
        Text {
          id: glyphText
          anchors.centerIn: parent
          // Glitch's jitter moves this via `transform`, not `x`/`y` directly -
          // animating x/y would fight the anchors.centerIn above.
          transform: Translate { id: glitchShift }
          text: Glyphs.glyphFor(root.glyphSet, modelData, root.customGlyphsList)
          font.family: root.fontFamily
          // Nerd Font icon glyphs (roman, dice) are drawn small inside their
          // own em-box, so they need a size bump to read at the same visual
          // weight as the plain-text glyph sets. The multipliers are
          // measured, not guessed: the roman-numeral glyph's ink is only
          // ~29% of its em-box height vs. ~71% for a plain digit at the
          // same pixelSize (checked against the installed font's `glyf`
          // bounding boxes), so 2.4x brings its actual ink height back up
          // to parity with plain numbers. Dice glyphs are already ~62% of
          // their em-box, so only need a small bump.
          font.pixelSize: {
            if (root.glyphSet === "roman") return Style.font.body * 2.4
            if (root.glyphSet === "dice") return Style.font.body *  1.25
            if (root.glyphSet === "kanji") return Style.font.body * 1.1
            return Style.font.body
          }
          font.bold: root.decoration === "bold" && cell.focused
          color: (root.decoration === "bold" && cell.focused)
            ? root.indicatorColorValue
            : root.fg
          opacity: cell.occupied || cell.focused ? 1 : 0.5

          SequentialAnimation {
            id: popAnim
            NumberAnimation { target: glyphText; property: "scale"; to: 1.35; duration: 90; easing.type: Easing.OutQuad }
            NumberAnimation { target: glyphText; property: "scale"; to: 1.0; duration: 160; easing.type: Easing.OutBack }
          }

          // Hypr-pop: deliberately over-the-top - a multi-stage scale
          // wobble (shoots way past full size, snaps back under, overshoots
          // again smaller, then settles) running in parallel with a
          // rotation wiggle (echoing Hyprland's "wobbly windows" look),
          // roughly triple Pop's duration. Paired with the shockwave ring
          // below so Hypr-pop reads as unmistakably more energetic than
          // Pop even at a glance, not just a slightly-bouncier version of it.
          ParallelAnimation {
            id: hyprPopAnim
            SequentialAnimation {
              NumberAnimation {
                target: glyphText; property: "scale"; from: 0.25; to: 1.7
                duration: 140; easing.type: Easing.OutBack; easing.overshoot: 4.0
              }
              NumberAnimation {
                target: glyphText; property: "scale"; to: 0.8
                duration: 110; easing.type: Easing.InOutQuad
              }
              NumberAnimation {
                target: glyphText; property: "scale"; to: 1.15
                duration: 120; easing.type: Easing.OutBack; easing.overshoot: 2.5
              }
              NumberAnimation {
                target: glyphText; property: "scale"; to: 1.0
                duration: 220; easing.type: Easing.OutElastic; easing.amplitude: 1.0; easing.period: 0.3
              }
            }
            SequentialAnimation {
              NumberAnimation { target: glyphText; property: "rotation"; from: 0; to: -18; duration: 90; easing.type: Easing.OutQuad }
              NumberAnimation { target: glyphText; property: "rotation"; to: 14; duration: 130; easing.type: Easing.InOutQuad }
              NumberAnimation { target: glyphText; property: "rotation"; to: -7; duration: 120; easing.type: Easing.InOutQuad }
              NumberAnimation { target: glyphText; property: "rotation"; to: 0; duration: 150; easing.type: Easing.OutBack }
            }
          }

          // Glitch: a bigger, longer, choreographed position jitter (via the
          // `glitchShift` transform above, not x/y directly) - the glyph
          // rattles through several offsets (larger swings than before) then
          // settles.
          ParallelAnimation {
            id: glitchAnim
            SequentialAnimation {
              NumberAnimation { target: glitchShift; property: "x"; to: -5; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: 4; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: -4; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: 3; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: -2; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: 1; duration: 30 }
              NumberAnimation { target: glitchShift; property: "x"; to: 0; duration: 40 }
            }
            SequentialAnimation { // offset cadence from the x jitter, for chaos
              NumberAnimation { target: glitchShift; property: "y"; to: 2; duration: 25 }
              NumberAnimation { target: glitchShift; property: "y"; to: -3; duration: 40 }
              NumberAnimation { target: glitchShift; property: "y"; to: 2; duration: 40 }
              NumberAnimation { target: glitchShift; property: "y"; to: -1; duration: 40 }
              NumberAnimation { target: glitchShift; property: "y"; to: 0; duration: 65 }
            }
          }

          Connections {
            target: cell
            function onFocusedChanged() {
              if (!cell.focused) return
              if (root.animation === "pop") popAnim.restart()
              else if (root.animation === "hyprPop") { hyprPopAnim.restart(); hyprPopRingAnim.restart() }
              else if (root.animation === "glitch") {
                glitchAnim.restart(); glitchTintAnim.restart()
                glitchFringeCyanAnim.restart(); glitchFringeMagentaAnim.restart()
              }
              else if (root.animation === "neon") neonAnim.restart()
            }
          }
        }

        // Glitch's color-tint flicker: a duplicate-text overlay (never
        // touches glyphText.color directly, which is a live binding -
        // animating a bound property directly would sever the binding
        // once the animation finishes, permanently desyncing the glyph's
        // resting color from theme/indicator-color changes).
        Text {
          id: glitchTint
          anchors.centerIn: parent
          text: glyphText.text
          font: glyphText.font
          color: root.indicatorColorValue
          opacity: 0

          SequentialAnimation {
            id: glitchTintAnim
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0.9; duration: 20 }
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0; duration: 35 }
            PauseAnimation { duration: 40 }
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0.75; duration: 20 }
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0; duration: 40 }
            PauseAnimation { duration: 30 }
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0.5; duration: 20 }
            NumberAnimation { target: glitchTint; property: "opacity"; to: 0; duration: 50 }
          }
        }

        // Glitch's RGB-split color fringe: two more duplicate-text copies,
        // tinted cyan and magenta and offset in opposite directions (fixed
        // Translate, independent of the jitter above), flickering briefly
        // for the classic chromatic-aberration glitch look - "a bit of
        // color" beyond the single indicator-color flash of glitchTint.
        Text {
          id: glitchFringeCyan
          anchors.centerIn: parent
          text: glyphText.text
          font: glyphText.font
          color: "#33e0ff"
          opacity: 0
          transform: Translate { x: -3 }

          SequentialAnimation {
            id: glitchFringeCyanAnim
            NumberAnimation { target: glitchFringeCyan; property: "opacity"; to: 0.75; duration: 25 }
            NumberAnimation { target: glitchFringeCyan; property: "opacity"; to: 0.1; duration: 35 }
            NumberAnimation { target: glitchFringeCyan; property: "opacity"; to: 0.6; duration: 30 }
            NumberAnimation { target: glitchFringeCyan; property: "opacity"; to: 0; duration: 90 }
          }
        }
        Text {
          id: glitchFringeMagenta
          anchors.centerIn: parent
          text: glyphText.text
          font: glyphText.font
          color: "#ff3d81"
          opacity: 0
          transform: Translate { x: 3 }

          SequentialAnimation {
            id: glitchFringeMagentaAnim
            PauseAnimation { duration: 15 }
            NumberAnimation { target: glitchFringeMagenta; property: "opacity"; to: 0.75; duration: 25 }
            NumberAnimation { target: glitchFringeMagenta; property: "opacity"; to: 0.1; duration: 35 }
            NumberAnimation { target: glitchFringeMagenta; property: "opacity"; to: 0.55; duration: 30 }
            NumberAnimation { target: glitchFringeMagenta; property: "opacity"; to: 0; duration: 100 }
          }
        }

        // Neon: the glyph flickers through brightness variations of the
        // theme's own accent color - no fixed red/orange/yellow palette, so
        // it always matches the theme's actual hue - with a lick-of-flame
        // scale flicker riding along. Anchored on root.themeAccentColor at
        // both ends (starts and settles back into the theme's actual
        // accent, regardless of the Indicator Color setting). Same
        // binding-safety technique as glitchTint above - a separate
        // overlay Text carries the color/scale animation, never the real
        // glyphText, so its live color binding is never touched.
        Text {
          id: neonOverlay
          anchors.centerIn: parent
          text: glyphText.text
          font: glyphText.font
          opacity: 0
          color: root.themeAccentColor

          SequentialAnimation {
            id: neonAnim
            ParallelAnimation {
              NumberAnimation { target: neonOverlay; property: "opacity"; to: 1.0; duration: 50 }
              ColorAnimation { target: neonOverlay; property: "color"; to: Qt.lighter(root.themeAccentColor, 1.5); duration: 50 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 1.12; duration: 50; easing.type: Easing.OutQuad }
            }
            ParallelAnimation {
              ColorAnimation { target: neonOverlay; property: "color"; to: Qt.darker(root.themeAccentColor, 1.15); duration: 70 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 0.95; duration: 70 }
            }
            ParallelAnimation {
              ColorAnimation { target: neonOverlay; property: "color"; to: Qt.lighter(root.themeAccentColor, 1.75); duration: 70 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 1.15; duration: 70 }
            }
            ParallelAnimation {
              ColorAnimation { target: neonOverlay; property: "color"; to: Qt.darker(root.themeAccentColor, 1.1); duration: 70 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 0.97; duration: 70 }
            }
            ParallelAnimation {
              ColorAnimation { target: neonOverlay; property: "color"; to: Qt.lighter(root.themeAccentColor, 1.4); duration: 70 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 1.08; duration: 70 }
            }
            ParallelAnimation {
              NumberAnimation { target: neonOverlay; property: "opacity"; to: 0.0; duration: 140 }
              ColorAnimation { target: neonOverlay; property: "color"; to: root.themeAccentColor; duration: 140 }
              NumberAnimation { target: neonOverlay; property: "scale"; to: 1.0; duration: 140 }
            }
          }
        }

        // Hypr-pop's companion shockwave ring: a circle that bursts outward
        // from the cell center and fades, giving Hypr-pop its own visual
        // signature (a shape + motion) distinct from every other animation.
        Item {
          id: hyprPopRing
          anchors.centerIn: parent
          width: cell.cellMin
          height: cell.cellMin
          visible: root.animation === "hyprPop"
          property real ringScale: 1.0
          property real ringOpacity: 0.0
          scale: ringScale
          opacity: ringOpacity

          Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: "transparent"
            border.width: 2
            border.color: root.indicatorColorValue
          }

          ParallelAnimation {
            id: hyprPopRingAnim
            NumberAnimation {
              target: hyprPopRing; property: "ringScale"; from: 0.3; to: 2.4
              duration: 420; easing.type: Easing.OutCubic
            }
            SequentialAnimation {
              NumberAnimation { target: hyprPopRing; property: "ringOpacity"; from: 0.0; to: 0.9; duration: 40 }
              NumberAnimation { target: hyprPopRing; property: "ringOpacity"; to: 0.0; duration: 380; easing.type: Easing.OutCubic }
            }
          }
        }

        MouseArea {
          anchors.fill: parent
          acceptedButtons: Qt.LeftButton
          cursorShape: Qt.PointingHandCursor
          onClicked: root.focusWorkspace(modelData)
        }
      }
    }
  }

  // Right-click anywhere on the widget opens the settings popup.
  MouseArea {
    anchors.fill: parent
    acceptedButtons: Qt.RightButton
    onClicked: root.toggle()
  }

  PopupCard {
    id: settingsPopup
    anchorItem: root
    bar: root.bar
    owner: root
    open: root.settingsOpen
    contentWidth: fittedContentWidth(Style.space(380))
    contentHeight: fittedContentHeight(settingsColumn.implicitHeight)

    Column {
      id: settingsColumn
      anchors.fill: parent
      spacing: Style.space(9)

      Text {
        text: "WORKSPACE STYLES"
        color: root.fg
        font.family: root.fontFamily
        font.pixelSize: Style.font.subtitle
        font.bold: true
      }

      SettingSlider {
        label: "Workspace count"
        minimum: 2
        maximum: 10
        step: 1
        currentValue: root.count
        onPreviewed: function (value) { root.previewSetting("count", Math.round(value)) }
        onCommitted: function (value) { root.saveSetting("count", Math.round(value)) }
      }

      Separator {}

      ButtonGroup {
        width: parent.width
        options: root.sectionTabs
        value: root.activeSection
        foreground: root.fg
        accent: Color.accent
        fontFamily: root.fontFamily
        onChanged: function (v) { root.activeSection = v }
      }

      Column {
        width: parent.width
        spacing: Style.space(2)

        Repeater {
          model: root.activeSectionMeta.options

          RadioRow {
            required property var modelData
            width: parent.width
            value: modelData.value
            label: modelData.label
            description: modelData.description
            checked: root.activeSectionMeta.current === modelData.value
            onSelected: function (v) { root.saveSetting(root.activeSectionMeta.key, v) }
          }
        }
      }

      // Only relevant for the Custom icons glyph set: one text field per
      // active workspace slot, editing customGlyphsList[i].
      Column {
        width: parent.width
        visible: root.glyphSet === "nerdIcons"
        spacing: Style.space(5)

        SectionLabel { text: "Custom glyphs" }

        Repeater {
          model: root.glyphSet === "nerdIcons" ? root.count : 0

          Row {
            required property int index
            width: parent.width
            spacing: Style.space(6)

            Text {
              text: String(index + 1) + ":"
              width: Style.space(14)
              color: root.fg
              font.family: root.fontFamily
            }
            TextField {
              width: parent.width - Style.space(20)
              text: root.customGlyphsList.length > index ? root.customGlyphsList[index] : ""
              placeholderText: String(index + 1)
              foreground: root.fg
              accent: Color.accent
              onEditingFinished: {
                var list = root.customGlyphsList.slice()
                while (list.length < root.count) list.push("")
                list[index] = text
                root.saveSetting("customGlyphs", Model.customGlyphsToString(list))
              }
            }
          }
        }
      }
    }
  }

  // Settings-popup section divider.
  component Separator: PanelSeparator {
    foreground: root.fg
  }

  // Settings-popup section header ("Indicator", "Glyphs", ...).
  component SectionLabel: Text {
    color: root.fg
    font.family: root.fontFamily
    font.pixelSize: Style.font.body
  }

  component RadioRow: Item {
    id: radioRow

    required property string value
    required property string label
    property string description: ""
    property bool checked: false

    signal selected(string value)

    width: parent ? parent.width : implicitWidth
    implicitHeight: Math.max(radioOuter.height, textCol.implicitHeight) + Style.space(6)

    Rectangle {
      id: radioOuter
      anchors.left: parent.left
      anchors.top: parent.top
      anchors.topMargin: Style.space(3)
      width: Style.space(14)
      height: width
      radius: width / 2
      color: "transparent"
      border.width: 2
      border.color: radioRow.checked
        ? Color.accent
        : Qt.darker(root.fg, 1.3)
    }

    Rectangle {
      anchors.centerIn: radioOuter
      width: Style.space(6)
      height: width
      radius: width / 2
      color: Color.accent
      visible: radioRow.checked
    }

    Column {
      id: textCol
      anchors.left: radioOuter.right
      anchors.leftMargin: Style.space(8)
      anchors.right: parent.right
      anchors.top: parent.top
      spacing: Style.space(1)

      Text {
        width: parent.width
        text: radioRow.label
        color: root.fg
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
        font.bold: radioRow.checked
      }
      Text {
        width: parent.width
        visible: radioRow.description !== ""
        text: radioRow.description
        color: root.bar ? Qt.darker(root.bar.foreground, 1.35) : Color.foreground
        font.family: root.fontFamily
        font.pixelSize: Style.font.caption
        wrapMode: Text.WordWrap
      }
    }

    MouseArea {
      anchors.fill: parent
      cursorShape: Qt.PointingHandCursor
      onClicked: radioRow.selected(radioRow.value)
    }
  }

  component SettingSlider: Column {
    id: sliderSetting

    required property string label
    property string suffix: ""
    required property real minimum
    required property real maximum
    required property real step
    required property real currentValue

    signal previewed(real value)
    signal committed(real value)

    width: parent ? parent.width : implicitWidth
    spacing: Style.space(5)

    Item {
      width: parent.width
      implicitHeight: Math.max(settingLabel.implicitHeight, settingValue.implicitHeight)

      Text {
        id: settingLabel
        anchors.left: parent.left
        text: sliderSetting.label
        color: root.fg
        font.family: root.fontFamily
        font.pixelSize: Style.font.body
      }

      Text {
        id: settingValue
        anchors.right: parent.right
        text: Math.round(slider.dragging ? slider.liveValue : sliderSetting.currentValue)
          + sliderSetting.suffix
        color: root.bar ? Qt.darker(root.bar.foreground, 1.35) : Color.foreground
        font.family: root.fontFamily
        font.pixelSize: Style.font.caption
      }
    }

    PanelSlider {
      id: slider
      width: parent.width
      bar: root.bar
      minimum: sliderSetting.minimum
      maximum: sliderSetting.maximum
      step: sliderSetting.step
      integer: true
      value: sliderSetting.currentValue
      onMoved: function (value) { sliderSetting.previewed(value) }
      onReleased: function (value) { sliderSetting.committed(value) }
    }
  }
}
