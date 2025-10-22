import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Chat } from '../types';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { chats, currentUser, setChats } = useStore();

  useEffect(() => {
    if (chats.length === 0 && currentUser) {
      // Mock chats
      setChats([
        {
          id: 'chat1',
          type: 'group',
          name: 'Art Appreciation Club',
          participantIds: [currentUser.id, '2', '3'],
          lastMessage: {
            id: '1',
            chatId: 'chat1',
            senderId: '2',
            senderName: 'Sarah',
            text: "Let's meet at 5pm tomorrow!",
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
          },
          lastMessageTime: new Date(Date.now() - 2 * 60 * 1000),
          unreadCount: 0,
          clubId: '1',
        },
        {
          id: 'chat2',
          type: 'group',
          name: 'Coding Enthusiasts',
          participantIds: [currentUser.id, '3'],
          lastMessage: {
            id: '2',
            chatId: 'chat2',
            senderId: '3',
            senderName: 'Mike',
            text: 'Check out this new framework',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
          },
          lastMessageTime: new Date(Date.now() - 15 * 60 * 1000),
          unreadCount: 2,
          clubId: '2',
        },
        {
          id: 'chat3',
          type: 'direct',
          participantIds: [currentUser.id, '4'],
          lastMessage: {
            id: '3',
            chatId: 'chat3',
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: 'Is the camera still available?',
            timestamp: new Date(Date.now() - 60 * 60 * 1000),
          },
          lastMessageTime: new Date(Date.now() - 60 * 60 * 1000),
          unreadCount: 0,
          marketplaceItemId: '1',
        },
      ]);
    }
  }, []);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatIcon}>
          <Ionicons
            name={item.type === 'group' ? 'people' : 'person'}
            size={24}
            color="#fff"
          />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatTitleRow}>
            <Text style={styles.chatTitle}>
              {item.type === 'group' ? item.name : 'John Doe'}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>
          <Text style={styles.chatMessage} numberOfLines={2}>
            {item.lastMessage.senderId === currentUser?.id ? 'You: ' : `${item.lastMessage.senderName}: `}
            {item.lastMessage.text}
          </Text>
          {item.type === 'direct' && item.marketplaceItemId && (
            <View style={styles.chatTagContainer}>
              <Text style={styles.chatTag}>Marketplace</Text>
            </View>
          )}
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E372A1', '#CE678A', '#B06579']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatList: {
    padding: 20,
    paddingBottom: 100,
  },
  chatCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E372A1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chatMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  chatTagContainer: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  chatTag: {
    fontSize: 11,
    color: '#E372A1',
    fontWeight: '700',
    backgroundColor: '#FFF5F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E372A1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
