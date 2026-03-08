import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Modals
  activeModals: Modal[];

  // Notifications
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;
  loadingMessage?: string;

  // Theme
  theme: "light" | "dark" | "system";
}

interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;

  // Modal actions
  openModal: (component: string, props?: Record<string, unknown>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Notification actions
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Theme actions
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Reset
  reset: () => void;
}

export type UIStore = UIState & UIActions;

const initialState: UIState = {
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  activeModals: [],
  notifications: [],
  globalLoading: false,
  loadingMessage: undefined,
  theme: "system",
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),

      // Modal actions
      openModal: (component, props) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? `modal-${crypto.randomUUID()}`
            : `modal-${Date.now()}-${performance.now().toString(36).replace(".", "")}`;
        set((state) => ({
          activeModals: [...state.activeModals, { id, component, props }],
        }));
        return id;
      },

      closeModal: (id) =>
        set((state) => ({
          activeModals: state.activeModals.filter((modal) => modal.id !== id),
        })),

      closeAllModals: () => set({ activeModals: [] }),

      // Notification actions
      addNotification: (notification) => {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? `notification-${crypto.randomUUID()}`
            : `notification-${Date.now()}-${performance.now().toString(36).replace(".", "")}`;
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));
        return id;
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // Loading actions
      setGlobalLoading: (loading, message) =>
        set({ globalLoading: loading, loadingMessage: message }),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: "khipu-ui-store",
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Selectors
export const selectIsSidebarOpen = (state: UIStore) => state.isSidebarOpen;
export const selectIsSidebarCollapsed = (state: UIStore) => state.isSidebarCollapsed;
export const selectActiveModals = (state: UIStore) => state.activeModals;
export const selectNotifications = (state: UIStore) => state.notifications;
export const selectGlobalLoading = (state: UIStore) => ({
  loading: state.globalLoading,
  message: state.loadingMessage,
});
export const selectTheme = (state: UIStore) => state.theme;
