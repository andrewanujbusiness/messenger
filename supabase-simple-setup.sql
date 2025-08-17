-- Simple Supabase Setup Script
-- This script creates the essential tables without complex permissions
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  original_text TEXT,
  tone_applied VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tone preferences table
CREATE TABLE IF NOT EXISTS tone_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tone VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tone_preferences_users ON tone_preferences(user_id, target_user_id);

-- Insert sample users
INSERT INTO users (id, username, password_hash, name, avatar) VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Johnson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150'),
  ('22222222-2222-2222-2222-222222222222', 'bob', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Smith', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150'),
  ('33333333-3333-3333-3333-333333333333', 'charlie', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Charlie Brown', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150')
ON CONFLICT (username) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tone_preferences_updated_at BEFORE UPDATE ON tone_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Simple Supabase setup completed successfully!';
    RAISE NOTICE 'Tables created: users, conversations, messages, tone_preferences';
    RAISE NOTICE 'Sample users added: alice, bob, charlie (password: password)';
    RAISE NOTICE 'Note: You may need to manually enable RLS and set policies in the Supabase dashboard';
END $$;
