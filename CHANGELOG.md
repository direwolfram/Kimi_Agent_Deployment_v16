# Changelog

## 1.0.9

- Optimized large canvas rendering so very large libraries render only the visible canvas window instead of mounting every item at once.
- Limited thumbnail decoding in large canvas mode to reduce memory pressure and avoid app or system lockups.
- Preserved original canvas display ordering and item positions while virtualizing large canvases.
- Fixed preview bundle version display so the sidebar shows `All v1.0.9`.
- Fixed canvas item overlap caused by windowed items mounting before their imperative positioning pass.
- Moved the large-canvas performance indicator to the lower-left corner.
- Updated image zoom navigation so left/right follows the main canvas display order.
- Aligned app version metadata across npm, Tauri config, Cargo, Cargo lock, and generated assets.
