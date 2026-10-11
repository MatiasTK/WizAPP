//! System language and the few strings Rust itself shows (tray). The renderer uses the
//! same `translation.json` files through i18next.

use serde_json::Value;

const EN: &str = include_str!("../../resources/locales/en/translation.json");
const ES: &str = include_str!("../../resources/locales/es/translation.json");

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TrayLabels {
    pub show: String,
    pub toggle: String,
    pub quit: String,
}

pub fn tray_labels(lang: &str) -> TrayLabels {
    let raw = if lang == "es" { ES } else { EN };
    let json: Value = serde_json::from_str(raw).unwrap_or(Value::Null);
    let get = |key: &str, fallback: &str| json["tray"][key].as_str().unwrap_or(fallback).to_owned();
    TrayLabels {
        show: get("show", "Show"),
        toggle: get("toggle", "Toggle Bulb"),
        quit: get("quit", "Quit"),
    }
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
    fn tray_labels_come_from_the_translation_files() {
        let en = tray_labels("en");
        assert_eq!((en.show.as_str(), en.quit.as_str()), ("Show", "Quit"));
        let es = tray_labels("es");
        assert_ne!(es.show, en.show);
        assert!(!es.toggle.is_empty());
        assert_eq!(tray_labels("de"), en);
    }
}
