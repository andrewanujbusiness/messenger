# Tone-Based Message Filtering Feature

This feature allows users to set tone preferences for messages they receive from specific users. Messages are automatically paraphrased using OpenAI's GPT-3.5-turbo model to match the selected tone.

## Features

### Available Tones:
1. **Warmer** - Makes messages friendlier and more inviting
2. **Profanity-Free** - Removes or replaces inappropriate language  
3. **More Formal** - Adjusts to professional tone
4. **Simplified / Clearer** - Rephrases complex language into plain English
5. **Concise / Brief** - Shortens messages to be more direct

### How It Works:
- Users can select a tone preference for each conversation
- Incoming messages are automatically processed through OpenAI API
- Original messages are preserved but displayed with tone-adjusted versions
- Tone preferences are saved per user-conversation pair

## Setup Instructions

### 1. OpenAI API Configuration

You need an OpenAI API key to use this feature:

1. **Get an API Key:**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Navigate to API Keys section
   - Create a new API key

2. **Set Environment Variable:**
   ```bash
   # Add to your .env file or set as environment variable
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. **Alternative: Direct Configuration**
   - Edit `backend/server.js`
   - Replace `'your-openai-api-key'` with your actual API key
   - **Note:** This is less secure than environment variables

### 2. Backend Setup

The backend automatically includes:
- Tone preference storage
- OpenAI API integration
- Real-time message processing
- New API endpoints for tone management

### 3. Frontend Features

The app now includes:
- Tone selector modal with 5 tone options
- Visual tone indicator in chat
- Tone button in input area
- Automatic tone preference loading

## Usage

### Setting a Tone:
1. Open a conversation
2. Tap the tone button (⚙️ icon) next to the input field
3. Select your desired tone from the modal
4. The tone will be applied to all future messages from that user

### Visual Indicators:
- **Active tone:** Blue icon and "Tone mode" indicator at top
- **No tone:** Gray settings icon
- **Tone applied:** Messages show adjusted text while preserving original

### API Endpoints:
- `POST /api/tone-preference` - Set tone preference
- `GET /api/tone-preference/:targetUserId` - Get tone preference

## Technical Details

### Message Processing Flow:
1. User sends message
2. Backend checks if recipient has tone preference for sender
3. If preference exists, message is sent to OpenAI API
4. OpenAI returns tone-adjusted version
5. Adjusted message is delivered to recipient
6. Original message is preserved for sender

### Error Handling:
- If OpenAI API fails, original message is delivered
- Network errors are logged but don't break functionality
- Invalid tone preferences are ignored

### Cost Considerations:
- Each message adjustment uses ~50-100 tokens
- GPT-3.5-turbo costs ~$0.002 per 1K tokens
- Consider implementing rate limiting for production use

## Security Notes

- API keys should be stored in environment variables
- Consider implementing user authentication for API usage
- Monitor API usage to prevent abuse
- Original messages are preserved for audit purposes

## Future Enhancements

- Custom tone definitions
- Tone strength adjustment (mild/strong)
- Batch processing for efficiency
- Offline tone processing
- User-defined tone prompts 