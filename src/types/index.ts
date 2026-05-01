export interface User {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  collegeName: string;
  major: string;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior';
  semester: string;
  profilePhoto?: string;
  interests: string[];
  clubsJoined: string[];
  clubsLeading: string[];
  eventsAttended: number;
  rating: number;
  totalTransactions: number;
}

export interface Club {
  id: string;
  name: string;
  type: ClubType;
  description: string;
  leaderId: string;
  leaderName: string;
  memberIds: string[];
  memberCount: number;
  createdAt: Date;
  groupChatId: string;
  logo?: string; // Club logo/icon uploaded by user
  logoEmoji?: string; // Emoji fallback for club branding
  coverPhoto?: string;
  upcomingEvents: number;
}

export type ClubType = 'Academic' | 'Sports' | 'Arts & Culture' | 'Technology' | 'Social' | 'Custom';

export interface Event {
  id: string;
  title: string;
  description: string;
  clubId: string;
  clubName: string;
  date: Date;
  time: string;
  location: string;
  bannerImage?: string;
  interestedUserIds: string[];
  interestedCount: number;
  registeredUserIds: string[];
  registeredCount: number;
  createdBy: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerMajor: string;
  sellerYear: string;
  sellerRating: number;
  status: 'active' | 'sold' | 'reserved';
  createdAt: Date;
}

export interface Chat {
  id: string;
  type: 'group' | 'direct';
  name?: string; // For group chats
  participantIds: string[];
  lastMessage: Message;
  lastMessageTime: Date;
  unreadCount: number;
  clubId?: string; // For club group chats
  marketplaceItemId?: string; // For marketplace chats
  avatarEmoji?: string;
  avatarImage?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  attachments?: string[];
  // Optional delivery status for optimistic UI and reconciliation
  status?: 'pending' | 'sent' | 'failed';
  // Temporary client id used before server assigns a permanent id
  tempId?: string;
}

export interface JoinRequest {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  initiatedBy: 'user' | 'leader';
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}

export interface SwipeProfile {
  user: User;
  swipeDirection?: 'left' | 'right';
}
