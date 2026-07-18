# Changelog

## 1.0.10

- Added folder-scoped canvas groups with persisted group assignments across relaunches and folder switches.
- Added right-hand preview group controls with keyboard shortcuts for assigning items to custom groups or back to the original group.
- Added multi-select support in canvas view, including command-click and shift-click selection without opening preview.
- Added item preview metadata and Eagle comment support, including highlighted comment areas, comment pulsing, and show/hide controls.
- Added a dedicated Comments library view in the sidebar with comment text, thumbnails, and folder names.
- Updated canvas layout defaults to use larger spacing for original and custom groups, including migration for existing saved folder layouts.
- Added a 4-column option for canvas group grids.
- Improved canvas layout reflow so changing image gap, column count, or group spacing automatically applies the Organize behavior.
- Fixed canvas layout reflow so existing custom groups are preserved and nearby or overlapping groups are not merged during layout changes.
- Fixed selected canvas items so the blue outline remains visible.
- Fixed preview and canvas group assignment flows so moving an item triggers the same organize behavior as dropping into a group.

## 1.0.9

- Optimized large canvas rendering so very large libraries render only the visible canvas window instead of mounting every item at once.
- Limited thumbnail decoding in large canvas mode to reduce memory pressure and avoid app or system lockups.
- Preserved original canvas display ordering and item positions while virtualizing large canvases.
- Fixed preview bundle version display so the sidebar shows `All v1.0.9`.
- Fixed canvas item overlap caused by windowed items mounting before their imperative positioning pass.
- Moved the large-canvas performance indicator to the lower-left corner.
- Updated image zoom navigation so left/right follows the main canvas display order.
- Aligned app version metadata across npm, Tauri config, Cargo, Cargo lock, and generated assets.
