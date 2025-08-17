import supabase from '../config/supabase';

export class SupabaseService {
  // User management - Use backend API instead of direct Supabase
  static async login(username, password) {
    try {
      // Call the backend login endpoint instead of direct Supabase
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getUsers(currentUserId) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUserId);

      if (error) throw error;
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Conversation management
  static async getOrCreateConversation(user1Id, user2Id) {
    try {
      // Try to find existing conversation
      let { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If conversation doesn't exist, create it
      if (!conversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            user1_id: user1Id,
            user2_id: user2Id
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConversation;
      }

      return conversation;
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Message management
  static async getMessages(user1Id, user2Id) {
    try {
      const conversation = await this.getOrCreateConversation(user1Id, user2Id);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async sendMessage(senderId, receiverId, text) {
    try {
      const conversation = await this.getOrCreateConversation(senderId, receiverId);
      
      const messageData = {
        conversation_id: conversation.id,
        sender_id: senderId,
        text: text,
        timestamp: new Date().toISOString()
      };

      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Tone preferences
  static async setTonePreference(userId, targetUserId, tone) {
    try {
      const { error } = await supabase
        .from('tone_preferences')
        .upsert({
          user_id: userId,
          target_user_id: targetUserId,
          tone: tone,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error setting tone preference:', error);
      throw error;
    }
  }

  static async getTonePreference(userId, targetUserId) {
    try {
      const { data: preference, error } = await supabase
        .from('tone_preferences')
        .select('tone')
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return preference?.tone || null;
    } catch (error) {
      console.error('Error getting tone preference:', error);
      throw error;
    }
  }

  // Real-time subscriptions
  static subscribeToMessages(user1Id, user2Id, callback) {
    return supabase
      .channel(`messages:${user1Id}-${user2Id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${user1Id}-${user2Id}`
      }, callback)
      .subscribe();
  }

  static subscribeToTonePreferences(userId, callback) {
    return supabase
      .channel(`tone_preferences:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tone_preferences',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  static unsubscribe(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}

export default SupabaseService;
