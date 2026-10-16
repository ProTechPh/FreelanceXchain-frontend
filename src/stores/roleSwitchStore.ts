import { create } from 'zustand';
import type { ParticipantRole } from '@/lib/role-switch';

interface RoleSwitchState {
  /**
   * Role the user just switched to while the app navigates to its dashboard.
   * Lets the dashboard guard show a spinner instead of a "wrong role" screen
   * for the page being left.
   */
  pendingRole: ParticipantRole | null;
  setPendingRole: (role: ParticipantRole | null) => void;
}

export const useRoleSwitchStore = create<RoleSwitchState>((set) => ({
  pendingRole: null,
  setPendingRole: (pendingRole) => set({ pendingRole }),
}));
