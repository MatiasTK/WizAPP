//! System language and the few strings Rust itself shows (tray). The renderer uses the
//! same `translation.json` files through i18next.

use serde_json::Value;

use crate::models::LanguagePref;

const EN: &str = include_str!("../../resources/locales/en/translation.json");
const ES: &str = include_str!("../../resources/locales/es/translation.json");

/// Built-in WiZ scene id -> key under `scenes.names` (same table as the renderer).
const SCENE_KEYS: [(u32, &str); 32] = [
    (1, "ocean"),
    (2, "romance"),
    (3, "sunset"),
    (4, "party"),
    (5, "fireplace"),
    (6, "cozy"),
    (7, "forest"),
    (8, "pastelColors"),
    (9, "wakeUp"),
    (10, "bedtime"),
    (11, "warmWhite"),
    (12, "dayLight"),
    (13, "coldWhite"),
    (14, "nightLight"),
    (15, "focus"),
    (16, "relax"),
    (17, "trueColors"),
    (18, "tvTime"),
    (19, "plantGrowth"),
    (20, "spring"),
    (21, "summer"),
    (22, "fall"),
    (23, "deepDive"),
    (24, "jungle"),
    (25, "mojito"),
    (26, "club"),
    (27, "christmas"),
    (28, "halloween"),
    (29, "candleLight"),
    (30, "goldenWhite"),
    (31, "pulse"),
    (32, "steampunk"),
];

/// `"es-AR"` -> `"es"`, anything unsupported -> `"en"`.
pub fn normalize_language(locale: Option<&str>) -> &'static str {
    let primary = locale.unwrap_or("").split(['-', '_']).next().unwrap_or("").to_lowercase();
    match primary.as_str() {
        "es" => "es",
        _ => "en",
    }
}

pub fn system_language() -> &'static str {
    normalize_language(sys_locale::get_locale().as_deref())
}

/// The language the UI should use for a stored preference.
pub fn resolve_language(pref: LanguagePref) -> &'static str {
    match pref {
        LanguagePref::En => "en",
        LanguagePref::Es => "es",
        LanguagePref::Auto => system_language(),
    }
}

fn translations(lang: &str) -> Value {
    let raw = if lang == "es" { ES } else { EN };
    serde_json::from_str(raw).unwrap_or(Value::Null)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TrayLabels {
    pub show: String,
    pub toggle: String,
    pub all_on: String,
    pub all_off: String,
    pub quit: String,
}

pub fn tray_labels(lang: &str) -> TrayLabels {
    let json = translations(lang);
    let get = |key: &str, fallback: &str| json["tray"][key].as_str().unwrap_or(fallback).to_owned();
    TrayLabels {
        show: get("show", "Show"),
        toggle: get("toggle", "Toggle active bulb"),
        all_on: get("allOn", "Turn all on"),
        all_off: get("allOff", "Turn all off"),
        quit: get("quit", "Quit"),
    }
}

/// Display name of a built-in scene, `None` for ids that are not built in.
pub fn scene_name(lang: &str, id: u32) -> Option<String> {
    let key = SCENE_KEYS.iter().find(|(i, _)| *i == id)?.1;
    translations(lang)["scenes"]["names"][key].as_str().map(str::to_owned)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_locales() {
        assert_eq!(normalize_language(Some("es-AR")), "es");
        assert_eq!(normalize_language(Some("es_ES")), "es");
        assert_eq!(normalize_language(Some("ES")), "es");
        assert_eq!(normalize_language(Some("en-US")), "en");
        assert_eq!(normalize_language(Some("fr-FR")), "en");
        assert_eq!(normalize_language(Some("")), "en");
        assert_eq!(normalize_language(None), "en");
    }

    #[test]
    fn explicit_preference_wins_over_the_system() {
        assert_eq!(resolve_language(LanguagePref::Es), "es");
        assert_eq!(resolve_language(LanguagePref::En), "en");
    }

    #[test]
    fn tray_labels_come_from_the_translation_files() {
        let en = tray_labels("en");
        assert_eq!(en.quit, "Quit");
        let es = tray_labels("es");
        assert_ne!(es.show, en.show);
        assert!(!es.toggle.is_empty());
        assert!(!es.all_on.is_empty() && !es.all_off.is_empty());
        assert_eq!(tray_labels("de"), en);
    }

    #[test]
    fn every_built_in_scene_has_a_name_in_both_languages() {
        for (id, _) in SCENE_KEYS {
            assert!(scene_name("en", id).is_some(), "en scene {id}");
            assert!(scene_name("es", id).is_some(), "es scene {id}");
        }
        assert_eq!(scene_name("en", 33), None);
    }
}
