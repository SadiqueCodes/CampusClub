import { create } from 'zustand';
import { User, Club, Event, MarketplaceItem, Chat, Message, JoinRequest } from '../types';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, collegeId: string) => Promise<void>;
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
  updateJoinRequest: (requestId: string, status: 'accepted' | 'rejected') => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth state
  currentUser: null,
  isAuthenticated: false,

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  login: async (email: string, collegeId: string) => {
    // Mock login - in production, this would call an API
    const mockUser: User = {
      id: '1',
      name: 'Alex Thompson',
      email,
      collegeId,
      collegeName: 'Tech University',
      major: 'Computer Science',
      year: 'Junior',
      interests: ['Technology', 'Art', 'Music'],
      clubsJoined: [],
      clubsLeading: [],
      eventsAttended: 0,
      rating: 0,
      totalTransactions: 0,
    };
    set({ currentUser: mockUser, isAuthenticated: true });
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),

  // Clubs state
  clubs: [],
  myClubs: [],

  setClubs: (clubs) => set({ clubs }),

  addClub: (club) =>
    set((state) => ({
      clubs: [...state.clubs, club],
      myClubs: [...state.myClubs, club],
    })),

  updateClub: (clubId, updates) =>
    set((state) => ({
      clubs: state.clubs.map((c) => (c.id === clubId ? { ...c, ...updates } : c)),
      myClubs: state.myClubs.map((c) => (c.id === clubId ? { ...c, ...updates } : c)),
    })),

  // Events state
  events: [],

  setEvents: (events) => set({ events }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

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

  updateJoinRequest: (requestId, status) =>
    set((state) => ({
      joinRequests: state.joinRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
    })),
}));
