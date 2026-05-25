import { create } from 'zustand';

interface SidebarState {
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

/** Mobile drawer only. On desktop the sidebar is always visible. */
export const useSidebarStore = create<SidebarState>((set, get) => ({
  mobileOpen: false,
  openMobile: () => set({ mobileOpen: true }),
  closeMobile: () => set({ mobileOpen: false }),
  toggleMobile: () => set({ mobileOpen: !get().mobileOpen }),
}));
