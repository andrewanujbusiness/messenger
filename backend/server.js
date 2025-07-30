const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', (data) => {
    const { senderId, receiverId, text } = data;
    const conversationKey = [senderId, receiverId].sort().join('-');
    
    const newMessage = {
      id: uuidv4(),
      senderId,
      text,
      timestamp: Date.now()
    };

    // Add message to conversation
    if (!conversations[conversationKey]) {
      conversations[conversationKey] = [];
    }
    conversations[conversationKey].push(newMessage);

    // Send message to receiver
    socket.to(receiverId).emit('receive_message', newMessage);
    
    // Send confirmation to sender
    socket.emit('message_sent', newMessage);

    // Simulate fake response after 2-5 seconds
    setTimeout(() => {
      const fakeResponse = {
        id: uuidv4(),
        senderId: receiverId,
        text: fakeResponses[receiverId][Math.floor(Math.random() * fakeResponses[receiverId].length)],
        timestamp: Date.now()
      };

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
  console.log(`Server running on port ${PORT}`);
  console.log('\n=== DEMO CREDENTIALS ===');
  console.log('Username: alice, Password: password');
  console.log('Username: bob, Password: password');
  console.log('Username: charlie, Password: password');
  console.log('========================\n');
}); 