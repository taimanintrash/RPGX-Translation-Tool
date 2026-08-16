// ui-layout.js
// Pure DOM layout helpers: modal drag, pane/column/row resize handles, and
// auto-resizing number inputs. Has no translation or stylization logic and
// touches no state beyond DOM geometry. Split out of ui.js so the remaining
// ui.js is purely stylization-map management + the error banner.

/**
 * Initializes mouse drag-and-drop mechanics for the floating debug modal window.
 * Attaches mousedown/mousemove/mouseup listeners to the modal header so the modal
 * can be repositioned by dragging its title bar.
 * Called by: main.js (DOMContentLoaded init)
 */
export function initDraggableModal() {
    const modal = document.getElementById("draggableDebugModal");
    const header = document.getElementById("debugModalHeader");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('modal-close-x')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = modal.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        modal.style.position = 'absolute';
        modal.style.left = initialLeft + 'px';
        modal.style.top = initialTop + 'px';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        modal.style.left = (initialLeft + dx) + 'px';
        modal.style.top = (initialTop + dy) + 'px';
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

/**
 * Generic helper: creates a column (horizontal) drag resizer between two elements.
 * Computes a width percentage from the cursor position clamped to [minPct, maxPct]
 * and applies it to both elements, then fires the optional onResize callback.
 * Called by: ui-layout.js (initPaneResizer)
 */
function _initColResizer(handleEl, leftEl, rightEl, wrapperEl, minPct, maxPct, onResize) {
    if (!handleEl || !leftEl || !rightEl || !wrapperEl) return;
    let active = false;
    handleEl.addEventListener("mousedown", (e) => {
        active = true;
        handleEl.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
        if (!active) return;
        const rect = wrapperEl.getBoundingClientRect();
        const pct = Math.max(minPct, Math.min(maxPct, ((e.clientX - rect.left) / rect.width) * 100));
        leftEl.style.flex = "none";
        rightEl.style.flex = "none";
        leftEl.style.width = `calc(${pct}% - 3px)`;
        rightEl.style.width = `calc(${100 - pct}% - 3px)`;
        if (onResize) onResize();
    });
    document.addEventListener("mouseup", () => {
        if (active) {
            active = false;
            handleEl.classList.remove("active");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });
}

/**
 * Generic helper: creates a row (vertical) drag resizer between two sibling elements.
 * Computes new top/bottom heights from the cursor delta, clamped to a 30px minimum.
 * Called by: ui-layout.js (initPaneResizer)
 */
function _initRowResizer(handleEl, topEl, bottomEl, containerEl) {
    if (!handleEl || !topEl || !bottomEl || !containerEl) return;
    let active = false;
    let startY = 0, startTopH = 0, startBottomH = 0;

    handleEl.addEventListener("mousedown", (e) => {
        active = true;
        handleEl.classList.add("active");
        startY = e.clientY;
        startTopH = topEl.getBoundingClientRect().height;
        startBottomH = bottomEl.getBoundingClientRect().height;
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
        if (!active) return;
        const delta = e.clientY - startY;
        const newTopH = Math.max(30, startTopH + delta);
        const newBottomH = Math.max(30, startBottomH - delta);
        topEl.style.flex = "none";
        bottomEl.style.flex = "none";
        topEl.style.height = newTopH + "px";
        bottomEl.style.height = newBottomH + "px";
    });
    document.addEventListener("mouseup", () => {
        if (active) {
            active = false;
            handleEl.classList.remove("active");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });
}

/**
 * Syncs the external footer row alignment with the sidebar and pane widths.
 * Applies a left padding equal to sidebar + handle width, and mirrors pane column widths
 * so the footer actions line up under the source panes after a resize.
 * Called by: ui-layout.js (initPaneResizer via the onResize callback + window resize listener)
 */
function _syncFooter() {
    const sidebar = document.querySelector(".sidebar");
    const handle = document.getElementById("sidebarResizeHandle");
    const footer = document.getElementById("mainFooterActions");
    const paneLeft = document.getElementById("paneLeft");
    const paneRight = document.getElementById("paneRight");
    const lf = document.getElementById("paneLeftFooter");
    const rf = document.getElementById("paneRightFooter");
    const fs = document.getElementById("footerPaneSpacer");
    if (!footer || !sidebar || !handle || !lf || !rf) return;

    const sidebarW = sidebar.getBoundingClientRect().width;
    const handleW = handle.getBoundingClientRect().width;
    const containerGap = 4; // matches .container gap
    footer.style.paddingLeft = `${sidebarW + handleW + containerGap}px`;

    // Mirror pane widths if they have been resized
    if (paneLeft && paneRight) {
        const plW = paneLeft.getBoundingClientRect().width;
        const prW = paneRight.getBoundingClientRect().width;
        const handlePaneW = document.getElementById("paneResizeHandle")?.getBoundingClientRect().width ?? 10;
        lf.style.flex = "none";
        rf.style.flex = "none";
        lf.style.width = `${plW}px`;
        rf.style.width = `${prW}px`;
        if (fs) fs.style.width = `${handlePaneW}px`;
    }
}

/**
 * Initializes all draggable resize handles: the sidebar column resizer, the source-pane
 * column resizer, and the two manual-step context row resizers (Archival<->Recent,
 * Recent<->Split). Also aligns the footer on initial load and on window resize.
 * Called by: main.js (DOMContentLoaded init)
 */
export function initPaneResizer() {
    _initColResizer(
        document.getElementById("sidebarResizeHandle"),
        document.querySelector(".sidebar"),
        document.getElementById("mainContent"),
        document.querySelector(".container"),
        10, 40,
        _syncFooter   // callback fired on every sidebar drag tick
    );

    // 2. Source pane left ↔ Source pane right
    _initColResizer(
        document.getElementById("paneResizeHandle"),
        document.getElementById("paneLeft"),
        document.getElementById("paneRight"),
        document.querySelector(".panes-wrapper"),
        15, 85,
        _syncFooter   // callback fired on every pane drag tick
    );

    // Align footer on initial load and whenever the window is resized
    requestAnimationFrame(_syncFooter);
    window.addEventListener("resize", _syncFooter);

    // 3. Context: Archival ↔ Recent
    _initRowResizer(
        document.getElementById("ctxResizeArchRecent"),
        document.getElementById("ctxRowArchival"),
        document.getElementById("ctxRowRecent"),
        document.querySelector(".manual-step-context-grid")
    );

    // 4. Context: Recent ↔ Split (raw + source lines)
    _initRowResizer(
        document.getElementById("ctxResizeRecentSplit"),
        document.getElementById("ctxRowRecent"),
        document.getElementById("ctxRowSplit"),
        document.querySelector(".manual-step-context-grid")
    );
}

/**
 * Makes elements with class .auto-number-input dynamically resize to fit their value
 * by setting a calc(<ch> + 16px) width on input and change events.
 * Called by: main.js (DOMContentLoaded init)
 */
export function initAutoNumberInputs() {
    function resize(el) {
        const len = String(el.value).length || 1;
        el.style.width = 'calc(' + len + 'ch + 16px)';
    }
    document.querySelectorAll('.auto-number-input').forEach(el => {
        resize(el);
        el.addEventListener('input', () => resize(el));
        el.addEventListener('change', () => resize(el));
    });
}
