import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, SOCKET_URL } from '../config/api';
import ToneSelector from '../components/ToneSelector';

// Import TONES from ToneSelector component
const TONES = [
  {
    id: 'warmer',
    name: 'Warmer',
    description: 'Makes messages friendlier and more inviting',
    icon: 'heart',
  },
  {
    id: 'profanity-free',
    name: 'Profanity-Free',
    description: 'Removes or replaces inappropriate language',
    icon: 'shield-checkmark',
  },
  {
    id: 'formal',
    name: 'More Formal',
    description: 'Adjusts to professional tone',
    icon: 'business',
  },
  {
    id: 'simplified',
    name: 'Simplified / Clearer',
    description: 'Rephrases complex language into plain English',
    icon: 'chatbubble-ellipses',
  },
  {
    id: 'concise',
    name: 'Concise / Brief',
    description: 'Shortens messages to be more direct',
    icon: 'time',
  },
];

export default function ChatScreen({ route, navigation }) {
  const { userId, userName, userAvatar } = route.params;
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const flatListRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardSlideAnim = useRef(new Animated.Value(0)).current;
  const [selectedTone, setSelectedTone] = useState(null);
  const [showToneSelector, setShowToneSelector] = useState(false);
  // Track which messages are showing original vs adjusted text
  const [messageDisplayStates, setMessageDisplayStates] = useState({});

  const handleScrollBeginDrag = () => {
    // Smoothly slide keyboard down when user starts scrolling
    if (isKeyboardVisible) {
      Animated.timing(keyboardSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Keyboard.dismiss();
      });
    }
  };

  const handleScroll = (event) => {
    const { velocity } = event.nativeEvent;
    // If scrolling up with significant velocity, slide keyboard down
    if (velocity && velocity.y < -0.5 && isKeyboardVisible) {
      Animated.timing(keyboardSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        Keyboard.dismiss();
      });
    }
  };

  const handleToneSelect = async (tone) => {
    setSelectedTone(tone);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tone-preference`, {
        targetUserId: userId,
        tone: tone?.id || null
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Tone preference saved:', response.data);
    } catch (error) {
      console.error('Error saving tone preference:', error);
    }
  };

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join user's room
    newSocket.emit('join', user.id);

    // Listen for incoming messages
    newSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for message confirmation
    newSocket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user.id]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      Animated.timing(keyboardSlideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      Animated.timing(keyboardSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [keyboardSlideAnim]);

  useEffect(() => {
    fetchMessages();
    loadTonePreference();
  }, [userId]);

  const loadTonePreference = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tone-preference/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.tone) {
        // Find the tone object from the TONES array
        const tone = TONES.find(t => t.id === response.data.tone);
        setSelectedTone(tone);
      }
    } catch (error) {
      console.error('Error loading tone preference:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/conversations/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: user.id,
      receiverId: userId,
      text: newMessage.trim(),
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const handleMessageTap = (messageId) => {
    setMessageDisplayStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    const hasToneAdjustment = item.originalText && item.toneApplied;
    const isShowingOriginal = messageDisplayStates[item.id];
    
    // Determine which text to display
    let displayText = item.text;
    let isToneAdjusted = false;
    
    if (hasToneAdjustment && !isOwnMessage) {
      // For received messages with tone adjustment, show adjusted by default
      displayText = isShowingOriginal ? item.originalText : item.text;
      isToneAdjusted = true;
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <TouchableOpacity
          onPress={() => hasToneAdjustment && !isOwnMessage ? handleMessageTap(item.id) : null}
          activeOpacity={hasToneAdjustment && !isOwnMessage ? 0.7 : 1}
          disabled={!hasToneAdjustment || isOwnMessage}
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            hasToneAdjustment && !isOwnMessage && styles.tappableMessageBubble
          ]}
        >
          {/* Tone adjustment indicator */}
          {hasToneAdjustment && !isOwnMessage && (
            <View style={styles.messageToneIndicator}>
              {!isShowingOriginal && (
                <Ionicons 
                  name={TONES.find(t => t.id === item.toneApplied)?.icon || 'options'} 
                  size={12} 
                  color="#007AFF" 
                />
              )}
              <Text style={styles.messageToneIndicatorText}>
                {isShowingOriginal ? 'Original' : TONES.find(t => t.id === item.toneApplied)?.name}
              </Text>
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {displayText}
          </Text>
          

          
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSeparator = () => <View style={styles.messageSeparator} />;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tone indicator */}
      {selectedTone && (
        <View style={styles.toneIndicator}>
          <Ionicons name={selectedTone.icon} size={16} color="#007AFF" />
          <Text style={styles.toneIndicatorText}>{selectedTone.name} mode</Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        style={styles.messagesContainer}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <Animated.View
        style={[
          styles.keyboardView,
          {
            transform: [{
              translateY: keyboardSlideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -300], // Adjust based on keyboard height
              })
            }]
          }
        ]}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.toneButton}
            onPress={() => setShowToneSelector(true)}
          >
            <Ionicons 
              name={selectedTone ? selectedTone.icon : "options"} 
              size={20} 
              color={selectedTone ? "#007AFF" : "#8E8E93"} 
            />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="iMessage"
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={newMessage.trim() ? 'white' : '#C7C7CC'} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <ToneSelector
        visible={showToneSelector}
        onClose={() => setShowToneSelector(false)}
        onSelectTone={handleToneSelect}
        currentTone={selectedTone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  keyboardView: {
    backgroundColor: '#F2F2F7',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 2,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 0,
    paddingBottom: 0,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  messageSeparator: {
    height: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#C6C6C8',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 36,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 20,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  toneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toneIndicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  toneButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },


  // Tone indicator within individual messages
  messageToneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  messageToneIndicatorText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  tappableMessageBubble: {
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
}); 