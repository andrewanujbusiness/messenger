#!/bin/bash

echo "🚀 Supabase Setup Script for Messenger App"
echo "=========================================="
echo ""
echo "You're getting a 'must be owner of table' error. Let's fix this!"
echo ""
echo "Choose your setup approach:"
echo ""
echo "1. Simple Setup (Recommended for first time)"
echo "   - Creates basic tables without complex permissions"
echo "   - Avoids permission issues"
echo "   - You can add RLS policies later in the dashboard"
echo ""
echo "2. Full Setup with RLS"
echo "   - Creates tables with full security policies"
echo "   - May require manual permission fixes"
echo "   - More secure but more complex"
echo ""
echo "3. Manual Dashboard Setup"
echo "   - Use Supabase dashboard to create tables"
echo "   - Most control over permissions"
echo "   - Step-by-step guidance"
echo ""
read -p "Enter your choice (1, 2, or 3): " choice

case $choice in
  1)
    echo ""
    echo "✅ Running Simple Setup..."
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to the SQL Editor"
    echo "3. Copy the contents of 'supabase-simple-setup.sql'"
    echo "4. Paste and run the SQL script"
    echo ""
    echo "This should work without permission issues!"
    echo ""
    read -p "Press any key to open the simple setup file..."
    if command -v code &> /dev/null; then
        code supabase-simple-setup.sql
    elif command -v open &> /dev/null; then
        open supabase-simple-setup.sql
    else
        echo "Please open 'supabase-simple-setup.sql' in your preferred editor"
    fi
    ;;
  2)
    echo ""
    echo "⚠️  Running Full Setup with RLS..."
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to the SQL Editor"
    echo "3. Copy the contents of 'supabase-setup.sql'"
    echo "4. Paste and run the SQL script"
    echo ""
    echo "If you get permission errors, try the simple setup instead."
    echo ""
    read -p "Press any key to open the full setup file..."
    if command -v code &> /dev/null; then
        code supabase-setup.sql
    elif command -v open &> /dev/null; then
        open supabase-setup.sql
    else
        echo "Please open 'supabase-setup.sql' in your preferred editor"
    fi
    ;;
  3)
    echo ""
    echo "📋 Manual Dashboard Setup"
    echo "========================="
    echo ""
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to 'Table Editor'"
    echo "3. Click 'Create a new table'"
    echo ""
    echo "Create these tables one by one:"
    echo ""
    echo "Table: users"
    echo "- id: uuid, primary key, default: gen_random_uuid()"
    echo "- username: varchar(50), unique, not null"
    echo "- password_hash: varchar(255), not null"
    echo "- name: varchar(100), not null"
    echo "- avatar: text"
    echo "- created_at: timestamptz, default: now()"
    echo "- updated_at: timestamptz, default: now()"
    echo ""
    echo "Table: conversations"
    echo "- id: uuid, primary key, default: gen_random_uuid()"
    echo "- user1_id: uuid, foreign key to users(id)"
    echo "- user2_id: uuid, foreign key to users(id)"
    echo "- created_at: timestamptz, default: now()"
    echo ""
    echo "Table: messages"
    echo "- id: uuid, primary key, default: gen_random_uuid()"
    echo "- conversation_id: uuid, foreign key to conversations(id)"
    echo "- sender_id: uuid, foreign key to users(id)"
    echo "- text: text, not null"
    echo "- original_text: text"
    echo "- tone_applied: varchar(50)"
    echo "- timestamp: timestamptz, default: now()"
    echo ""
    echo "Table: tone_preferences"
    echo "- id: uuid, primary key, default: gen_random_uuid()"
    echo "- user_id: uuid, foreign key to users(id)"
    echo "- target_user_id: uuid, foreign key to users(id)"
    echo "- tone: varchar(50), not null"
    echo "- created_at: timestamptz, default: now()"
    echo "- updated_at: timestamptz, default: now()"
    echo ""
    echo "After creating tables, add sample data manually or use the simple setup script."
    ;;
  *)
    echo "Invalid choice. Please run the script again and choose 1, 2, or 3."
    exit 1
    ;;
esac

echo ""
echo "After setup, you can start the app with:"
echo "npm run dev:supabase"
echo ""
echo "Sample login credentials:"
echo "Username: alice, Password: password"
echo "Username: bob, Password: password"
echo "Username: charlie, Password: password"
echo ""
echo "Good luck! 🍀"
