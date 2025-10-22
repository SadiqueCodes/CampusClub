import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components';
import { theme } from '../theme';
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
    <TouchableOpacity onPress={() => navigation.navigate('ChatDetail', { chatId: item.id })}>
      <Card style={styles.chatCard}>
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
            <Text style={styles.chatMessage} numberOfLines={1}>
              {item.lastMessage.senderId === currentUser?.id ? 'You: ' : `${item.lastMessage.senderName}: `}
              {item.lastMessage.text}
            </Text>
            {item.type === 'direct' && item.marketplaceItemId && (
              <Text style={styles.chatTag}>Marketplace</Text>
            )}
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={20} color="#2D3436" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: theme.colors.background.chat,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatList: {
    padding: theme.spacing.lg,
  },
  chatCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIcon: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FF9B9B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  chatTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.dark,
  },
  chatTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.darkGrey,
  },
  chatMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.darkGrey,
    marginBottom: theme.spacing.xs,
  },
  chatTag: {
    fontSize: theme.fontSize.xs,
    color: '#FF9B9B',
    fontWeight: theme.fontWeight.semibold,
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FF9B9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
});
