import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Message } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const EMPTY_MESSAGES: Message[] = [];
const emojiOptions = ['👥', '🎨', '💻', '⚽️', '🎭', '🎵', '📚'];

export const ChatDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { chatId } = route.params;
  const insets = useSafeAreaInsets();

  // Subscribe directly to messages for this chat to ensure re-renders on realtime updates
  const messages = useStore((state) => state.messages[chatId] ?? EMPTY_MESSAGES);
  
  const {
    chats,
    currentUser,
    addMessage,
    updateChat,
    fetchMessagesForChat,
    clubs,
    updateClub,
    events,
    sendMessage,
  } = useStore();

  const [messageText, setMessageText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const moreButtonRef = useRef<any>(null);

  const chat = chats.find((c) => c.id === chatId);
  const club = chat?.clubId ? clubs.find((c) => c.id === chat.clubId) : undefined;
  const members = useMemo(() => club?.memberIds || chat?.participantIds || [], [club, chat]);
  const clubEvents = useMemo(() => (club ? events.filter((event) => event.clubId === club.id) : []), [events, club?.id]);
  const isLeader = !!(club && currentUser && club.leaderId === currentUser.id);

  useEffect(() => {
    if (chat && !pendingName) {
      setPendingName(chat.name || '');
    }
  }, [chat]);

  // Log when messages change to verify realtime updates are working
  useEffect(() => {
    console.log('[CHAT-MESSAGES] Updated:', messages.length, 'messages');
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('[CHAT-MESSAGES] Latest:', lastMsg.senderName, '→', lastMsg.text.substring(0, 40));
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Load messages for this chat from backend
    if (currentUser && chat) {
      console.log('[CHAT] Loading messages for chat:', chatId);
      fetchMessagesForChat(chatId);
    }

    // Subscribe to realtime messages for this chat while screen is active
    if (chat) {
      try {
        console.log('[CHAT] Setting up realtime subscription for chat:', chatId);
        useStore.getState().subscribeToChatMessages(chatId);
      } catch (e) {
        console.warn('[CHAT] subscribeToChatMessages failed', e);
      }
    }

    return () => {
      try {
        console.log('[CHAT] Cleaning up realtime subscription for chat:', chatId);
        useStore.getState().unsubscribeFromChatMessages(chatId);
      } catch (e) {
        // ignore
      }
    };
  }, [chatId, currentUser, chat]);

  if (!chat) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Chat not found</Text>
      </View>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !currentUser) return;

    const bodyText = messageText.trim();
    setMessageText('');
    // Use store's optimistic sender which will add a pending message and handle retries
    (async () => {
      try {
        await sendMessage(chatId, bodyText);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err: any) {
        console.error('sendMessage wrapper error', err);
        Alert.alert('Message failed', 'Could not send message. It will be retried automatically.');
      }
    })();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === currentUser?.id;
    const isSystem = item.senderId === 'system';

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
          {!isOwnMessage && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          {isOwnMessage && item.status === 'failed' && (
            <TouchableOpacity 
              style={styles.failedAlertContainer}
              onPress={() => useStore.getState().resendMessage(chatId, item.id)}
            >
              <Ionicons name="alert-circle" size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
          <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const closeAllModals = () => {
    setShowActions(false);
    setShowMembersModal(false);
    setShowRenameModal(false);
    setIsEditingDescription(false);
    setShowDescriptionModal(false);
    setShowEventsModal(false);
    setShowAvatarModal(false);
    setMenuPosition(null);
  };

  const renderMemberName = (memberId: string) => {
    if (club?.leaderId === memberId) {
      const leaderLabel = club.leaderName || 'Club Lead';
      const suffix = currentUser?.id === memberId ? ' (You • Lead)' : ' (Lead)';
      return `${leaderLabel}${suffix}`;
    }
    if (memberId === currentUser?.id && currentUser) {
      return `${currentUser.name} (You)`;
    }
    return `Member ${memberId}`;
  };

  const updateChatParticipants = (updatedMembers: string[]) => {
    updateChat(chat.id, { participantIds: updatedMembers });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!club || club.leaderId === memberId) return;
    const updatedMembers = club.memberIds.filter((id) => id !== memberId);
    updateClub(club.id, {
      memberIds: updatedMembers,
      memberCount: updatedMembers.length,
    });
    updateChatParticipants(updatedMembers);
  };

  const handleExitClub = () => {
    if (!club || !currentUser) return;
    if (club.leaderId === currentUser.id && club.memberIds.length > 1) {
      Alert.alert('Transfer leadership', 'Assign a new leader before leaving the club.');
      return;
    }
    const updatedMembers = club.memberIds.filter((id) => id !== currentUser.id);
    updateClub(club.id, {
      memberIds: updatedMembers,
      memberCount: updatedMembers.length,
    });
    updateChatParticipants(updatedMembers);
    navigation.goBack();
  };

  const handleRenameClub = () => {
    if (!club || !pendingName.trim()) return;
    const name = pendingName.trim();
    updateClub(club.id, { name });
    updateChat(chat.id, { name });
    setShowRenameModal(false);
  };

  const handleUpdateDescription = () => {
    if (!club) return;
    updateClub(club.id, { description: pendingDescription.trim() });
    setIsEditingDescription(false);
    setShowDescriptionModal(false);
  };

  const handleSelectAvatar = (emoji: string) => {
    updateChat(chat.id, { avatarEmoji: emoji, avatarImage: undefined });
    if (club) {
      updateClub(club.id, { logoEmoji: emoji, logo: undefined });
    }
    setShowAvatarModal(false);
  };

  const handleUploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to upload a group image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      updateChat(chat.id, { avatarImage: uri, avatarEmoji: undefined });
      if (club) {
        updateClub(club.id, { logo: uri, logoEmoji: undefined });
      }
    }
    setShowAvatarModal(false);
  };

  const actionItems = [
    {
      label: 'View description',
      visible: chat.type === 'group',
      onPress: () => {
        setShowActions(false);
        setPendingDescription(club?.description || '');
        setIsEditingDescription(false);
        setShowDescriptionModal(true);
      },
    },
    {
      label: 'View members',
      visible: chat.type === 'group',
      onPress: () => {
        setShowActions(false);
        setShowMembersModal(true);
      },
    },
    {
      label: 'Change club name',
      visible: chat.type === 'group' && isLeader,
      onPress: () => {
        setShowActions(false);
        setShowRenameModal(true);
      },
    },
    {
      label: 'Club events',
      visible: chat.type === 'group',
      onPress: () => {
        setShowActions(false);
        setShowEventsModal(true);
      },
    },
    {
      label: 'Exit club',
      visible: chat.type === 'group' && !!currentUser,
      onPress: () => {
        setShowActions(false);
        handleExitClub();
      },
    },
  ].filter((item) => item.visible);

  const shouldUseKeyboardAvoiding = Platform.OS === 'ios';
  const formatEventDate = (date?: Date) =>
    date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  const renderGroupAvatar = () => {
    if (chat.avatarImage) {
      return <Image source={{ uri: chat.avatarImage }} style={styles.groupAvatarImage} />;
    }
    const emoji = chat.avatarEmoji || (chat.name ? chat.name.charAt(0).toUpperCase() : '👥');
    return (
      <View style={styles.groupAvatarCircle}>
        <Text style={styles.groupAvatarEmoji}>{emoji}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={shouldUseKeyboardAvoiding ? 'padding' : 'height'}
      keyboardVerticalOffset={shouldUseKeyboardAvoiding ? insets.top : 0}
    >
      <LinearGradient colors={['#E372A1', '#CE678A', '#B06579']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAvatarModal(true)}>
              {renderGroupAvatar()}
            </TouchableOpacity>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{chat.type === 'group' ? chat.name : 'Direct Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {chat.type === 'group' ? `${chat.participantIds.length} members` : 'Active now'}
            </Text>
          </View>
          <TouchableOpacity
            ref={moreButtonRef}
            style={styles.moreButton}
            onPress={() => {
              if (moreButtonRef.current) {
                moreButtonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                  setMenuPosition({ x, y, width, height });
                  setShowActions(true);
                });
              } else {
                setShowActions(true);
              }
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        extraData={messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: 8 + (insets.bottom > 0 ? insets.bottom - 6 : 0) },
        ]}
      >
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle" size={22} color="#B06579" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, messageText.trim() && styles.sendButtonActive]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={showActions} transparent animationType="fade">
        <TouchableWithoutFeedback
          onPress={() => {
            setShowActions(false);
            setMenuPosition(null);
          }}
        >
          <View style={styles.popoverOverlay} />
        </TouchableWithoutFeedback>
        {menuPosition && (
          <View
            style={[
              styles.popoverMenu,
              {
                top: menuPosition.y + menuPosition.height + 8,
                left: Math.min(
                  Math.max(menuPosition.x + menuPosition.width - 180, 16),
                  SCREEN_WIDTH - 180 - 16
                ),
              },
            ]}
          >
            {actionItems.length === 0 ? (
              <View style={styles.popoverItem}>
                <Text style={styles.popoverItemText}>No actions available</Text>
              </View>
            ) : (
              actionItems.map((action) => (
                <TouchableOpacity key={action.label} style={styles.popoverItem} onPress={action.onPress}>
                  <Text style={styles.popoverItemText}>{action.label}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </Modal>

      <Modal visible={showMembersModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeAllModals}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.membersModal}>
          <Text style={styles.modalTitle}>Members</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {members.map((memberId) => {
              const label = renderMemberName(memberId);
              const initial = label.trim().charAt(0).toUpperCase();
              return (
                <View key={memberId} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{initial}</Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{label}</Text>
                      {club?.leaderId === memberId && <Text style={styles.memberRole}>Club lead</Text>}
                    </View>
                  </View>
                  {isLeader && memberId !== currentUser?.id && memberId !== club?.leaderId && (
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveMember(memberId)}>
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeAllModals}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showRenameModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeAllModals}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.renameModal}>
          <Text style={styles.modalTitle}>Rename club</Text>
          <TextInput
            style={styles.renameInput}
            value={pendingName}
            onChangeText={setPendingName}
            placeholder="Club name"
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.renameActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closeAllModals}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, !pendingName.trim() && styles.primaryButtonDisabled]}
              onPress={handleRenameClub}
              disabled={!pendingName.trim()}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEventsModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeAllModals}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.eventsModal}>
          <Text style={styles.modalTitle}>Club events</Text>
          {clubEvents.length === 0 ? (
            <Text style={styles.emptyEventsText}>No events have been scheduled yet.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {clubEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeAllModals}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showDescriptionModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeAllModals}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.descriptionModal}>
          <Text style={styles.modalTitle}>Club description</Text>
          {isEditingDescription && isLeader ? (
            <TextInput
              style={[styles.renameInput, styles.descriptionInput]}
              value={pendingDescription}
              onChangeText={setPendingDescription}
              placeholder="Tell members about this club"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.descriptionBodyText}>
              {pendingDescription.trim() ? pendingDescription : 'No description yet'}
            </Text>
          )}
          <View style={styles.descriptionActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={closeAllModals}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
            {isLeader && (
              isEditingDescription ? (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !pendingDescription.trim() && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleUpdateDescription}
                  disabled={!pendingDescription.trim()}
                >
                  <Text style={styles.primaryButtonText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setIsEditingDescription(true)}
                >
                  <Text style={styles.primaryButtonText}>Edit</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showAvatarModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeAllModals}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.avatarModal}>
          <Text style={styles.modalTitle}>Choose group icon</Text>
          <View style={styles.emojiGrid}>
            {emojiOptions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiOption}
                onPress={() => handleSelectAvatar(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.emojiOption} onPress={handleUploadAvatar}>
              <Ionicons name="add" size={24} color="#E372A1" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarEmoji: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  groupAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverMenu: {
    position: 'absolute',
    width: 180,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  popoverItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  popoverOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 10,
  },
  ownBubble: {
    backgroundColor: '#E372A1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.9)',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#4B5563',
  },
  errorText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 36,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#E372A1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  membersModal: {
    position: 'absolute',
    top: '20%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E372A1',
  },
  messageStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  failedBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  failedText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  memberName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#E372A1',
    fontWeight: '600',
  },
  renameModal: {
    position: 'absolute',
    top: '28%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  descriptionModal: {
    position: 'absolute',
    top: '25%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  eventsModal: {
    position: 'absolute',
    top: '25%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    marginTop: 12,
  },
  descriptionInput: {
    minHeight: 120,
  },
  descriptionBodyText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 22,
    marginTop: 12,
  },
  descriptionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  eventCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  eventDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyEventsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  avatarModal: {
    position: 'absolute',
    top: '28%',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  emojiOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#FDF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiText: {
    fontSize: 26,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E372A1',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  failedAlertContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
});
