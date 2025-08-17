require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors());
app.use(express.json());

// OpenAI integration for tone adjustment
const adjustMessageTone = async (message, tone) => {
  console.log(`🤖 [OpenAI] Starting tone adjustment for tone: "${tone}"`);
  console.log(`📝 [OpenAI] Original message: "${message}"`);
  
  try {
    const tonePrompts = {
      'warmer': 'Make this message sound warmer, friendlier, and more inviting while keeping the same meaning:',
      'profanity-free': 'Remove any profanity or inappropriate language from this message while keeping the meaning intact:',
      'formal': 'Convert this message to a more formal, professional tone while keeping the same meaning:',
      'simplified': 'Simplify this message to use clearer, more straightforward language while keeping the same meaning:',
      'concise': 'Make this message more concise and direct while keeping the essential information:'
    };

    const prompt = `${tonePrompts[tone]} "${message}"`;
    console.log(`🔧 [OpenAI] Using prompt: "${prompt}"`);

    console.log(`🚀 [OpenAI] Making API call to OpenAI...`);
    const startTime = Date.now();
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that adjusts message tone. Respond only with the adjusted message, nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const adjustedMessage = response.data.choices[0].message.content.trim();
    
    console.log(`✅ [OpenAI] API call successful! Response time: ${responseTime}ms`);
    console.log(`📤 [OpenAI] Adjusted message: "${adjustedMessage}"`);
    console.log(`💰 [OpenAI] Tokens used: ${response.data.usage?.total_tokens || 'unknown'}`);
    
    return adjustedMessage;
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ [OpenAI] API call failed after ${endTime - Date.now()}ms`);
    console.error(`🔍 [OpenAI] Error details:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? 'Present' : 'Missing'
      }
    });
    
    if (error.response?.status === 401) {
      console.error(`🔑 [OpenAI] Authentication failed - check your API key`);
    } else if (error.response?.status === 429) {
      console.error(`⏰ [OpenAI] Rate limit exceeded - too many requests`);
    } else if (error.response?.status === 500) {
      console.error(`🔧 [OpenAI] OpenAI server error`);
    }
    
    console.log(`🔄 [OpenAI] Returning original message due to API failure`);
    return message; // Return original message if API fails
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Helper function to get or create conversation
const getOrCreateConversation = async (user1Id, user2Id) => {
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
};

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        avatar: user.avatar 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', req.user.id);

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/conversations/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    // Get or create conversation
    const conversation = await getOrCreateConversation(currentUserId, userId);
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set tone preference for a specific user
app.post('/api/tone-preference', authenticateToken, async (req, res) => {
  const { targetUserId, tone } = req.body;
  const currentUserId = req.user.id;
  
  try {
    const { error } = await supabase
      .from('tone_preferences')
      .upsert({
        user_id: currentUserId,
        target_user_id: targetUserId,
        tone: tone,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving tone preference:', error);
      return res.status(500).json({ error: 'Failed to save tone preference' });
    }

    res.json({ success: true, tone });
  } catch (error) {
    console.error('Error saving tone preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tone preference for a specific user
app.get('/api/tone-preference/:targetUserId', authenticateToken, async (req, res) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user.id;
  
  try {
    const { data: preference, error } = await supabase
      .from('tone_preferences')
      .select('tone')
      .eq('user_id', currentUserId)
      .eq('target_user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching tone preference:', error);
      return res.status(500).json({ error: 'Failed to fetch tone preference' });
    }

    res.json({ tone: preference?.tone || null });
  } catch (error) {
    console.error('Error fetching tone preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message endpoint (for non-real-time fallback)
app.post('/api/messages', authenticateToken, async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user.id;
  
  try {
    // Get or create conversation
    const conversation = await getOrCreateConversation(senderId, receiverId);
    
    // Check if receiver has tone preference for this sender
    const { data: preference } = await supabase
      .from('tone_preferences')
      .select('tone')
      .eq('user_id', receiverId)
      .eq('target_user_id', senderId)
      .single();

    let adjustedText = text;
    let toneApplied = null;

    if (preference?.tone) {
      try {
        adjustedText = await adjustMessageTone(text, preference.tone);
        toneApplied = preference.tone;
      } catch (error) {
        console.error('Error adjusting message tone:', error);
        // Continue with original message if tone adjustment fails
      }
    }

    const newMessage = {
      conversation_id: conversation.id,
      sender_id: senderId,
      text: adjustedText,
      original_text: toneApplied ? text : null,
      tone_applied: toneApplied,
      timestamp: new Date().toISOString()
    };

    const { data: message, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase-based server running on port ${PORT}`);
  
  // Check OpenAI API key status
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key') {
    console.log(`✅ OpenAI API key is configured`);
  } else {
    console.log(`⚠️  OpenAI API key is not configured - tone features will not work`);
    console.log(`   Set OPENAI_API_KEY environment variable to enable tone adjustment`);
  }
  
  console.log('\n=== SUPABASE INTEGRATION ===');
  console.log('✅ Supabase client initialized');
  console.log('✅ Real-time subscriptions enabled');
  console.log('✅ Conversations table support added');
  console.log('========================\n');
});
