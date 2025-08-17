-- Supabase Database Setup Script
-- Run this in your Supabase SQL editor
-- This script handles cases where some objects may already exist

-- First, let's check and fix permissions
-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO anon, authenticated;

-- Enable Row Level Security (safe to run multiple times)
-- Note: We'll handle auth.users separately since it's a system table
-- ALTER TABLE IF EXISTS auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing tables if they exist (be careful with this in production!)
-- Uncomment the following lines if you need to reset everything:
-- DROP TABLE IF EXISTS public.tone_preferences CASCADE;
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (using better schema structure)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table (better structure for managing chat conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Create messages table (using conversation_id instead of conversation_key)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    original_text TEXT,
    tone_applied VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tone_preferences table
CREATE TABLE IF NOT EXISTS public.tone_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_user_id)
);

-- Create indexes for better performance (IF NOT EXISTS prevents errors if they exist)
CREATE INDEX IF NOT EXISTS idx_conversations_users ON public.conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tone_preferences_users ON public.tone_preferences(user_id, target_user_id);

-- Grant permissions on the tables we just created
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.conversations TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.tone_preferences TO anon, authenticated;

-- Enable Row Level Security on our tables (safe to run multiple times)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tone_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own tone preferences" ON public.tone_preferences;
DROP POLICY IF EXISTS "Users can manage their own tone preferences" ON public.tone_preferences;

-- Create RLS policies for users table
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for conversations table
CREATE POLICY "Users can view conversations they're part of" ON public.conversations
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create RLS policies for messages table
CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = messages.conversation_id 
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = messages.conversation_id 
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Create RLS policies for tone_preferences table
CREATE POLICY "Users can view their own tone preferences" ON public.tone_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tone preferences" ON public.tone_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Insert sample users (using the better structure with specific UUIDs)
INSERT INTO public.users (id, username, password_hash, name, avatar) VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Johnson', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150'),
    ('22222222-2222-2222-2222-222222222222', 'bob', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Smith', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150'),
    ('33333333-3333-3333-3333-333333333333', 'charlie', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Charlie Brown', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150')
ON CONFLICT (username) DO NOTHING;

-- Create function to update updated_at timestamp (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_tone_preferences_updated_at ON public.tone_preferences;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tone_preferences_updated_at BEFORE UPDATE ON public.tone_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions on sequences (auto-generated for UUID primary keys)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon, authenticated;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Supabase setup completed successfully!';
    RAISE NOTICE 'Tables created/updated: users, conversations, messages, tone_preferences';
    RAISE NOTICE 'Sample users added: alice, bob, charlie (password: password)';
    RAISE NOTICE 'RLS policies and permissions configured';
    RAISE NOTICE 'All permissions granted to anon and authenticated roles';
END $$;
