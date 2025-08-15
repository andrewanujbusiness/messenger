require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;
const JWT_SECRET = 'your-secret-key';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key'; // Set this in environment variables

app.use(cors());
app.use(express.json());

// In-memory data storage
const users = [
  {
    id: '1',
    username: 'alice',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Alice Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    status: 'Hey there! I am using iMessage Clone'
  },
  {
    id: '2',
    username: 'bob',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Bob Smith',
    avatar: 'https://i.pravatar.cc/150?img=2',
    status: 'Available'
  },
  {
    id: '3',
    username: 'charlie',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Charlie Brown',
    avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'In a meeting'
  }
];

// Demo conversations with fake messages
const conversations = {
  '1-2': [
    { id: '1', senderId: '1', text: 'Hey Bob! How are you doing?', timestamp: Date.now() - 3600000 },
    { id: '2', senderId: '2', text: 'Hi Alice! I\'m doing great, thanks for asking. How about you?', timestamp: Date.now() - 3500000 },
    { id: '3', senderId: '1', text: 'Pretty good! Are you free for coffee this weekend?', timestamp: Date.now() - 3400000 },
    { id: '4', senderId: '2', text: 'Absolutely! Saturday at 2 PM works for me.', timestamp: Date.now() - 3300000 }
  ],
  '1-3': [
    { id: '5', senderId: '1', text: 'Charlie, did you finish the project?', timestamp: Date.now() - 7200000 },
    { id: '6', senderId: '3', text: 'Almost done! Should be ready by tomorrow.', timestamp: Date.now() - 7100000 },
    { id: '7', senderId: '1', text: 'Perfect! Looking forward to seeing it.', timestamp: Date.now() - 7000000 }
  ],
  '2-3': [
    { id: '8', senderId: '2', text: 'Charlie, want to grab lunch?', timestamp: Date.now() - 1800000 },
    { id: '9', senderId: '3', text: 'Sure! What do you have in mind?', timestamp: Date.now() - 1700000 },
    { id: '10', senderId: '2', text: 'How about that new pizza place downtown?', timestamp: Date.now() - 1600000 },
    { id: '11', senderId: '3', text: 'Sounds great! See you there at noon.', timestamp: Date.now() - 1500000 }
  ]
};

// Tone preferences storage
const tonePreferences = {};

// Fake responses for auto-reply
const fakeResponses = {
  '1': [
    'That sounds great!',
    'I\'ll get back to you soon.',
    'Thanks for letting me know!',
    'Can\'t wait to catch up!',
    'Sounds like a plan!'
  ],
  '2': [
    'Absolutely!',
    'I\'m on it!',
    'That works for me.',
    'Great idea!',
    'Looking forward to it!'
  ],
  '3': [
    'Perfect timing!',
    'I\'ll check on that.',
    'Thanks for the update!',
    'That sounds good to me.',
    'I\'ll see you soon!'
  ]
};

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

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, avatar: user.avatar } });
});

app.get('/api/users', authenticateToken, (req, res) => {
  const otherUsers = users.filter(user => user.id !== req.user.id);
  res.json(otherUsers);
});

app.get('/api/conversations/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  
  const conversationKey = [currentUserId, userId].sort().join('-');
  const messages = conversations[conversationKey] || [];
  
  res.json(messages);
});

// Set tone preference for a specific user
app.post('/api/tone-preference', authenticateToken, (req, res) => {
  const { targetUserId, tone } = req.body;
  const currentUserId = req.user.id;
  
  console.log(`🎛️ [Tone Preference] User ${currentUserId} setting tone preference for user ${targetUserId} to: ${tone}`);
  
  const preferenceKey = `${currentUserId}-${targetUserId}`;
  tonePreferences[preferenceKey] = tone;
  
  console.log(`✅ [Tone Preference] Tone preference saved: ${preferenceKey} = ${tone}`);
  
  res.json({ success: true, tone });
});

// Get tone preference for a specific user
app.get('/api/tone-preference/:targetUserId', authenticateToken, (req, res) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user.id;
  
  const preferenceKey = `${currentUserId}-${targetUserId}`;
  const tone = tonePreferences[preferenceKey] || null;
  
  res.json({ tone });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', async (data) => {
    const { senderId, receiverId, text } = data;
    const conversationKey = [senderId, receiverId].sort().join('-');
    
    const newMessage = {
      id: uuidv4(),
      senderId,
      text,
      timestamp: Date.now()
    };

    // Check if receiver has tone preference for this sender
    const preferenceKey = `${receiverId}-${senderId}`;
    const tonePreference = tonePreferences[preferenceKey];
    
    console.log(`🎯 [Tone] Checking tone preference for receiver ${receiverId} from sender ${senderId}`);
    console.log(`🎯 [Tone] Tone preference found: ${tonePreference || 'none'}`);
    
    let adjustedMessage = newMessage;
    
    if (tonePreference) {
      console.log(`🔄 [Tone] Applying tone adjustment: ${tonePreference}`);
      try {
        const adjustedText = await adjustMessageTone(text, tonePreference);
        adjustedMessage = {
          ...newMessage,
          text: adjustedText,
          originalText: text, // Keep original for reference
          toneApplied: tonePreference
        };
        console.log(`✅ [Tone] Tone adjustment applied successfully`);
      } catch (error) {
        console.error('❌ [Tone] Error adjusting message tone:', error);
        // Continue with original message if tone adjustment fails
      }
    } else {
      console.log(`⏭️ [Tone] No tone preference, using original message`);
    }

    // Add message to conversation
    if (!conversations[conversationKey]) {
      conversations[conversationKey] = [];
    }
    conversations[conversationKey].push(adjustedMessage);

    // Send message to receiver
    socket.to(receiverId).emit('receive_message', adjustedMessage);
    
    // Send confirmation to sender
    socket.emit('message_sent', newMessage);

    // Simulate fake response after 2-5 seconds
    setTimeout(async () => {
      let fakeResponse = {
        id: uuidv4(),
        senderId: receiverId,
        text: fakeResponses[receiverId][Math.floor(Math.random() * fakeResponses[receiverId].length)],
        timestamp: Date.now()
      };

      // Check if sender has tone preference for receiver
      const senderPreferenceKey = `${senderId}-${receiverId}`;
      const senderTonePreference = tonePreferences[senderPreferenceKey];
      
      console.log(`🎯 [Fake Response] Checking tone preference for sender ${senderId} from receiver ${receiverId}`);
      console.log(`🎯 [Fake Response] Tone preference found: ${senderTonePreference || 'none'}`);
      
      if (senderTonePreference) {
        console.log(`🔄 [Fake Response] Applying tone adjustment: ${senderTonePreference}`);
        try {
          const adjustedText = await adjustMessageTone(fakeResponse.text, senderTonePreference);
          fakeResponse = {
            ...fakeResponse,
            text: adjustedText,
            originalText: fakeResponse.text,
            toneApplied: senderTonePreference
          };
          console.log(`✅ [Fake Response] Tone adjustment applied successfully`);
        } catch (error) {
          console.error('❌ [Fake Response] Error adjusting fake response tone:', error);
        }
      } else {
        console.log(`⏭️ [Fake Response] No tone preference, using original fake response`);
      }

      if (!conversations[conversationKey]) {
        conversations[conversationKey] = [];
      }
      conversations[conversationKey].push(fakeResponse);

      // Send fake response to sender
      socket.emit('receive_message', fakeResponse);
    }, 2000 + Math.random() * 3000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Check OpenAI API key status
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key') {
    console.log(`✅ OpenAI API key is configured`);
  } else {
    console.log(`⚠️  OpenAI API key is not configured - tone features will not work`);
    console.log(`   Set OPENAI_API_KEY environment variable to enable tone adjustment`);
  }
  
  console.log('\n=== DEMO CREDENTIALS ===');
  console.log('Username: alice, Password: password');
  console.log('Username: bob, Password: password');
  console.log('Username: charlie, Password: password');
  console.log('========================\n');
}); 