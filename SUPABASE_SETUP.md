# Supabase Integration Setup

This document explains how to set up and use the Supabase version of the messenger app instead of the local socket.io server.

## What Changed

- **Backend**: Replaced local Express + Socket.IO server with Supabase database
- **Frontend**: Updated to use Supabase real-time subscriptions instead of socket.io-client
- **Authentication**: Simplified to use Supabase user management
- **Real-time**: Uses Supabase's built-in real-time capabilities

## Prerequisites

1. **Supabase Account**: You already have this set up
2. **Environment Variables**: Your `.env` file is already configured
3. **Database Tables**: Need to create the required tables

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the script to create all necessary tables and policies

## Running the App

### Option 1: Supabase Backend (Recommended)
```bash
# Start the Supabase-based backend and frontend
npm run dev:supabase

# Or just the backend
npm run backend:supabase
```

### Option 2: Original Local Backend
```bash
# Start the original socket.io backend and frontend
npm run dev

# Or just the backend
npm run backend
```

## Key Benefits of Supabase Version

1. **Scalability**: No need to manage your own server
2. **Real-time**: Built-in real-time subscriptions
3. **Security**: Row Level Security (RLS) policies
4. **Database**: Managed PostgreSQL with automatic backups
5. **API**: Auto-generated REST and GraphQL APIs

## Architecture Changes

### Before (Socket.IO)
```
Frontend ↔ Socket.IO ↔ Local Express Server ↔ In-memory storage
```

### After (Supabase)
```
Frontend ↔ Supabase Client ↔ Supabase Database (with real-time)
```

## Database Schema

### Users Table
- `id`: UUID (primary key)
- `username`: Unique username
- `password`: Hashed password
- `name`: Display name
- `avatar`: Profile picture URL

### Messages Table
- `id`: UUID (primary key)
- `conversation_key`: Composite key for conversations
- `sender_id`: UUID reference to users
- `receiver_id`: UUID reference to users
- `text`: Message content
- `original_text`: Original message if tone-adjusted
- `tone_applied`: Applied tone preference
- `timestamp`: Message timestamp

### Tone Preferences Table
- `id`: UUID (primary key)
- `user_id`: UUID reference to users
- `target_user_id`: UUID reference to users
- `tone`: Tone preference setting
- `created_at`: When preference was set

## Real-time Features

The app now uses Supabase's real-time subscriptions for:
- **Instant messaging**: Messages appear in real-time
- **Tone preferences**: Updates are reflected immediately
- **User status**: Real-time user availability

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: JWT-based authentication
- **Authorization**: Proper access controls for all operations

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure your Supabase URL and keys are correct
2. **Table Permissions**: Make sure RLS policies are properly set up
3. **Real-time**: Check that real-time is enabled in your Supabase project

### Debug Mode

The Supabase backend includes extensive logging. Check the console for:
- Database operation logs
- Real-time subscription status
- Error details with stack traces

## Migration from Local Server

If you were using the local server before:

1. **Stop the local server**: `Ctrl+C` if running
2. **Run database setup**: Execute the SQL script in Supabase
3. **Start Supabase version**: `npm run dev:supabase`
4. **Test functionality**: Login, send messages, check real-time updates

## Performance Considerations

- **Connection Pooling**: Supabase handles database connections automatically
- **Caching**: Built-in query result caching
- **Indexes**: Optimized database indexes for common queries
- **Real-time**: Efficient change detection and broadcasting

## Next Steps

1. **Customize Users**: Modify the sample users in the SQL script
2. **Add Features**: Leverage Supabase's additional capabilities
3. **Scale**: The app will automatically scale with Supabase
4. **Monitor**: Use Supabase dashboard to monitor usage and performance
