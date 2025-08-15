# Environment Setup Guide

## OpenAI API Key Configuration

To use the tone feature, you need to set up your OpenAI API key as an environment variable.

### Option 1: Environment Variable (Recommended)

1. **Create a `.env` file in the project root:**
   ```bash
   touch .env
   ```

2. **Add your OpenAI API key to the `.env` file:**
   ```
   OPENAI_API_KEY=your-actual-openai-api-key-here
   ```

3. **The `.env` file is already in `.gitignore` and will not be committed to Git.**

### Option 2: System Environment Variable

Set the environment variable in your shell:

```bash
# macOS/Linux
export OPENAI_API_KEY="your-actual-openai-api-key-here"

# Windows (Command Prompt)
set OPENAI_API_KEY=your-actual-openai-api-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY="your-actual-openai-api-key-here"
```

### Option 3: For Development Only

If you want to test quickly, you can temporarily modify `backend/server.js`:

```javascript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-actual-key-here';
```

**⚠️ WARNING: Never commit API keys to Git! Always use environment variables for production.**

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment

## Testing the Setup

Once you've set up your API key, you can test the tone feature:

1. Start the backend: `npm run backend`
2. Start the frontend: `npm start`
3. Login and test the tone feature in the app

## Security Notes

- The `.env` file is automatically ignored by Git
- API keys are never logged or stored in the database
- Each message adjustment uses ~50-100 tokens
- Monitor your OpenAI usage to avoid unexpected charges 