import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Role } from '@/types/domain';

const KEY = '@lukita/dev-session';

export interface DevSession {
  role: Role;
  firstName: string;
  lastName: string;
  username: string;
  imageUrl: string;
}

interface DevState {
  loaded: boolean;
  session: DevSession | null;
  load(): Promise<void>;
  signIn(s: DevSession): Promise<void>;
  patch(p: Partial<DevSession>): Promise<void>;
  signOut(): Promise<void>;
}

export const DEV_PRESETS: Record<Role, DevSession> = {
  admin: { role: 'admin', firstName: 'Ada', lastName: 'Admin', username: 'ada.admin', imageUrl: 'https://api.dicebear.com/9.x/notionists/png?seed=Ada&size=256&backgroundColor=ffb81c' },
  moderator: { role: 'moderator', firstName: 'Mora', lastName: 'Moderadora', username: 'mora', imageUrl: 'https://api.dicebear.com/9.x/notionists/png?seed=Mora&size=256&backgroundColor=e6e3ff' },
  partner: { role: 'partner', firstName: 'Pablo', lastName: 'Partner', username: 'pablo.partner', imageUrl: 'https://api.dicebear.com/9.x/notionists/png?seed=Pablo&size=256&backgroundColor=d8f5ea' },
  user: { role: 'user', firstName: 'Uma', lastName: 'Usuaria', username: 'uma', imageUrl: 'https://api.dicebear.com/9.x/notionists/png?seed=Uma&size=256&backgroundColor=ddebff' },
};

export const useDevStore = create<DevState>((set, get) => ({
  loaded: false,
  session: null,
  async load() {
    if (get().loaded) return;
    const session = await storage.get<DevSession | null>(KEY, null);
    set({ loaded: true, session });
  },
  async signIn(session) {
    await storage.set(KEY, session);
    set({ session });
  },
  async patch(p) {
    const session = { ...get().session!, ...p };
    await storage.set(KEY, session);
    set({ session });
  },
  async signOut() {
    await storage.remove(KEY);
    set({ session: null });
  },
}));
