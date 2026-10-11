//! Persistent app config (`config.json`, version 2) and one-time import of the
//! Electron-era file.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::models::{CustomColor, LanguagePref, Settings, Theme};

pub const CONFIG_VERSION: u32 = 2;
const FILE_NAME: &str = "config.json";

/// Warm White, Daylight, Night Light, Cozy (ids from the WiZ scene table).
pub const DEFAULT_FAVORITES: [u32; 4] = [11, 12, 14, 6];

/// Folder names the Electron build has used under `%APPDATA%`, in lookup order.
pub const LEGACY_DIR_NAMES: [&str; 3] = ["Wiz App", "WiZ APP", "wiz_app"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BulbEntry {
    /// Stable identity. `None` until the bulb answered once.
    pub mac: Option<String>,
    pub ip: String,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: u32,
    pub bulbs: Vec<BulbEntry>,
    #[serde(default)]
    pub active_bulb_ip: Option<String>,
    pub custom_colors: Vec<CustomColor>,
    pub favorite_colors: Vec<u32>,
    /// Optional so a config written before the redesign still loads.
    #[serde(default)]
    pub theme: Theme,
    #[serde(default)]
    pub language: LanguagePref,
}

impl AppConfig {
    pub fn settings(&self) -> Settings {
        Settings { theme: self.theme, language: self.language }
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: CONFIG_VERSION,
            bulbs: Vec::new(),
            active_bulb_ip: None,
            custom_colors: Vec::new(),
            favorite_colors: DEFAULT_FAVORITES.to_vec(),
            theme: Theme::default(),
            language: LanguagePref::default(),
        }
    }
}

/// What `ConfigStore::load` found; the caller turns it into a toast.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LoadOutcome {
    Loaded,
    /// No config anywhere: fresh defaults, nothing written yet.
    Created,
    /// Built from an Electron `config.json`; the original was left untouched.
    Imported {
        from: PathBuf,
    },
    /// The existing file was unusable and was moved to `backup`.
    Reset {
        backup: PathBuf,
    },
}

#[derive(Debug)]
pub struct ConfigStore {
    path: PathBuf,
    config: AppConfig,
}

impl ConfigStore {
    /// `dir` is the app config dir; `legacy_dirs` are searched only when `dir` has no config.
    pub fn load(dir: &Path, legacy_dirs: &[PathBuf]) -> (Self, LoadOutcome) {
        let path = dir.join(FILE_NAME);
        let (config, outcome) = if path.exists() {
            match read_v2(&path) {
                Some(config) => (config, LoadOutcome::Loaded),
                None => {
                    let backup = backup_corrupt(&path);
                    (AppConfig::default(), LoadOutcome::Reset { backup })
                }
            }
        } else if let Some((config, from)) = import_legacy(legacy_dirs) {
            (config, LoadOutcome::Imported { from })
        } else {
            (AppConfig::default(), LoadOutcome::Created)
        };

        let store = Self { path, config };
        // An import is written right away so it is never repeated and the two configs diverge.
        if matches!(outcome, LoadOutcome::Imported { .. } | LoadOutcome::Reset { .. }) {
            let _ = store.save();
        }
        (store, outcome)
    }

    pub fn config(&self) -> &AppConfig {
        &self.config
    }

    pub fn config_mut(&mut self) -> &mut AppConfig {
        &mut self.config
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Writes `config.json.tmp` and renames it over `config.json`.
    pub fn save(&self) -> io::Result<()> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }
        let tmp = self.path.with_extension("json.tmp");
        let json = serde_json::to_vec_pretty(&self.config).map_err(io::Error::other)?;
        fs::write(&tmp, json)?;
        fs::rename(&tmp, &self.path)
    }

    /// Deletes the file and goes back to defaults (delete profile).
    pub fn reset(&mut self) -> io::Result<()> {
        self.config = AppConfig::default();
        match fs::remove_file(&self.path) {
            Err(e) if e.kind() != io::ErrorKind::NotFound => Err(e),
            _ => Ok(()),
        }
    }
}

/// `<appdata>\Wiz App`, `<appdata>\WiZ APP`, `<appdata>\wiz_app`, given the new config dir.
pub fn legacy_dirs_for(config_dir: &Path) -> Vec<PathBuf> {
    let Some(appdata) = config_dir.parent() else { return Vec::new() };
    LEGACY_DIR_NAMES.iter().map(|n| appdata.join(n)).collect()
}

fn read_v2(path: &Path) -> Option<AppConfig> {
    let bytes = fs::read(path).ok()?;
    let value: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    if value.get("version")?.as_u64()? > u64::from(CONFIG_VERSION) {
        return None;
    }
    serde_json::from_value(value).ok()
}

fn backup_corrupt(path: &Path) -> PathBuf {
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).map_or(0, |d| d.as_secs());
    let dir = path.parent().unwrap_or(Path::new("."));
    let mut backup = dir.join(format!("config.corrupt-{ts}.json"));
    let mut n = 1;
    while backup.exists() {
        backup = dir.join(format!("config.corrupt-{ts}-{n}.json"));
        n += 1;
    }
    // If even the rename fails there is nothing more to do; defaults overwrite on next save.
    let _ = fs::rename(path, &backup);
    backup
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyBulb {
    bulb_ip: String,
    bulb_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyConfig {
    bulbs: Vec<LegacyBulb>,
    #[serde(default)]
    active_bulb_ip: Option<String>,
    custom_colors: Vec<CustomColor>,
    favorite_colors: Vec<u32>,
}

fn import_legacy(dirs: &[PathBuf]) -> Option<(AppConfig, PathBuf)> {
    for dir in dirs {
        let path = dir.join(FILE_NAME);
        let Ok(bytes) = fs::read(&path) else { continue };
        let Ok(legacy) = serde_json::from_slice::<LegacyConfig>(&bytes) else { continue };
        let config = AppConfig {
            version: CONFIG_VERSION,
            bulbs: legacy
                .bulbs
                .into_iter()
                .map(|b| BulbEntry { mac: None, ip: b.bulb_ip, name: b.bulb_name })
                .collect(),
            active_bulb_ip: legacy.active_bulb_ip,
            custom_colors: legacy.custom_colors,
            favorite_colors: legacy.favorite_colors,
            ..AppConfig::default()
        };
        return Some((config, path));
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    const ELECTRON_FIXTURE: &[u8] = include_bytes!("testdata/electron_3_0_0_config.json");

    fn sample() -> AppConfig {
        AppConfig {
            version: 2,
            bulbs: vec![
                BulbEntry {
                    mac: Some("a8bb50aabbcc".into()),
                    ip: "192.168.1.40".into(),
                    name: "Living".into(),
                },
                BulbEntry { mac: None, ip: "192.168.1.41".into(), name: "Cuarto".into() },
            ],
            active_bulb_ip: Some("192.168.1.40".into()),
            custom_colors: vec![CustomColor { id: 33, name: "Rosa".into(), hex: "#ff66aa".into() }],
            favorite_colors: vec![11, 33, 6],
            ..AppConfig::default()
        }
    }

    fn names(dir: &Path) -> Vec<String> {
        let mut v: Vec<String> = fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        v.sort();
        v
    }

    #[test]
    fn fresh_config_has_default_favorites_and_writes_nothing() {
        let dir = tempfile::tempdir().unwrap();
        let (store, outcome) = ConfigStore::load(dir.path(), &[]);
        assert_eq!(outcome, LoadOutcome::Created);
        assert_eq!(store.config().favorite_colors, vec![11, 12, 14, 6]);
        assert!(store.config().bulbs.is_empty());
        assert!(names(dir.path()).is_empty());
    }

    #[test]
    fn v2_round_trip_is_atomic() {
        let dir = tempfile::tempdir().unwrap();
        let (mut store, _) = ConfigStore::load(dir.path(), &[]);
        *store.config_mut() = sample();
        store.save().unwrap();
        assert_eq!(names(dir.path()), vec!["config.json"]);

        let (loaded, outcome) = ConfigStore::load(dir.path(), &[]);
        assert_eq!(outcome, LoadOutcome::Loaded);
        assert_eq!(loaded.config(), &sample());

        // Overwriting leaves no .tmp behind either.
        store.save().unwrap();
        assert_eq!(names(dir.path()), vec!["config.json"]);
    }

    #[test]
    fn json_keys_are_camel_case() {
        let json = serde_json::to_value(sample()).unwrap();
        assert!(json.get("activeBulbIp").is_some());
        assert!(json.get("customColors").is_some());
        assert!(json.get("favoriteColors").is_some());
        assert!(json["bulbs"][1]["mac"].is_null());
    }

    #[test]
    fn corrupt_file_is_backed_up_not_overwritten() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("config.json"), b"{ this is not json").unwrap();

        let (store, outcome) = ConfigStore::load(dir.path(), &[]);
        let LoadOutcome::Reset { backup } = outcome else { panic!("expected Reset") };
        assert_eq!(fs::read(&backup).unwrap(), b"{ this is not json");
        assert!(backup.file_name().unwrap().to_string_lossy().starts_with("config.corrupt-"));
        assert_eq!(store.config(), &AppConfig::default());
        // The usable fresh config replaced it.
        assert!(ConfigStore::load(dir.path(), &[]).1 == LoadOutcome::Loaded);
    }

    #[test]
    fn wrong_shape_and_future_version_are_backed_up() {
        for body in [
            r#"{"hello":"world"}"#.to_string(),
            r#"{"version":2,"bulbs":"nope","customColors":[],"favoriteColors":[]}"#.to_string(),
            serde_json::to_string(&AppConfig { version: 3, ..sample() }).unwrap(),
        ] {
            let dir = tempfile::tempdir().unwrap();
            fs::write(dir.path().join("config.json"), &body).unwrap();
            let (_, outcome) = ConfigStore::load(dir.path(), &[]);
            let LoadOutcome::Reset { backup } = outcome else { panic!("expected Reset: {body}") };
            assert_eq!(fs::read_to_string(backup).unwrap(), body);
        }
    }

    #[test]
    fn imports_from_each_legacy_folder() {
        for legacy_name in LEGACY_DIR_NAMES {
            let root = tempfile::tempdir().unwrap();
            let config_dir = root.path().join("com.matiastk.wizapp");
            let legacy_dir = root.path().join(legacy_name);
            fs::create_dir_all(&legacy_dir).unwrap();
            fs::write(legacy_dir.join("config.json"), ELECTRON_FIXTURE).unwrap();

            let dirs = legacy_dirs_for(&config_dir);
            let (store, outcome) = ConfigStore::load(&config_dir, &dirs);
            // NTFS is case-insensitive, so "Wiz App" and "WiZ APP" resolve to the same folder.
            let LoadOutcome::Imported { from } = outcome else { panic!("expected Imported") };
            assert_eq!(
                from.to_string_lossy().to_lowercase(),
                legacy_dir.join("config.json").to_string_lossy().to_lowercase()
            );

            let c = store.config();
            assert_eq!(c.version, 2);
            assert_eq!(c.bulbs.len(), 2);
            assert_eq!(c.bulbs[0].ip, "192.168.1.40");
            assert_eq!(c.bulbs[0].name, "Living");
            assert_eq!(c.bulbs[0].mac, None);
            assert_eq!(c.active_bulb_ip.as_deref(), Some("192.168.1.40"));
            assert_eq!(c.custom_colors.len(), 2);
            assert_eq!(c.favorite_colors, vec![11, 12, 14, 6, 33]);

            // Original byte-for-byte intact; new config persisted.
            assert_eq!(fs::read(legacy_dir.join("config.json")).unwrap(), ELECTRON_FIXTURE);
            assert!(config_dir.join("config.json").exists());
        }
    }

    #[test]
    fn legacy_folders_are_tried_in_order_and_invalid_ones_skipped() {
        let root = tempfile::tempdir().unwrap();
        let config_dir = root.path().join("com.matiastk.wizapp");
        fs::create_dir_all(root.path().join("Wiz App")).unwrap();
        fs::write(root.path().join("Wiz App").join("config.json"), b"garbage").unwrap();
        fs::create_dir_all(root.path().join("wiz_app")).unwrap();
        fs::write(root.path().join("wiz_app").join("config.json"), ELECTRON_FIXTURE).unwrap();

        let (_, outcome) = ConfigStore::load(&config_dir, &legacy_dirs_for(&config_dir));
        assert_eq!(
            outcome,
            LoadOutcome::Imported { from: root.path().join("wiz_app").join("config.json") }
        );
    }

    #[test]
    fn existing_new_config_is_never_overwritten_by_import() {
        let root = tempfile::tempdir().unwrap();
        let config_dir = root.path().join("com.matiastk.wizapp");
        fs::create_dir_all(&config_dir).unwrap();
        fs::create_dir_all(root.path().join("Wiz App")).unwrap();
        fs::write(root.path().join("Wiz App").join("config.json"), ELECTRON_FIXTURE).unwrap();
        let (mut store, _) = ConfigStore::load(&config_dir, &[]);
        *store.config_mut() = sample();
        store.save().unwrap();

        let (loaded, outcome) = ConfigStore::load(&config_dir, &legacy_dirs_for(&config_dir));
        assert_eq!(outcome, LoadOutcome::Loaded);
        assert_eq!(loaded.config(), &sample());
    }

    #[test]
    fn reset_deletes_file_and_restores_defaults() {
        let dir = tempfile::tempdir().unwrap();
        let (mut store, _) = ConfigStore::load(dir.path(), &[]);
        *store.config_mut() = sample();
        store.save().unwrap();
        store.reset().unwrap();
        assert!(names(dir.path()).is_empty());
        assert_eq!(store.config(), &AppConfig::default());
        store.reset().unwrap(); // already gone is fine
    }
}
