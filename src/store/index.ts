import { create } from 'zustand';
import { User, Club, Event, MarketplaceItem, Chat, Message, JoinRequest } from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (profile: Partial<User> & { email: string }) => Promise<void>;
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
  addMessage: (chatId: string, message: Message) => void;
  getMessagesForChat: (chatId: string) => Message[];

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

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  login: async (profile) => {
    const existingUser = get().currentUser;
    const mockUser: User = {
      id: existingUser?.id || Date.now().toString(),
      name: profile.name || existingUser?.name || 'Alex Thompson',
      email: profile.email,
      collegeId:
        profile.collegeId ||
        existingUser?.collegeId ||
        `ID-${new Date().getFullYear().toString().slice(-2)}001`,
      collegeName: profile.collegeName || existingUser?.collegeName || 'Tech University',
      major: profile.major || existingUser?.major || 'Computer Science',
      year: profile.year || existingUser?.year || 'Junior',
      interests:
        profile.interests && profile.interests.length > 0
          ? profile.interests
          : existingUser?.interests && existingUser.interests.length > 0
          ? existingUser.interests
          : ['Technology', 'Art', 'Music'],
      clubsJoined: existingUser?.clubsJoined || [],
      clubsLeading: existingUser?.clubsLeading || [],
      eventsAttended: existingUser?.eventsAttended || 0,
      rating: existingUser?.rating || 0,
      totalTransactions: existingUser?.totalTransactions || 0,
      profilePhoto: profile.profilePhoto || existingUser?.profilePhoto,
    };
    set({ currentUser: mockUser, isAuthenticated: true });
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  // Clubs state
  clubs: [],
  get myClubs() {
    const state = get();
    return state.clubs.filter((club) =>
      club.memberIds.includes(state.currentUser?.id || '')
    );
  },

  setClubs: (clubs) => set({ clubs }),

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

  addChat: (chat) => set((state) => ({ chats: [...state.chats, chat] })),

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

  getMessagesForChat: (chatId) => get().messages[chatId] || [],

  // Join Requests state
  joinRequests: [],

  setJoinRequests: (requests) => set({ joinRequests: requests }),

  addJoinRequest: (request) =>
    set((state) => ({ joinRequests: [...state.joinRequests, request] })),

  updateJoinRequest: (requestId, updates) =>
    set((state) => ({
      joinRequests: state.joinRequests.map((r) =>
        r.id === requestId ? { ...r, ...updates } : r
      ),
    })),
}));
