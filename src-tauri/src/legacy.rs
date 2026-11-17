//! Detects the Electron-era install so the app can tell the user it is still there.
//! electron-builder registers a per-user uninstall entry whose `DisplayName` is the
//! product name ("WiZ APP"); the Tauri installer uses the same name under a different key.

use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LegacyInstall {
    pub display_name: String,
    pub uninstall_string: String,
}

const PRODUCT_NAME_PREFIX: &str = "WiZ APP";

/// Normalizes an `UninstallString` (quoted, with flags) to a lowercase path.
fn uninstaller_path(uninstall_string: &str) -> String {
    let s = uninstall_string.trim();
    let path = match s.strip_prefix('"') {
        Some(rest) => rest.split('"').next().unwrap_or(rest),
        None => s.split(" /").next().unwrap_or(s),
    };
    path.replace('/', "\\").to_lowercase()
}

/// An entry is the old Electron app when it is called "WiZ APP..." and its uninstaller
/// is not the one sitting next to the running executable.
pub fn is_legacy_entry(display_name: &str, uninstall_string: &str, own_dir: Option<&Path>) -> bool {
    if !display_name.starts_with(PRODUCT_NAME_PREFIX) {
        return false;
    }
    let theirs = uninstaller_path(uninstall_string);
    if let Some(dir) = own_dir {
        let own_prefix = dir.to_string_lossy().replace('/', "\\").to_lowercase();
        if !own_prefix.is_empty() && theirs.starts_with(&own_prefix) {
            return false;
        }
    }
    true
}

#[cfg(windows)]
pub fn find_legacy_install() -> Option<LegacyInstall> {
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let own_dir: Option<PathBuf> =
        std::env::current_exe().ok().and_then(|p| p.parent().map(Path::to_path_buf));
    let uninstall = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Uninstall")
        .ok()?;
    for key in uninstall.enum_keys().flatten() {
        let Ok(sub) = uninstall.open_subkey(&key) else { continue };
        // Tauri's NSIS installer (this app, or a test build of it) writes `MainBinaryName`;
        // electron-builder does not. Those entries are never the old Electron install.
        if sub.get_value::<String, _>("MainBinaryName").is_ok() {
            continue;
        }
        let Ok(display_name) = sub.get_value::<String, _>("DisplayName") else { continue };
        let uninstall_string = sub.get_value::<String, _>("UninstallString").unwrap_or_default();
        if is_legacy_entry(&display_name, &uninstall_string, own_dir.as_deref()) {
            return Some(LegacyInstall { display_name, uninstall_string });
        }
    }
    None
}

#[cfg(not(windows))]
pub fn find_legacy_install() -> Option<LegacyInstall> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    const ELECTRON: &str =
        r#""C:\Users\u\AppData\Local\Programs\wiz_app\Uninstall WiZ APP.exe" /currentuser"#;

    #[test]
    fn electron_entry_is_detected() {
        let own = Path::new(r"C:\Users\u\AppData\Local\WiZ APP");
        assert!(is_legacy_entry("WiZ APP", ELECTRON, Some(own)));
    }

    #[test]
    fn our_own_uninstaller_is_not_legacy() {
        let own = Path::new(r"C:\Users\u\AppData\Local\WiZ APP");
        let ours = r#""C:\Users\u\AppData\Local\WiZ APP\uninstall.exe""#;
        assert!(!is_legacy_entry("WiZ APP", ours, Some(own)));
        // Case and slash differences do not matter.
        let ours = r#""c:/users/u/appdata/local/wiz app/uninstall.exe""#;
        assert!(!is_legacy_entry("WiZ APP", ours, Some(own)));
    }

    #[test]
    fn unrelated_programs_are_ignored() {
        assert!(!is_legacy_entry("Visual Studio Code", ELECTRON, None));
        assert!(!is_legacy_entry("WizTree", ELECTRON, None));
    }

    #[test]
    fn unquoted_uninstall_strings_are_parsed() {
        assert_eq!(
            uninstaller_path(r"C:\Prog Files\x\unins000.exe /SILENT"),
            r"c:\prog files\x\unins000.exe"
        );
    }
}
