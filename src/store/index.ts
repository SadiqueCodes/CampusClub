import { create } from 'zustand';
import { User, Club, Event, MarketplaceItem, Chat, Message, JoinRequest } from '../types';
import supabase from '../lib/supabase';
import secureStore from '../lib/secureStore';
import { notifyJoinRequest, notifiedJoinRequestIds } from '../utils/notifications';
import { uploadImageToSupabase } from '../lib/storage';

// Runtime map of active realtime subscriptions by chatId
const _realtimeSubscriptions = new Map<string, any>();
let marketplaceChannel: any = null;

const normalizeEventRow = (row: any): Event => ({
  id: row.id?.toString() || row.id || '',
  title: row.title || '',
  description: row.description || '',
  clubId: row.club_id || row.clubId || '',
  clubName: row.club_name || row.clubName || '',
  date: row.date ? new Date(row.date) : new Date(),
  time: row.time || '',
  location: row.location || '',
  bannerImage: row.banner_image || row.bannerImage || undefined,
  interestedUserIds: row.interested_user_ids || row.interestedUserIds || [],
  interestedCount: row.interested_count ?? row.interestedCount ?? 0,
  createdBy: row.created_by || row.createdBy || '',
});

const normalizeJoinRequestRow = (row: any): JoinRequest => ({
  id: row.id?.toString() || row.id || '',
  clubId: row.club_id || row.clubId || '',
  userId: row.user_id || row.userId || '',
  userName: row.user_name || row.userName || '',
  userPhoto: row.user_photo || row.userPhoto || undefined,
  initiatedBy: row.initiated_by || row.initiatedBy || 'user',
  status: row.status || 'pending',
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  respondedAt: row.responded_at ? new Date(row.responded_at) : row.respondedAt ? new Date(row.respondedAt) : undefined,
});

const normalizeMarketplaceRow = (row: any): MarketplaceItem => ({
  id: row.id?.toString() || row.id || '',
  title: row.title || '',
  description: row.description || '',
  price: Number(row.price) || 0,
  images: row.images || [],
  sellerId: row.seller_id || row.sellerId || '',
  sellerName: row.seller_name || row.sellerName || '',
  sellerMajor: row.seller_major || row.sellerMajor || '',
  sellerYear: row.seller_year || row.sellerYear || '',
  sellerRating: row.seller_rating ?? row.sellerRating ?? 0,
  status: row.status || 'active',
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
});

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
  addMemberToClub: (clubId: string, userId: string) => Promise<void>;

  // Events
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  createEvent: (payload: {
    title: string;
    description: string;
    clubId: string;
    clubName: string;
    date: Date;
    time: string;
    location: string;
    bannerImage?: string | null;
  }) => Promise<Event>;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  toggleEventInterest: (eventId: string, userId: string) => void;

  // Marketplace
  marketplaceItems: MarketplaceItem[];
  myListings: MarketplaceItem[];
  setMarketplaceItems: (items: MarketplaceItem[]) => void;
  addMarketplaceItem: (item: MarketplaceItem) => void;
  updateMarketplaceItem: (itemId: string, updates: Partial<MarketplaceItem>) => void;
  createMarketplaceItem: (item: {
    title: string;
    description: string;
    price: number;
    imageUris?: string[];
  }) => Promise<MarketplaceItem>;
  subscribeToMarketplace: () => void;
  unsubscribeFromMarketplace: () => void;

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
  createJoinRequest: (request: Omit<JoinRequest, 'id' | 'respondedAt'> & { id?: string }) => Promise<JoinRequest>;
  updateJoinRequest: (requestId: string, updates: Partial<JoinRequest>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => {
  const maybeNotifyJoinRequests = (requestsInput: JoinRequest | JoinRequest[]) => {
    const requests = Array.isArray(requestsInput) ? requestsInput : [requestsInput];
    const userId = get().currentUser?.id;
    if (!userId) return;
    const clubs = get().clubs;
    const leaderClubIds = new Set(clubs.filter((club) => club.leaderId === userId).map((club) => club.id));

    requests.forEach((request) => {
      if (request.status !== 'pending' || notifiedJoinRequestIds.has(request.id)) return;
      const club = clubs.find((c) => c.id === request.clubId);
      const clubName = club?.name || 'your club';
      const leaderShouldNotify = request.initiatedBy === 'user' && leaderClubIds.has(request.clubId);
      const userShouldNotify = request.initiatedBy === 'leader' && request.userId === userId;
      if (leaderShouldNotify) {
        notifyJoinRequest('New club application', `${request.userName} applied to ${clubName}`, request.id);
      } else if (userShouldNotify) {
        notifyJoinRequest('Club invitation', `${clubName} invited you to join`, request.id);
      }
    });
  };

  return {
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
        try {
          (get() as any).unsubscribeFromMarketplace();
        } catch (e) {
          console.warn('unsubscribeFromMarketplace on logout failed', e);
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

  addMemberToClub: async (clubId, userId) => {
    const state = get();
    const club = state.clubs.find((c) => c.id === clubId);
    if (!club) return;
    if (club.memberIds.includes(userId)) return;

    const updatedMembers = [...club.memberIds, userId];
    const updatedClub = { ...club, memberIds: updatedMembers, memberCount: updatedMembers.length };
    set((s) => ({
      clubs: s.clubs.map((c) => (c.id === clubId ? updatedClub : c)),
    }));

    try {
      await supabase
        .from('clubs')
        .update({ member_ids: updatedMembers, member_count: updatedMembers.length })
        .eq('id', clubId);
    } catch (err) {
      console.error('addMemberToClub supabase update failed', err);
    }
  },

  // Events state
  events: [],

  setEvents: (events) => set({ events }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  createEvent: async (payload) => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const eventToInsert = {
      title: payload.title,
      description: payload.description,
      club_id: payload.clubId,
      club_name: payload.clubName,
      date: payload.date.toISOString(),
      time: payload.time,
      location: payload.location,
      banner_image: payload.bannerImage || null,
      interested_user_ids: [],
      interested_count: 0,
      created_by: currentUser.id,
    };

    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventToInsert)
        .select('*')
        .single();
      if (error) throw error;

      const normalized = normalizeEventRow(data);
      set((state) => ({ events: [...state.events, normalized] }));
      return normalized;
    } catch (err) {
      console.error('createEvent error', err);
      const fallback: Event = {
        id: `local_event_${Date.now()}`,
        title: payload.title,
        description: payload.description,
        clubId: payload.clubId,
        clubName: payload.clubName,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        bannerImage: payload.bannerImage || undefined,
        interestedUserIds: [],
        interestedCount: 0,
        createdBy: currentUser.id,
      };
      get().addEvent(fallback);
      return fallback;
    }
  },

  fetchEvents: async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) throw error;
      const normalized = (data || []).map(normalizeEventRow);
      set({ events: normalized });
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
          const interestedList = e.interestedUserIds || [];
          const isInterested = interestedList.includes(userId);
          return {
            ...e,
            interestedUserIds: isInterested
              ? interestedList.filter((id) => id !== userId)
              : [...interestedList, userId],
            interestedCount: Math.max(0, isInterested ? (e.interestedCount || 0) - 1 : (e.interestedCount || 0) + 1),
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
      const normalized = (data || []).map(normalizeMarketplaceRow);
      const currentUserId = get().currentUser?.id;
      set({
        marketplaceItems: normalized,
        myListings: currentUserId ? normalized.filter((item) => item.sellerId === currentUserId) : [],
      });
      get().subscribeToMarketplace();
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

  createMarketplaceItem: async ({ title, description, price, imageUris = [] }: { title: string; description: string; price: number; imageUris?: string[] }) => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    let uploadedImageUrls: string[] = [];
    if (imageUris.length > 0) {
      try {
        uploadedImageUrls = await Promise.all(
          imageUris.map((uri) => uploadImageToSupabase(uri, `marketplace/${currentUser.id}`))
        );
      } catch (error) {
        console.warn('Image upload failed; continuing without images', error);
      }
    }

    const imageSources = uploadedImageUrls.length > 0 ? uploadedImageUrls : imageUris;

    const payload = {
      title,
      description,
      price,
      images: imageSources,
      seller_id: currentUser.id,
      seller_name: currentUser.name,
      seller_major: currentUser.major,
      seller_year: currentUser.year,
      seller_rating: currentUser.rating || 0,
      status: 'active',
    };

    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      const normalized = normalizeMarketplaceRow(data);
      set((state) => ({
        marketplaceItems: [normalized, ...state.marketplaceItems],
        myListings: normalized.sellerId === currentUser.id ? [normalized, ...state.myListings] : state.myListings,
      }));
      return normalized;
    } catch (err) {
      console.error('createMarketplaceItem error', err);
      const fallback: MarketplaceItem = {
        id: `local_market_${Date.now()}`,
        title,
        description,
        price,
        images: imageSources,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerMajor: currentUser.major,
        sellerYear: currentUser.year,
        sellerRating: currentUser.rating || 0,
        status: 'active',
        createdAt: new Date(),
      };
      set((state) => ({
        marketplaceItems: [fallback, ...state.marketplaceItems],
        myListings: [fallback, ...state.myListings],
      }));
      return fallback;
    }
  },

  subscribeToMarketplace: () => {
    try {
      if (marketplaceChannel) return;
      marketplaceChannel = supabase
        .channel('public:marketplace_items')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'marketplace_items' },
          (payload: any) => {
            const normalized = normalizeMarketplaceRow(payload.new);
            set((state) => {
              const upsert = (list: MarketplaceItem[]) => {
                const idx = list.findIndex((item) => item.id === normalized.id);
                if (idx >= 0) {
                  const next = [...list];
                  next[idx] = normalized;
                  return next;
                }
                return [...list, normalized];
              };
              const updatedListings =
                normalized.sellerId === state.currentUser?.id
                  ? upsert(state.myListings)
                  : state.myListings.filter((item) => item.id !== normalized.id);
              return {
                marketplaceItems: upsert(state.marketplaceItems),
                myListings: updatedListings,
              };
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'marketplace_items' },
          (payload: any) => {
            const normalized = normalizeMarketplaceRow(payload.new);
            set((state) => ({
              marketplaceItems: state.marketplaceItems.map((item) =>
                item.id === normalized.id ? normalized : item
              ),
              myListings:
                normalized.sellerId === state.currentUser?.id
                  ? state.myListings.map((item) => (item.id === normalized.id ? normalized : item))
                  : state.myListings.filter((item) => item.id !== normalized.id),
            }));
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'marketplace_items' },
          (payload: any) => {
            const id = payload.old?.id?.toString() || payload.old?.id;
            if (!id) return;
            set((state) => ({
              marketplaceItems: state.marketplaceItems.filter((item) => item.id !== id),
              myListings: state.myListings.filter((item) => item.id !== id),
            }));
          }
        )
        .subscribe();
    } catch (err) {
      console.error('subscribeToMarketplace error', err);
    }
  },

  unsubscribeFromMarketplace: () => {
    try {
      if (marketplaceChannel) {
        marketplaceChannel.unsubscribe?.();
        // @ts-ignore
        if (supabase.removeChannel) {
          // @ts-ignore
          supabase.removeChannel(marketplaceChannel);
        }
      }
    } catch (err) {
      console.warn('unsubscribeFromMarketplace error', err);
    } finally {
      marketplaceChannel = null;
    }
  },

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

      const merged = new Map<string, any>();

      const { data: myRequests, error: myError } = await supabase
        .from('join_requests')
        .select('*')
        .eq('user_id', userId);
      if (myError) throw myError;
      (myRequests || []).forEach((row) => merged.set((row as any).id, row));

      const leaderClubIds = get()
        .clubs.filter((club) => club.leaderId === userId)
        .map((club) => club.id);
      if (leaderClubIds.length > 0) {
        const { data: leaderRequests, error: leaderError } = await supabase
          .from('join_requests')
          .select('*')
          .in('club_id', leaderClubIds);
        if (leaderError) throw leaderError;
        (leaderRequests || []).forEach((row) => merged.set((row as any).id, row));
      }

      const normalized = Array.from(merged.values()).map(normalizeJoinRequestRow);
      set({ joinRequests: normalized });
      maybeNotifyJoinRequests(normalized);
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

  createJoinRequest: async (request) => {
    const payload = {
      club_id: request.clubId,
      user_id: request.userId,
      user_name: request.userName,
      user_photo: request.userPhoto || null,
      initiated_by: request.initiatedBy,
      status: request.status,
      created_at: (request.createdAt || new Date()).toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('join_requests')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      const normalized = normalizeJoinRequestRow(data);
      set((state) => ({ joinRequests: [...state.joinRequests, normalized] }));
      maybeNotifyJoinRequests(normalized);
      return normalized;
    } catch (err) {
      console.error('createJoinRequest error', err);
      const fallback: JoinRequest = {
        ...request,
        id: request.id || `local_join_${Date.now()}`,
        createdAt: request.createdAt || new Date(),
      };
      set((state) => ({ joinRequests: [...state.joinRequests, fallback] }));
      maybeNotifyJoinRequests(fallback);
      return fallback;
    }
  },

  updateJoinRequest: async (requestId, updates) => {
    const dbUpdates: Record<string, any> = {};
    if (typeof updates.status !== 'undefined') {
      dbUpdates.status = updates.status;
    }
    if (updates.respondedAt) {
      dbUpdates.responded_at = updates.respondedAt.toISOString();
    }
    if (updates.initiatedBy) {
      dbUpdates.initiated_by = updates.initiatedBy;
    }
    if (typeof updates.userName !== 'undefined') {
      dbUpdates.user_name = updates.userName;
    }
    if (typeof updates.userPhoto !== 'undefined') {
      dbUpdates.user_photo = updates.userPhoto;
    }

    try {
      if (Object.keys(dbUpdates).length > 0) {
        const { data, error } = await supabase
          .from('join_requests')
          .update(dbUpdates)
          .eq('id', requestId)
          .select('*')
          .single();
        if (error) throw error;
        const normalized = normalizeJoinRequestRow(data);
        set((state) => ({
          joinRequests: state.joinRequests.map((r) => (r.id === requestId ? normalized : r)),
        }));
        return;
      }
      // nothing to persist, but ensure state is updated
      set((state) => ({
        joinRequests: state.joinRequests.map((r) =>
          r.id === requestId ? { ...r, ...updates } : r
        ),
      }));
    } catch (err) {
      console.error('updateJoinRequest error', err);
      set((state) => ({
        joinRequests: state.joinRequests.map((r) =>
          r.id === requestId ? { ...r, ...updates } : r
        ),
      }));
    }
  },
  };
});
