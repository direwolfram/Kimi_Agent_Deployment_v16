use tauri::{
    webview::WebviewBuilder, LogicalPosition, LogicalSize, Manager, WebviewUrl, Window,
};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            aura_show_url_webview,
            aura_move_url_webview,
            aura_close_url_webview
        ])
        .run(tauri::generate_context!())
        .expect("error while running Aura desktop app");
}
