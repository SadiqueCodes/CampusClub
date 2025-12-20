# CampusClub

A social platform for college students to connect with peers from their college, create/join clubs, attend events, and buy/sell items.

## Features

### 🏠 Home Screen
- **Top Clubs Carousel**: Browse popular clubs from your college
- **Events Section**: View upcoming club events
- **Marketplace**: Buy and sell items with other students

### ➕ Create Club
- **Club Creation**: Create clubs with name, type, and description
- **Tinder-style Member Invitation**: Swipe right to invite, left to pass
- **Club Management**: Add members anytime, manage events

### 💬 Chat
- **Group Chats**: Automatically created for each club
- **Direct Messages**: Chat with marketplace sellers
- **Real-time Messaging**: Stay connected with your community

### 👤 Profile
- **User Stats**: Track clubs joined, events attended, items listed
- **Club Overview**: See all clubs you're part of (with leader badges)
- **Marketplace Listings**: Manage your active and sold items

## Design System

### Color Palette - "Funky Moody Vibe"

- **Home**: Deep Forest Green (#1B4D3E) + Neon Lime accents
- **Create**: Bright Chartreuse Yellow (#F7DC6F) + Deep Indigo
- **Chat**: Pastel Baby Blue (#A8D8EA) + White
- **Profile**: Deep Royal Blue (#1E3A8A) + Neon Lime accents
- **Auth**: Bright Lime Green (#BFFF00)

### Design Characteristics
- Bold, monochromatic backgrounds per screen
- High contrast with white text
- Flat, modern aesthetic
- Smooth animations and transitions
- Card-based layouts with elevated shadows

## Tech Stack

- **Framework**: Expo + React Native
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: Zustand
- **Animations**: React Native Reanimated + Gesture Handler
- **UI Components**: Custom component library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Connecting to Supabase (frontend)

To use a real backend instead of the bundled mock data, configure Supabase for the frontend:

1. Install the Supabase JS client in the project root:

```bash
cd /Users/Sadique/CampusClub
npm install @supabase/supabase-js
```

2. Add your Supabase anon key and URL to the app environment. Copy `.env.example` to `.env` and set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

For Expo, you can inject these as runtime config or use a library to load env vars during bundling. Keep anon keys out of public repos.

3. The app includes a Supabase wrapper at `src/lib/supabase.ts` and the store has async fetch helpers (`fetchInitialData`, `fetchClubs`, `fetchEvents`, etc.). On app launch, `HomeScreen` calls `fetchInitialData` so live data is loaded.

Security reminder: never commit service_role keys to the frontend. Use the backend (server) for privileged operations.

### Using Expo Go

1. Install Expo Go on your mobile device
2. Run `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

## Project Structure

```
CampusClub/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── SwipeCard.tsx
│   ├── screens/          # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CreateClubScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/       # Navigation configuration
│   │   └── TabNavigator.tsx
│   ├── store/           # State management
│   │   └── index.ts
│   ├── theme/           # Theme & styling
│   │   ├── colors.ts
│   │   └── index.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── utils/           # Utility functions
├── assets/              # Images, fonts, etc.
├── App.tsx             # App entry point
└── package.json
```

## Key Features Implementation

### Authentication
- College email and ID verification
- Mock authentication (ready for backend integration)

### Club System
- Create clubs with type categorization
- Swipe-based member invitation
- Automatic group chat creation
- Leader management capabilities

### Events
- Club leaders can create events
- Event details with location, date, time
- Interest tracking

### Marketplace
- Post items with images, description, price
- Direct messaging with sellers
- Transaction history

### Chat
- Group chats for clubs
- Direct messages for marketplace
- Message timestamps
- Unread indicators

## State Management

The app uses Zustand for global state management:

- **Auth State**: User authentication and session
- **Clubs**: Club data and user memberships
- **Events**: Event listings and interests
- **Marketplace**: Item listings and transactions
- **Chats**: Messages and conversations

## Future Enhancements

- [ ] Real backend API integration
- [ ] Push notifications
- [ ] Image upload for profiles and marketplace
- [ ] Event RSVP and attendance tracking
- [ ] Club discovery and search
- [ ] Advanced chat features (typing indicators, read receipts)
- [ ] Payment integration for marketplace
- [ ] User verification system
- [ ] Reporting and moderation tools

## Development Notes

### Mock Data
The app currently uses mock data for demonstration. In production:
- Replace mock login with actual API calls
- Implement real-time database for chats
- Add image storage service
- Integrate payment gateway

### Type Safety
All components and functions are fully typed with TypeScript for better development experience and fewer runtime errors.

### Performance
- Optimized FlatLists for large datasets
- Memoized components where appropriate
- Efficient state updates with Zustand

## License

MIT

## Contact

For issues or questions, please open an issue on the repository.
