# iMessage Clone - React Native App

A beautiful React Native iMessage clone with real-time messaging, user authentication, and fake response functionality for demo purposes.

## Features

- 📱 **Native iOS Design**: Authentic iMessage-style interface
- 🔐 **User Authentication**: Secure login with JWT tokens
- 💬 **Real-time Messaging**: Live chat using Socket.IO
- 🤖 **Fake Responses**: Automated responses to simulate live conversations
- 👥 **Multiple Users**: Three demo users to chat with
- 🎨 **Beautiful UI**: Modern, polished interface with gradients and animations
- 📱 **Responsive Design**: Optimized for iPhone screens

## Demo Users

The app comes with three pre-configured demo users:

| Username | Password | Name | Status |
|----------|----------|------|--------|
| `alice` | `password` | Alice Johnson | "Hey there! I am using iMessage Clone" |
| `bob` | `password` | Bob Smith | "Available" |
| `charlie` | `password` | Charlie Brown | "In a meeting" |

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or physical iPhone device

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd messenger
```

### 2. Install dependencies
```bash
# Install React Native app dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Start the backend server
```bash
# From the root directory
npm run backend
```

The backend will start on `http://localhost:3001` and display the demo credentials.

### 4. Start the React Native app
```bash
# In a new terminal, from the root directory
npm start
```

This will open the Expo development server. You can then:
- Press `i` to open in iOS Simulator
- Scan the QR code with Expo Go app on your iPhone
- Press `w` to open in web browser

## Project Structure

```
messenger/
├── App.js                 # Main app component
├── package.json           # React Native dependencies
├── app.json              # Expo configuration
├── backend/
│   ├── server.js         # Express + Socket.IO server
│   └── package.json      # Backend dependencies
└── src/
    ├── context/
    │   └── AuthContext.js # Authentication context
    └── screens/
        ├── LoginScreen.js    # Login screen
        ├── ChatListScreen.js # User list screen
        ├── ChatScreen.js     # Chat interface
        └── ProfileScreen.js  # User profile
```

## How It Works

### Authentication Flow
1. User enters credentials on the login screen
2. Backend validates credentials and returns JWT token
3. Token is stored in AsyncStorage for persistent login
4. App navigates to main chat interface

### Messaging Flow
1. User selects a contact from the chat list
2. Chat screen loads existing conversation history
3. User sends a message via Socket.IO
4. Backend receives message and stores it
5. Backend automatically sends a fake response after 2-5 seconds
6. Real-time updates are pushed to all connected clients

### Fake Response System
The backend includes a sophisticated fake response system that:
- Sends contextual responses based on the recipient
- Varies response timing (2-5 seconds) for realism
- Maintains conversation history
- Provides different response sets for each user

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Users
- `GET /api/users` - Get all users (requires auth)

### Messages
- `GET /api/conversations/:userId` - Get conversation history (requires auth)

### WebSocket Events
- `join` - Join user's room
- `send_message` - Send a message
- `receive_message` - Receive a message
- `message_sent` - Message confirmation

## Customization

### Adding New Users
Edit the `users` array in `backend/server.js`:

```javascript
const users = [
  {
    id: '4',
    username: 'diana',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Diana Prince',
    avatar: 'https://i.pravatar.cc/150?img=4',
    status: 'Wonder Woman mode'
  }
];
```

### Customizing Fake Responses
Edit the `fakeResponses` object in `backend/server.js`:

```javascript
const fakeResponses = {
  '4': [
    'That\'s amazing!',
    'I\'ll be there!',
    'Thanks for sharing!',
    'Can\'t wait!',
    'Sounds perfect!'
  ]
};
```

## Troubleshooting

### Common Issues

1. **Backend connection failed**
   - Ensure backend is running on port 3001
   - Check if port is not in use by another application

2. **Socket.IO connection issues**
   - Verify backend server is running
   - Check network connectivity
   - Ensure firewall allows localhost connections

3. **iOS Simulator issues**
   - Make sure Xcode is installed
   - Run `xcode-select --install` if needed
   - Restart iOS Simulator

4. **Expo issues**
   - Clear Expo cache: `expo r -c`
   - Update Expo CLI: `npm install -g @expo/cli`

## Development

### Running in Development Mode
```bash
# Start both backend and frontend
npm run dev
```

### Building for Production
```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## Technologies Used

- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Node.js, Express, Socket.IO
- **Authentication**: JWT, bcryptjs
- **Styling**: React Native StyleSheet, LinearGradient
- **State Management**: React Context API
- **Real-time Communication**: Socket.IO

## License

This project is for educational and demonstration purposes.

## Contributing

Feel free to submit issues and enhancement requests! 