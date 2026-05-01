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
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Message } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uploadImageToSupabase } from '../lib/storage';
import supabase from '../lib/supabase';
import api, { isBackendConfigured } from '../lib/api';

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
    fetchChats,
    fetchClubs,
    clubs,
    updateClub,
    events,
    sendMessage,
    joinRequests,
  } = useStore();

  const [messageText, setMessageText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuPosition, setAttachMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [viewerImageUri, setViewerImageUri] = useState<string | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [pendingDescription, setPendingDescription] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const messageInputRef = useRef<TextInput>(null);
  const moreButtonRef = useRef<any>(null);
  const attachButtonRef = useRef<any>(null);

  const chat = chats.find((c) => c.id === chatId);
  const club = chat?.clubId ? clubs.find((c) => c.id === chat.clubId) : undefined;
  const isGroupChat = !!(chat && (chat.type === 'group' || chat.clubId));
  const members = useMemo(() => club?.memberIds || chat?.participantIds || [], [club, chat]);
  const senderNamesById = useMemo(() => {
    const out: Record<string, string> = {};
    (messages || []).forEach((message) => {
      if (message.senderId && message.senderName && message.senderId !== 'system') {
        out[message.senderId] = message.senderName;
      }
    });
    return out;
  }, [messages]);
  const joinRequestNamesById = useMemo(() => {
    const out: Record<string, string> = {};
    if (!club?.id) return out;
    joinRequests
      .filter((request) => request.clubId === club.id && !!request.userId && !!request.userName)
      .forEach((request) => {
        out[request.userId] = request.userName;
      });
    return out;
  }, [joinRequests, club?.id]);
  const clubEvents = useMemo(() => (club ? events.filter((event) => event.clubId === club.id) : []), [events, club?.id]);
  const isLeader = !!(club && currentUser && club.leaderId === currentUser.id);

  useEffect(() => {
    if (chat && !pendingName) {
      setPendingName(chat.name || '');
    }
  }, [chat]);

  useEffect(() => {
    if (!isGroupChat || members.length === 0) {
      setMemberNames({});
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', members as string[]);
        if (error) throw error;
        const next: Record<string, string> = {};
        (data || []).forEach((row: any) => {
          if (row?.id) next[row.id] = row.name || '';
        });
        setMemberNames(next);
      } catch (e) {
        console.warn('member name lookup failed', e);
      }
    })();
  }, [isGroupChat, members]);

  useEffect(() => {
    if (messages.length > 0) {
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!currentUser?.id) return () => {};

      console.log('[CHAT] Loading messages for chat:', chatId);
      fetchMessagesForChat(chatId);
      fetchChats();
      fetchClubs();

      try {
        console.log('[CHAT] Setting up realtime subscription for chat:', chatId);
        useStore.getState().subscribeToChatMessages(chatId);
      } catch (e) {
        console.warn('[CHAT] subscribeToChatMessages failed', e);
      }

      // Fallback sync while focused.
      // Messages poll faster; heavier chat/club metadata polls less often.
      let tick = 0;
      const interval = setInterval(() => {
        fetchMessagesForChat(chatId);
        tick += 1;
        if (tick % 3 === 0) {
          fetchChats();
          fetchClubs();
        }
      }, 800);

      return () => {
        clearInterval(interval);
        try {
          console.log('[CHAT] Cleaning up realtime subscription for chat:', chatId);
          useStore.getState().unsubscribeFromChatMessages(chatId);
        } catch (e) {
          // ignore
        }
      };
    }, [chatId, currentUser?.id, fetchMessagesForChat, fetchChats, fetchClubs])
  );

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
    // Keyboard-first behavior: if user pastes a media URL, send it as attachment bubble.
    const mediaUrlMatch = bodyText.match(/^https?:\/\/\S+\.(gif|png|jpe?g|webp)(\?\S*)?$/i);
    // Use store's optimistic sender which will add a pending message and handle retries
    (async () => {
      try {
        if (mediaUrlMatch) {
          await sendMessage(chatId, '', [bodyText]);
        } else {
          await sendMessage(chatId, bodyText);
        }
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (err: any) {
        console.error('sendMessage wrapper error', err);
        Alert.alert('Message failed', 'Could not send message. It will be retried automatically.');
      }
    })();
  };

  const sendMediaAttachment = async (uri: string) => {
    if (!currentUser) return;
    try {
      const uploadedUrl = await uploadImageToSupabase(uri, `chat-media/${chatId}/${currentUser.id}`);
      await sendMessage(chatId, '', [uploadedUrl]);
      setShowAttachMenu(false);
      setAttachMenuPosition(null);
    } catch (e) {
      console.warn('media upload/send failed', e);
      Alert.alert('Send failed', 'Could not send media right now. Please try again.');
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      await sendMediaAttachment(result.assets[0].uri);
    }
  };

  const handlePickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.length) {
      await sendMediaAttachment(result.assets[0].uri);
    }
  };

  const isImageUrl = (value: string) => /\.(png|jpe?g|gif|webp)$/i.test(value.split('?')[0] || '');

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
          {!!item.attachments?.length && (
            <View style={styles.attachmentGrid}>
              {item.attachments.map((uri, idx) => (
                <TouchableOpacity key={`${item.id}_att_${idx}`} onPress={() => setViewerImageUri(uri)} activeOpacity={0.9}>
                  {isImageUrl(uri) ? (
                    <Image source={{ uri }} style={styles.messageAttachmentImage} />
                  ) : (
                    <View style={styles.messageAttachmentFallback}>
                      <Ionicons name="document-attach" size={18} color="#111827" />
                      <Text style={styles.messageAttachmentFallbackText}>Attachment</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!!item.text && (
            <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {item.text}
            </Text>
          )}
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
    setShowAttachMenu(false);
    setMenuPosition(null);
    setAttachMenuPosition(null);
  };

  const handleOpenAttachMenu = () => {
    if (!attachButtonRef.current) {
      setShowAttachMenu(true);
      if (isKeyboardVisible) {
        setTimeout(() => messageInputRef.current?.focus(), 0);
      }
      return;
    }
    attachButtonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      setAttachMenuPosition({ x, y, width, height });
      setShowAttachMenu(true);
      if (isKeyboardVisible) {
        setTimeout(() => messageInputRef.current?.focus(), 0);
      }
    });
  };


  const renderMemberName = (memberId: string) => {
    const idSuffix = typeof memberId === 'string' && memberId.length >= 4 ? memberId.slice(-4).toUpperCase() : '';
    if (club?.leaderId === memberId) {
      const leaderLabel =
        memberNames[memberId] ||
        senderNamesById[memberId] ||
        joinRequestNamesById[memberId] ||
        club.leaderName ||
        'Club Lead';
      const suffix = currentUser?.id === memberId ? ' (You - Lead)' : ' (Lead)';
      return `${leaderLabel}${suffix}`;
    }
    if (memberId === currentUser?.id && currentUser) {
      return `${currentUser.name} (You)`;
    }
    return (
      memberNames[memberId] ||
      senderNamesById[memberId] ||
      joinRequestNamesById[memberId] ||
      (idSuffix ? `Member ${idSuffix}` : 'Member')
    );
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
    (async () => {
      try {
        if (isBackendConfigured()) {
          await api.leaveClub(club.id);
          await Promise.all([fetchClubs(), fetchChats()]);
          navigation.goBack();
          return;
        }

        const updatedMembers = club.memberIds.filter((id) => id !== currentUser.id);
        updateClub(club.id, {
          memberIds: updatedMembers,
          memberCount: updatedMembers.length,
        });
        updateChatParticipants(updatedMembers);
        navigation.goBack();
      } catch (e: any) {
        const msg = e instanceof Error ? e.message : String(e || '');
        if (msg.includes('transfer leadership')) {
          Alert.alert('Transfer leadership', 'Assign a new leader before leaving the club.');
          return;
        }
        Alert.alert('Exit failed', 'Could not leave this club right now. Please try again.');
      }
    })();
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
    if (!currentUser) return;
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
      try {
        const publicUrl = await uploadImageToSupabase(uri, `club-avatars/${chat.id}/${currentUser.id}`);
        updateChat(chat.id, { avatarImage: publicUrl, avatarEmoji: undefined });
        if (club) {
          updateClub(club.id, { logo: publicUrl, logoEmoji: undefined });
        }
      } catch (e) {
        console.warn('Group avatar upload failed', e);
        Alert.alert('Upload failed', 'Could not upload image right now. Please try again.');
      }
    }
    setShowAvatarModal(false);
  };

  const actionItems = [
    {
      label: 'View description',
      visible: isGroupChat,
      onPress: () => {
        setShowActions(false);
        setPendingDescription(club?.description || '');
        setIsEditingDescription(false);
        setShowDescriptionModal(true);
      },
    },
    {
      label: 'View members',
      visible: isGroupChat,
      onPress: () => {
        setShowActions(false);
        setShowMembersModal(true);
      },
    },
    {
      label: 'Change club name',
      visible: isGroupChat && isLeader,
      onPress: () => {
        setShowActions(false);
        setShowRenameModal(true);
      },
    },
    {
      label: 'Club events',
      visible: isGroupChat,
      onPress: () => {
        setShowActions(false);
        setShowEventsModal(true);
      },
    },
    {
      label: 'Exit club',
      visible: isGroupChat && !!currentUser,
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
            <Text style={styles.headerTitle}>{isGroupChat ? chat.name : 'Direct Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {isGroupChat ? `${members.length} members` : 'Active now'}
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
        <TouchableOpacity ref={attachButtonRef} style={styles.attachButton} onPress={handleOpenAttachMenu}>
          <Ionicons name="add-circle" size={22} color="#B06579" />
        </TouchableOpacity>
        <TextInput
          ref={messageInputRef}
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

      <Modal visible={showActions} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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

      {showAttachMenu && (
        <>
          <TouchableWithoutFeedback onPress={() => { setShowAttachMenu(false); setAttachMenuPosition(null); }}>
            <View style={styles.clearOverlay} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.attachSheet,
              attachMenuPosition
                ? {
                    top: Math.max(8, attachMenuPosition.y - 80),
                    left: Math.min(
                      Math.max(attachMenuPosition.x + attachMenuPosition.width - 154, 12),
                      SCREEN_WIDTH - 154 - 12
                    ),
                  }
                : { bottom: 24, left: 16 },
            ]}
          >
            <TouchableOpacity style={styles.attachOption} onPress={handlePickFromCamera}>
              <Ionicons name="camera" size={18} color="#B06579" />
              <Text style={styles.attachOptionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachOption} onPress={handlePickFromGallery}>
              <Ionicons name="image" size={18} color="#B06579" />
              <Text style={styles.attachOptionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal visible={!!viewerImageUri} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
        <TouchableWithoutFeedback onPress={() => setViewerImageUri(null)}>
          <View style={styles.fullImageBackdrop}>
            {viewerImageUri && <Image source={{ uri: viewerImageUri }} style={styles.fullImageView} resizeMode="contain" />}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showMembersModal} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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

      <Modal visible={showRenameModal} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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

      <Modal visible={showEventsModal} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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

      <Modal visible={showDescriptionModal} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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

      <Modal visible={showAvatarModal} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  clearOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  attachmentGrid: {
    gap: 8,
    marginBottom: 6,
  },
  messageAttachmentImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  messageAttachmentFallback: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageAttachmentFallbackText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
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
  attachSheet: {
    position: 'absolute',
    width: 154,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  attachOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 7,
  },
  attachOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  mediaPickerModal: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '24%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaGridImage: {
    width: (SCREEN_WIDTH - 32 - 28 - 10) / 2,
    height: 110,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  gifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gifCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  gifSearchInput: {
    marginTop: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  gifLoadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stickerCell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stickerCellText: {
    fontSize: 28,
  },
  fullImageBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  fullImageView: {
    width: '100%',
    height: '100%',
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
    ...StyleSheet.absoluteFillObject,
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

