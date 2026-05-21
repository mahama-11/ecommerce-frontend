// ─── Z-index scale for layered UI ──────────────────────────
// Centralized so that overlays, drawers, and toasts never clash.

export const Z_INDEX = {
  sidebar: 'z-30',
  stickyHeader: 'z-40',
  pageOverlay: 'z-40',
  floatingToolControl: 'z-40',
  dropdown: 'z-50',
  popover: 'z-50',
  modal: 'z-50',
  drawer: 'z-50',
  portalNav: 'z-50',
  toast: 'z-[60]',
} as const
