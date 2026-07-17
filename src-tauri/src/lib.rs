use tauri::{
    webview::WebviewBuilder, LogicalPosition, LogicalSize, Manager, WebviewUrl, Window,
};
use serde_json::{json, Value};
use std::{collections::BTreeSet, env, fs, path::{Path, PathBuf}};

const URL_PREVIEW_WEBVIEW: &str = "aura-url-preview";

#[tauri::command]
async fn aura_show_url_webview(
    window: Window,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let external = url
        .parse()
        .map(WebviewUrl::External)
        .map_err(|error| format!("Invalid URL: {error}"))?;

    if let Some(existing) = window.get_webview(URL_PREVIEW_WEBVIEW) {
        existing.close().map_err(|error| error.to_string())?;
    }

    let webview = WebviewBuilder::new(URL_PREVIEW_WEBVIEW, external);
    window
        .add_child(
            webview,
            LogicalPosition::new(x, y),
            LogicalSize::new(width.max(1.0), height.max(1.0)),
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
async fn aura_move_url_webview(
    window: Window,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(webview) = window.get_webview(URL_PREVIEW_WEBVIEW) {
        webview
            .set_position(LogicalPosition::new(x, y))
            .map_err(|error| error.to_string())?;
        webview
            .set_size(LogicalSize::new(width.max(1.0), height.max(1.0)))
            .map_err(|error| error.to_string())?;
        webview.show().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn aura_close_url_webview(window: Window) -> Result<(), String> {
    if let Some(webview) = window.get_webview(URL_PREVIEW_WEBVIEW) {
        webview.close().map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn is_thumbnail_file(path: &Path) -> bool {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase();
    name.contains("thumbnail") || name.contains("preview") || name.contains("poster") || name.contains("cover")
}

fn collect_metadata_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_metadata_files(&path, out);
        } else if path
            .file_name()
            .and_then(|value| value.to_str())
            .is_some_and(|name| name == "metadata.json")
            && path.to_string_lossy().contains(".info")
        {
            out.push(path);
        }
    }
}

fn collect_library_dirs(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        if path
            .extension()
            .and_then(|value| value.to_str())
            .is_some_and(|extension| extension.eq_ignore_ascii_case("library"))
            && (path.join("library.json").exists() || path.join("metadata.json").exists())
        {
            out.push(path);
            continue;
        }
        collect_library_dirs(&path, out);
    }
}

fn resolve_eagle_library_path(path: &Path) -> Result<PathBuf, String> {
    if path.join("library.json").exists() || path.join("metadata.json").exists() {
        return Ok(path.to_path_buf());
    }

    for ancestor in path.ancestors().skip(1) {
        if ancestor.join("library.json").exists() || ancestor.join("metadata.json").exists() {
            return Ok(ancestor.to_path_buf());
        }
    }

    let mut libraries = Vec::new();
    collect_library_dirs(path, &mut libraries);
    match libraries.len() {
        0 => {
            let mut metadata_files = Vec::new();
            collect_metadata_files(path, &mut metadata_files);
            if metadata_files.is_empty() {
                Err("Selected folder does not contain Eagle library data".to_string())
            } else {
                Ok(path.to_path_buf())
            }
        }
        1 => Ok(libraries.remove(0)),
        _ => Err("Selected folder contains multiple Eagle libraries. Select one .library folder directly.".to_string()),
    }
}

fn string_field(value: &Value, keys: &[&str]) -> String {
    keys.iter()
        .find_map(|key| value.get(*key))
        .and_then(|value| value.as_str())
        .unwrap_or("")
        .to_string()
}

fn number_field(value: &Value, keys: &[&str], fallback: u64) -> u64 {
    keys.iter()
        .find_map(|key| value.get(*key))
        .and_then(|value| value.as_u64())
        .unwrap_or(fallback)
}

fn string_array_field(value: &Value, key: &str) -> Vec<Value> {
    value
        .get(key)
        .and_then(|value| value.as_array())
        .map(|values| {
            values
                .iter()
                .filter_map(|value| value.as_str().map(|item| json!(item)))
                .collect()
        })
        .unwrap_or_default()
}

fn folder_name_from_id(folder_id: &str) -> String {
    folder_id
        .rsplit(['/', '\\', ':'])
        .next()
        .filter(|name| !name.is_empty())
        .unwrap_or(folder_id)
        .to_string()
}

fn folder_refs_from_metadata(value: &Value) -> Vec<(String, String)> {
    let mut refs = Vec::new();
    if let Some(values) = value.get("folders").and_then(|value| value.as_array()) {
        for folder in values {
            if let Some(folder_id) = folder.as_str() {
                if !folder_id.is_empty() {
                    refs.push((folder_id.to_string(), folder_name_from_id(folder_id)));
                }
            } else if let Some(folder) = folder.as_object() {
                let id = folder
                    .get("id")
                    .or_else(|| folder.get("folderId"))
                    .or_else(|| folder.get("uuid"))
                    .and_then(|value| value.as_str())
                    .unwrap_or("")
                    .to_string();
                if !id.is_empty() {
                    let name = folder
                        .get("name")
                        .or_else(|| folder.get("title"))
                        .or_else(|| folder.get("folderName"))
                        .or_else(|| folder.get("newFolderName"))
                        .and_then(|value| value.as_str())
                        .filter(|name| !name.is_empty())
                        .map(|name| name.to_string())
                        .unwrap_or_else(|| folder_name_from_id(&id));
                    refs.push((id, name));
                }
            }
        }
    }

    let id = string_field(value, &["folder", "folderId", "parent", "parentId"]);
    if !id.is_empty() {
        let name = string_field(value, &["folderName", "folderTitle", "parentName"])
            .if_empty(&folder_name_from_id(&id));
        refs.push((id, name));
    }

    refs
}

#[tauri::command]
async fn aura_scan_eagle_library(path: String) -> Result<String, String> {
    let library_path = PathBuf::from(&path);
    let library_json_path = library_path.join("library.json");
    let metadata_json_path = library_path.join("metadata.json");
    let library: Value = if library_json_path.exists() || metadata_json_path.exists() {
        let manifest_path = if library_json_path.exists() {
            &library_json_path
        } else {
            &metadata_json_path
        };
        let library_json = fs::read_to_string(manifest_path)
            .map_err(|error| format!("Could not read library metadata: {error}"))?;
        serde_json::from_str(&library_json)
            .map_err(|error| format!("Invalid library metadata: {error}"))?
    } else {
        json!({})
    };
    let mut folders = library
        .get("folders")
        .cloned()
        .unwrap_or_else(|| json!([]));

    let mut metadata_files = Vec::new();
    collect_metadata_files(&library_path, &mut metadata_files);

    let mut referenced_folders = BTreeSet::<(String, String)>::new();
    let images: Vec<Value> = metadata_files
        .into_iter()
        .filter_map(|metadata_path| {
            let text = fs::read_to_string(&metadata_path).ok()?;
            let metadata: Value = serde_json::from_str(&text).ok()?;
            let id = string_field(&metadata, &["id"]);
            if id.is_empty() {
                return None;
            }

            let parent = metadata_path.parent()?;
            let mut thumbnail = String::new();
            let mut media = String::new();
            if let Ok(entries) = fs::read_dir(parent) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path == metadata_path || path.is_dir() {
                        continue;
                    }
                    let name = path.file_name().and_then(|value| value.to_str()).unwrap_or("");
                    if name.ends_with(".json") {
                        continue;
                    }
                    let path_string = path.to_string_lossy().to_string();
                    if is_thumbnail_file(&path) && thumbnail.is_empty() {
                        thumbnail = path_string.clone();
                    } else if media.is_empty() {
                        media = path_string.clone();
                    }
                }
            }
            if thumbnail.is_empty() {
                thumbnail = media.clone();
            }

            let folder_refs = folder_refs_from_metadata(&metadata);
            for folder_ref in &folder_refs {
                referenced_folders.insert(folder_ref.clone());
            }
            let folders: Vec<Value> = folder_refs
                .iter()
                .map(|(folder_id, _)| json!(folder_id))
                .collect();
            let folder = folder_refs
                .first()
                .map(|(folder_id, _)| folder_id.clone())
                .unwrap_or_default();
            let imported_at = string_field(&metadata, &["importedAt", "importDate", "dateImported", "dateAdded", "createdAt", "createTime", "mtime", "modificationTime", "updatedAt"]);
            let imported_at = if imported_at.is_empty() {
                fs::metadata(&metadata_path)
                    .and_then(|metadata| metadata.modified())
                    .ok()
                    .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|duration| duration.as_millis().to_string())
                    .unwrap_or_default()
            } else {
                imported_at
            };

            Some(json!({
                "id": id,
                "name": string_field(&metadata, &["name"]).if_empty("Untitled"),
                "src": thumbnail,
                "mediaSrc": if media.is_empty() { thumbnail.clone() } else { media },
                "width": number_field(&metadata, &["width"], 800),
                "height": number_field(&metadata, &["height"], 600),
                "tags": string_array_field(&metadata, "tags"),
                "url": string_field(&metadata, &["url", "website", "link", "sourceURL"]),
                "website": string_field(&metadata, &["website"]),
                "link": string_field(&metadata, &["link"]),
                "sourceURL": string_field(&metadata, &["sourceURL"]),
                "annotation": string_field(&metadata, &["annotation"]),
                "folders": folders,
                "folder": folder,
                "ext": string_field(&metadata, &["ext"]),
                "mime": string_field(&metadata, &["mime", "type"]),
                "importedAt": imported_at
            }))
        })
        .collect();

    let mut manifest_ids = BTreeSet::new();
    if let Some(values) = folders.as_array() {
        for folder in values {
            if let Some(folder_id) = folder.get("id").and_then(|value| value.as_str()) {
                manifest_ids.insert(folder_id.to_string());
            }
        }
    }
    let missing_folders: Vec<Value> = referenced_folders
        .into_iter()
        .filter(|(folder_id, _)| !manifest_ids.contains(folder_id))
        .map(|(folder_id, name)| {
            json!({
                "id": folder_id,
                "name": name,
                "children": [],
                "iconColor": "blue"
            })
        })
        .collect();
    if folders.as_array().is_none_or(|folders| folders.is_empty()) {
        folders = json!(missing_folders);
    } else if let Some(values) = folders.as_array_mut() {
        values.extend(missing_folders);
    }

    Ok(json!({
        "libraryName": string_field(&library, &["name"]).if_empty(
            library_path
                .file_stem()
                .and_then(|value| value.to_str())
                .unwrap_or("Eagle Library")
        ),
        "libraryPath": library_path.to_string_lossy(),
        "folders": folders,
        "images": images
    })
    .to_string())
}

#[tauri::command]
async fn aura_find_eagle_library(library_name: String) -> Result<String, String> {
    let home = env::var("HOME").map_err(|error| format!("Could not read HOME: {error}"))?;
    let search_roots = ["Pictures", "Downloads", "Documents", "Desktop"]
        .iter()
        .map(|name| PathBuf::from(&home).join(name))
        .filter(|path| path.exists());
    let requested = library_name.trim().to_lowercase();
    let mut libraries = Vec::new();

    for root in search_roots {
        collect_library_dirs(&root, &mut libraries);
    }

    for library_path in libraries {
        let library_json_path = library_path.join("library.json");
        let Ok(library_json) = fs::read_to_string(&library_json_path) else {
            continue;
        };
        let Ok(library) = serde_json::from_str::<Value>(&library_json) else {
            continue;
        };
        let name = string_field(&library, &["name"]).to_lowercase();
        let folder_name = library_path
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_lowercase();
        if requested.is_empty() || name == requested || folder_name == requested {
            return Ok(library_path.to_string_lossy().to_string());
        }
    }

    Ok(String::new())
}

#[tauri::command]
async fn aura_pick_eagle_library() -> Result<String, String> {
    let Some(path) = rfd::FileDialog::new()
        .set_title("Select Eagle .library folder")
        .pick_folder()
    else {
        return Ok(String::new());
    };

    resolve_eagle_library_path(&path).map(|path| path.to_string_lossy().to_string())
}

trait IfEmpty {
    fn if_empty(self, fallback: &str) -> String;
}

impl IfEmpty for String {
    fn if_empty(self, fallback: &str) -> String {
        if self.is_empty() {
            fallback.to_string()
        } else {
            self
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            aura_show_url_webview,
            aura_move_url_webview,
            aura_close_url_webview,
            aura_scan_eagle_library,
            aura_find_eagle_library,
            aura_pick_eagle_library
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aura desktop app");
}
