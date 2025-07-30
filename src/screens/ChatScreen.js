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

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io('http://10.0.0.160:3001');
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
  }, [userId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://10.0.0.160:3001/api/conversations/${userId}`, {
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

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
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
        </View>
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
}); 