import { create } from 'zustand';
import { User, Club, Event, MarketplaceItem, Chat, Message, JoinRequest } from '../types';
import supabase from '../lib/supabase';
import secureStore from '../lib/secureStore';

// Runtime map of active realtime subscriptions by chatId
const _realtimeSubscriptions = new Map<string, any>();

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  authInitializing: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (profile: Partial<User> & { email: string }) => Promise<void>;
  signIn: (opts: { email: string; password: string }) => Promise<void>;
  // Send magic-link (passwordless)
  signInWithMagicLink: (email: string) => Promise<any>;
  signUp: (profile: Partial<User> & { email: string; password: string }) => Promise<void>;
  initializeAuth: () => Promise<void>;
  logout: () => void;

  // Clubs
  clubs: Club[];
  myClubs: Club[];
  setClubs: (clubs: Club[]) => void;
  addClub: (club: Club) => void;
  updateClub: (clubId: string, updates: Partial<Club>) => void;

  // Events
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  toggleEventInterest: (eventId: string, userId: string) => void;

  // Marketplace
  marketplaceItems: MarketplaceItem[];
  myListings: MarketplaceItem[];
  setMarketplaceItems: (items: MarketplaceItem[]) => void;
  addMarketplaceItem: (item: MarketplaceItem) => void;
  updateMarketplaceItem: (itemId: string, updates: Partial<MarketplaceItem>) => void;

  // Chats
  chats: Chat[];
  messages: Record<string, Message[]>;
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  // Realtime subscription control
  subscribeToChatMessages: (chatId: string) => void;
  unsubscribeFromChatMessages: (chatId: string) => void;
  unsubscribeAllRealtime: () => void;
  resendMessage: (chatId: string, messageId: string) => Promise<void>;
  getMessagesForChat: (chatId: string) => Message[];
  fetchMessagesForChat: (chatId: string) => Promise<void>;
  // Optimistic send with retry/backoff
  sendMessage: (chatId: string, text: string) => Promise<void>;

  // Fetch helpers (async)
  fetchClubs: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchMarketplace: () => Promise<void>;
  fetchChats: () => Promise<void>;
  fetchJoinRequests: () => Promise<void>;
  fetchInitialData: () => Promise<void>;

  // Join Requests
  joinRequests: JoinRequest[];
  setJoinRequests: (requests: JoinRequest[]) => void;
  addJoinRequest: (request: JoinRequest) => void;
  updateJoinRequest: (requestId: string, updates: Partial<JoinRequest>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth state
  currentUser: null,
  isAuthenticated: false,
  authInitializing: true,

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  // legacy login kept for compatibility
  login: async (profile) => {
    if ((profile as any).password) {
      await get().signIn({ email: profile.email, password: (profile as any).password });
      return;
    }
    // If no password provided, attempt passwordless sign-in (magic link)
    await get().signInWithMagicLink(profile.email);
    // session will be established after user clicks the magic link — do not set a mock user here
  },

  signIn: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const session = (data as any).session;
      if (session) {
        await secureStore.setItem('supabase_session', JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }));
      }

      const uid = (data as any).user?.id;
      if (uid) {
        const { data: profileRow, error: pErr } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (!pErr && profileRow) {
          set({ currentUser: profileRow as unknown as User, isAuthenticated: true });
          return;
        }
      }

      const { data: userInfo } = await supabase.auth.getUser();
      if (userInfo?.user) {
        const uid = userInfo.user.id;
        // Ensure a profile row exists in the database for this user. If missing, create a minimal profile
        try {
          const minimal = {
            id: uid,
            name: userInfo.user.user_metadata?.name || 'Student',
            email: userInfo.user.email || email,
            college_id: '',
            college_name: '',
            major: '',
            year: 'Freshman',
          } as any;
          await supabase.from('profiles').upsert(minimal);
          const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', uid).single();
          if (profileRow) {
            set({ currentUser: profileRow as unknown as User, isAuthenticated: true });
            return;
          }
        } catch (e) {
          console.warn('ensure profile upsert failed', e);
        }
        // Fallback to a minimal in-memory user if DB is unreachable, but keep this lightweight (not a dev mock)
        set({ currentUser: { id: userInfo.user.id, name: userInfo.user.user_metadata?.name || 'Student', email: userInfo.user.email || email, collegeId: '', collegeName: '', major: '', year: 'Freshman', interests: [], clubsJoined: [], clubsLeading: [], eventsAttended: 0, rating: 0, totalTransactions: 0 } as User, isAuthenticated: true });
      }
    } catch (err: any) {
      console.error('signIn error', err.message || err);
      throw err;
    }
  },

  // Send magic link (email OTP) for passwordless sign-in
  // Uses an app deep-link redirect so the mobile app can capture the callback.
  signInWithMagicLink: async (email: string) => {
    try {
      const redirectTo = process.env.MAGIC_LINK_REDIRECT || 'campusclub://auth-callback';
      // supabase.auth.signInWithOtp supports an `options.redirectTo` to set the deep link
      const { data, error } = await supabase.auth.signInWithOtp({ email, options: { redirectTo } as any } as any);
      if (error) throw error;
      // Supabase returns a message; no session until user clicks link in email
      return data;
    } catch (err: any) {
      console.error('signInWithMagicLink error', err.message || err);
      throw err;
    }
  },

  signUp: async (profile) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email: profile.email, password: profile.password!, options: { data: { name: profile.name } } });
      if (error) throw error;

      const uid = (data as any).user?.id;
      const session = (data as any).session;
      if (session) {
        await secureStore.setItem('supabase_session', JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }));
      }

      if (uid) {
        const newProfile = {
          id: uid,
          name: profile.name || '',
          email: profile.email,
          college_id: profile.collegeId || '',
          college_name: profile.collegeName || '',
          major: profile.major || '',
        } as any;
        await supabase.from('profiles').upsert(newProfile);
        const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (profileRow) {
          set({ currentUser: profileRow as unknown as User, isAuthenticated: true });
          return;
        }
      }
      set({ currentUser: null, isAuthenticated: false });
    } catch (err: any) {
      console.error('signUp error', err.message || err);
      throw err;
    }
  },

  initializeAuth: async () => {
    set({ authInitializing: true });
    try {
      const saved = await secureStore.getItem('supabase_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const { access_token, refresh_token } = parsed;
          if (access_token && refresh_token) {
            // @ts-ignore - supabase types may differ; setSession exists in runtime
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        } catch (e) {
          console.warn('Failed to parse saved session', e);
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (uid) {
        const { data: profileRow, error: pErr } = await supabase.from('profiles').select('*').eq('id', uid).single();
        if (!pErr && profileRow) {
          set({ currentUser: profileRow as unknown as User, isAuthenticated: true });
        } else if (userData.user) {
          // Try to create a minimal profile row if missing
          try {
            const uid = userData.user.id;
            const minimal = {
              id: uid,
              name: userData.user.user_metadata?.name || 'Student',
              email: userData.user.email || '',
              college_id: '',
              college_name: '',
              major: '',
              year: 'Freshman',
            } as any;
            await supabase.from('profiles').upsert(minimal);
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', uid).single();
            if (newProfile) {
              set({ currentUser: newProfile as unknown as User, isAuthenticated: true });
            } else {
              set({ currentUser: null, isAuthenticated: true });
            }
          } catch (e) {
            console.warn('initializeAuth: upsert profile failed', e);
            set({ currentUser: null, isAuthenticated: true });
          }
        }
      }

  supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        try {
          if (session?.access_token && session?.refresh_token) {
            await secureStore.setItem('supabase_session', JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }));
          } else {
            await secureStore.deleteItem('supabase_session');
          }
          if (event === 'SIGNED_OUT') {
            set({ currentUser: null, isAuthenticated: false });
          }
        } catch (e) {
          console.warn('onAuthStateChange handler error', e);
        }
      });
    } catch (e) {
      console.warn('initializeAuth error', e);
    } finally {
      set({ authInitializing: false });
      if (get().isAuthenticated) {
        get().fetchInitialData();
      }
    }
  },

  logout: () => {
    (async () => {
      try {
        // Unsubscribe from realtime channels before signing out
        try {
          (get() as any).unsubscribeAllRealtime();
        } catch (e) {
          console.warn('unsubscribeAllRealtime on logout failed', e);
        }
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('signOut error', e);
      }
      await secureStore.deleteItem('supabase_session');
      set({ currentUser: null, isAuthenticated: false });
    })();
  },

  // Clubs state
  clubs: [],
  get myClubs() {
    const state = get();
    return state.clubs.filter((club) =>
      club.memberIds.includes(state.currentUser?.id || '')
    );
  },

  setClubs: (clubs) => set({ clubs }),

  fetchClubs: async () => {
    try {
      const { data, error } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ clubs: (data as Club[]) || [] });
    } catch (err) {
      console.error('fetchClubs error', err);
    }
  },

  addClub: (club) =>
    set((state) => ({
      clubs: [...state.clubs, club],
    })),

  updateClub: (clubId, updates) =>
    set((state) => ({
      clubs: state.clubs.map((c) => (c.id === clubId ? { ...c, ...updates } : c)),
    })),

  // Events state
  events: [],

  setEvents: (events) => set({ events }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  fetchEvents: async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) throw error;
      set({ events: (data as Event[]) || [] });
    } catch (err) {
      console.error('fetchEvents error', err);
    }
  },

  updateEvent: (eventId, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    })),

  toggleEventInterest: (eventId, userId) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id === eventId) {
          const isInterested = e.interestedUserIds.includes(userId);
          return {
            ...e,
            interestedUserIds: isInterested
              ? e.interestedUserIds.filter((id) => id !== userId)
              : [...e.interestedUserIds, userId],
            interestedCount: isInterested ? e.interestedCount - 1 : e.interestedCount + 1,
          };
        }
        return e;
      }),
    })),

  // Marketplace state
  marketplaceItems: [],
  myListings: [],

  setMarketplaceItems: (items) => set({ marketplaceItems: items }),

  fetchMarketplace: async () => {
    try {
      const { data, error } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ marketplaceItems: (data as MarketplaceItem[]) || [] });
    } catch (err) {
      console.error('fetchMarketplace error', err);
    }
  },

  addMarketplaceItem: (item) =>
    set((state) => ({
      marketplaceItems: [...state.marketplaceItems, item],
      myListings: [...state.myListings, item],
    })),

  updateMarketplaceItem: (itemId, updates) =>
    set((state) => ({
      marketplaceItems: state.marketplaceItems.map((i) =>
        i.id === itemId ? { ...i, ...updates } : i
      ),
      myListings: state.myListings.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
    })),

  // Chats state
  chats: [],
  messages: {},

  setChats: (chats) => set({ chats }),

  fetchChats: async () => {
    try {
      const userId = get().currentUser?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participant_ids', [userId])
        .order('last_message_time', { ascending: false });
      if (error) throw error;
      const chats = (data as Chat[]) || [];
      set({ chats });
    } catch (err) {
      console.error('fetchChats error', err);
    }
  },

  addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),

  // Realtime subscription helpers
  subscribeToChatMessages: (chatId: string) => {
    try {
      if (!chatId) return;
      // Only subscribe to DB-backed chats (UUIDs) — skip local-only chat ids like "chat_..."
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(chatId)) return;
      if (_realtimeSubscriptions.has(chatId)) return; // already subscribed

      const channelName = `messages:chat:${chatId}`;

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
          (payload: any) => {
            try {
              const m = payload.new;
              if (!m) return;
              const normalized = {
                id: m.id,
                chatId: m.chat_id || chatId,
                senderId: m.sender_id || m.senderId,
                senderName: m.sender_name || m.senderName,
                text: m.text,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                attachments: m.attachments || null,
              } as Message;
              // Add message to store
              get().addMessage(chatId, normalized);
            } catch (e) {
              console.warn('realtime message handler error', e);
            }
          }
        )
        .subscribe();

      _realtimeSubscriptions.set(chatId, channel);
    } catch (e) {
      console.warn('subscribeToChatMessages error', e);
    }
  },

  unsubscribeFromChatMessages: (chatId: string) => {
    try {
      const channel = _realtimeSubscriptions.get(chatId);
      if (!channel) return;
      // supabase-js v2 exposes removeChannel; also attempt unsubscribe
      try {
        // @ts-ignore
        if (supabase.removeChannel) supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
      try {
        channel.unsubscribe?.();
      } catch (e) {
        // ignore
      }
      _realtimeSubscriptions.delete(chatId);
    } catch (e) {
      console.warn('unsubscribeFromChatMessages error', e);
    }
  },

  unsubscribeAllRealtime: () => {
    try {
      Array.from(_realtimeSubscriptions.keys()).forEach((chatId) => {
        try {
          const channel = _realtimeSubscriptions.get(chatId);
          if (!channel) return;
          try {
            // @ts-ignore
            if (supabase.removeChannel) supabase.removeChannel(channel);
          } catch (e) {}
          try {
            channel.unsubscribe?.();
          } catch (e) {}
        } catch (e) {
          // ignore per-channel errors
        }
        _realtimeSubscriptions.delete(chatId);
      });
    } catch (e) {
      console.warn('unsubscribeAllRealtime error', e);
    }
  },

  // Remove all realtime subscriptions on logout or when needed
  resendMessage: async (chatId: string, messageId: string) => {
    try {
      const state = get();
      const list = state.messages[chatId] || [];
      const msg = list.find((m) => m.id === messageId || m.tempId === messageId);
      if (!msg) return;
      // Remove the failed message from the list first
      set((s) => ({ messages: { ...s.messages, [chatId]: (s.messages[chatId] || []).filter((m) => m.id !== messageId && m.tempId !== messageId) } }));
      // Re-send using sendMessage; this will create a new pending message and retry logic
      await (get() as any).sendMessage(chatId, msg.text);
    } catch (e) {
      console.warn('resendMessage error', e);
    }
  },

  updateChat: (chatId, updates) =>
    set((state) => ({ chats: state.chats.map((c) => (c.id === chatId ? { ...c, ...updates } : c)) })),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
      chats: state.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessage: message,
              lastMessageTime: message.timestamp,
            }
          : c
      ),
    })),

  updateMessage: (chatId, messageId, updates) =>
    set((state) => {
      const list = state.messages[chatId] || [];
      const newList = list.map((m) => {
        if (m.id === messageId || m.tempId === messageId) {
          return { ...m, ...updates } as Message;
        }
        return m;
      });
      return { messages: { ...state.messages, [chatId]: newList } };
    }),

  getMessagesForChat: (chatId) => get().messages[chatId] || [],

  fetchMessagesForChat: async (chatId) => {
    try {
      // Only query Supabase if chatId looks like a UUID created in the DB.
      // Some chats are client-only (e.g. id like "chat_123456...") and won't exist in Postgres.
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(chatId)) {
        // Nothing to fetch from server for non-UUID chat IDs (local-only chats)
        return;
      }
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      // Normalize timestamps to Date objects
      const normalized = (data as any[])
        .map((m) => ({
          ...m,
          id: m.id,
          chatId: m.chat_id || m.chatId || chatId,
          senderId: m.sender_id || m.senderId,
          senderName: m.sender_name || m.senderName,
          text: m.text,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          attachments: m.attachments || m.attachments,
        })) || [];
      set((state) => ({ messages: { ...state.messages, [chatId]: normalized as Message[] } }));
    } catch (err) {
      console.error('fetchMessagesForChat error', err);
    }
  },

  // Optimistic send with retry/backoff
  sendMessage: async (chatId, text) => {
    const MAX_RETRIES = 4;
    const currentUser = get().currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingMessage: Message = {
      id: tempId,
      tempId,
      chatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      timestamp: new Date(),
      status: 'pending',
    };

    // Add optimistically
    get().addMessage(chatId, pendingMessage);

    const attemptSend = async (attempt = 0) => {
      try {
  const api = await import('../lib/api');
  // Use smart poster which falls back to direct Supabase insert when backend not configured
  const res = await api.postMessageSmart(chatId, text);
        // server returns { data: created }
        const created = (res as any).data || res;
        const createdMsg: Message = {
          id: created.id,
          chatId: created.chat_id || created.chatId || chatId,
          senderId: created.sender_id || created.senderId || currentUser.id,
          senderName: created.sender_name || created.senderName || currentUser.name,
          text: created.text,
          timestamp: created.timestamp ? new Date(created.timestamp) : new Date(),
          attachments: created.attachments || undefined,
          status: 'sent',
        };

        // Replace pending message with the server message (match by tempId)
        set((state) => {
          const list = state.messages[chatId] || [];
          const newList = list.map((m) => (m.tempId === tempId || m.id === tempId ? createdMsg : m));
          const newChats = state.chats.map((c) => (c.id === chatId ? { ...c, lastMessage: createdMsg, lastMessageTime: createdMsg.timestamp } : c));
          return { messages: { ...state.messages, [chatId]: newList }, chats: newChats };
        });
        return;
      } catch (err) {
        console.warn(`sendMessage attempt ${attempt} failed`, err);
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // exponential backoff
          setTimeout(() => attemptSend(attempt + 1), delay);
          return;
        }

        // mark as failed
        get().updateMessage(chatId, tempId, { status: 'failed' });
      }
    };

    // Start attempts
    attemptSend(0);
  },

  // Join Requests state
  joinRequests: [],

  setJoinRequests: (requests) => set({ joinRequests: requests }),

  fetchJoinRequests: async () => {
    try {
      const userId = get().currentUser?.id;
      if (!userId) return;
      const { data, error } = await supabase.from('join_requests').select('*').or(`user_id.eq.${userId}`);
      if (error) throw error;
      set({ joinRequests: (data as JoinRequest[]) || [] });
    } catch (err) {
      console.error('fetchJoinRequests error', err);
    }
  },

  fetchInitialData: async () => {
    try {
      await Promise.all([get().fetchClubs(), get().fetchEvents(), get().fetchMarketplace()]);
      if (get().currentUser) {
        await Promise.all([get().fetchChats(), get().fetchJoinRequests()]);
      }
    } catch (err) {
      console.error('fetchInitialData error', err);
    }
  },

  addJoinRequest: (request) =>
    set((state) => ({ joinRequests: [...state.joinRequests, request] })),

  updateJoinRequest: (requestId, updates) =>
    set((state) => ({
      joinRequests: state.joinRequests.map((r) =>
        r.id === requestId ? { ...r, ...updates } : r
      ),
    })),
}));
