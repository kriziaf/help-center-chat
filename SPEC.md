# Help Center Chat Prototype Specification

## Release

- Current version: **1.3.0**
- Release type: Minor prototype iteration
- Version is displayed in the public Help Center footer and tracked in `package.json`.

## Product Surface

The prototype provides:

- A Help Center landing page with hero search and category browsing.
- A floating chat experience with Conversation and Articles tabs.
- Knowledge-base search backed by markdown content in `public/`.
- Scripted smart-flow conversations.
- Test scenarios for default, error, slow, unavailable, multiple-result, and malformed-result states.

## Help Center Audience Views

- The top navigation uses one audience selector instead of separate Find Care, For Employers, and Help Center links.
- Patient Help Center is the default view.
- The selector offers Patient Help Center and Business Help Center.
- The active option is identified with a checkmark.
- The selector closes after selection, on outside click, or when Escape is pressed.
- Switching views resets open conversations, searches, and article state so patient and business contexts do not mix.
- Patient Help Center retains the patient knowledge base, categories, and smart flow.
- Business Help Center provides business-specific hero content and support topics for member access, implementation, reporting, billing, security, and partner support.
- Patient articles are never presented as business content.
- Until a business knowledge base is supplied, the Business Help Center shows a clear resource status and directs users to their MDlive account team.

## Canvas Toolbar

- The toolbar remains visible in both Edit and Prototype modes.
- Edit and Prototype are presented as a segmented control.
- The scenario selector is available only in Edit mode.
- The selector opens a floating menu with scenario descriptions and a checkmark on the active scenario.
- The menu closes after selection, on outside click, or when Escape is pressed.
- Switching to Prototype mode closes and disables the scenario selector.

## Visual Assets

- Interface symbols use `@phosphor-icons/react`.
- Emoji and handwritten inline SVG icons are not used for controls or category artwork.

## Viewport and Device Frame

- The application renders directly in the available preview viewport.
- No mobile simulator bezel, status bar, navigation bar, device shadow, or device-frame wrapper is part of the application source.
- Responsive mobile behavior should be handled through viewport-aware layout rather than a simulated device shell.

## Mobile Viewport and Frame Removal

### Investigation

- Identify whether the visible mobile frame is rendered by application code, repository CSS, or the Figma Make preview environment.
- Inspect the rendered ownership boundary before changing layout code.
- If the frame belongs to the preview environment, document that limitation and use the available preview controls rather than recreating or overriding host UI in the app.
- Source inspection confirmed there is no device-shell component; the remaining app-owned phone-like surface was the fixed-size, rounded chat popup.

### Application Changes

- Remove any app-owned device bezel, simulated status bar, navigation bar, fixed phone dimensions, artificial device radius, device shadow, and outer simulator background.
- Render the Help Center directly against the available viewport with full width and at least `100dvh` height.
- Preserve the existing desktop presentation.
- Keep the canvas toolbar, scenario selector, and Help Center audience selector usable at narrow viewport widths.
- Keep popovers within viewport bounds and prevent horizontal overflow.
- Make the chat experience edge-to-edge or full-screen at mobile widths.
- Account for safe-area insets around fixed controls and chat surfaces.

### Acceptance Criteria

- No app-owned mobile bezel, phone shell, status bar, navigation bar, or simulator shadow is visible.
- The application occupies the full available mobile viewport.
- Patient and Business Help Center views remain selectable.
- Scenario selection remains available in Edit mode.
- Help Center and scenario popovers do not clip or overflow the viewport.
- The chat launcher and popup remain accessible without covering essential content.
- Desktop layout and behavior remain unchanged.
- TypeScript validation and the production build pass.

### Release Tracking

- This work is released as **1.3.0**.
- `package.json` and the visible footer report the completed release version.

## Version Footer

- The Help Center footer displays the version from `package.json`.
- The footer remains part of the public page and does not overlap the fixed chat launcher.

## Release Checklist

- [x] Restore the scenario toolbar.
- [x] Gate scenario selection to Edit mode.
- [x] Use Phosphor icons throughout the interface.
- [x] Confirm no mobile simulator frame is rendered by the app.
- [x] Document the prototype requirements and task status.
- [x] Display the release version in the footer.
- [x] Replace the legacy navigation links with an audience selector.
- [x] Add distinct Patient and Business Help Center views.
- [x] Prevent patient knowledge-base content from appearing in the business view.
- [x] Remove app-owned mobile chat framing.
- [x] Use the dynamic viewport and mobile safe-area insets.
- [x] Keep mobile popovers and fixed controls within viewport bounds.
- [x] Validate this release with TypeScript and the production build.

## Change History

### 1.3.0

- Converted the mobile chat from a fixed-size rounded popup to an edge-to-edge viewport surface.
- Added `100dvh` sizing and safe-area handling for the canvas toolbar, chat composer, footer, and launcher.
- Constrained scenario and Help Center popovers to the available mobile viewport.
- Preserved the desktop floating chat presentation.

### 1.2.0

- Added the Patient Help Center and Business Help Center audience switcher.
- Replaced the legacy top-navigation links with an accessible dropdown popover.
- Added a dedicated business landing page, support topics, chat greeting, and article empty state.
- Reset active chat and search state when changing audiences.

### 1.1.0

- Restored the scenario selector and floating scenario menu.
- Added this tracked product specification.
- Added a visible footer version.
- Documented the frame-free responsive viewport requirement.

### 1.0.0

- Established the Help Center, knowledge-base, chat, and smart-flow prototype.
