# ChatGPT Integration Setup Guide

## 🤖 Overview
Your website now integrates with OpenAI's ChatGPT for intelligent conversational assistance. This provides much more natural and helpful responses than the previous basic chatbot.

## 🔑 Getting Your OpenAI API Key

### Step 1: Create OpenAI Account
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section

### Step 2: Generate API Key
1. Click **"Create new secret key"**
2. Give it a name like "Website Chatbot"
3. Copy the API key (starts with `sk-...`)
4. **Important**: Save it securely - you won't see it again!

### Step 3: Set Up Billing
1. Go to **Billing** in your OpenAI dashboard
2. Add a payment method
3. Set usage limits (recommended: $5-10/month for small websites)

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in your project root:

```env
# ChatGPT Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_ORG_ID=your-org-id-here  # Optional

# Other existing variables...
```

### Alternative: Direct Configuration
If you can't use environment variables, edit `src/chatgpt-service.js`:

```javascript
const OPENAI_CONFIG = {
    apiKey: 'sk-your-actual-api-key-here',  // Replace with your key
    organization: 'your-org-id-here'        // Optional
};
```

## 🚀 Testing Your Setup

### 1. Restart Server
```bash
node src/index.js
```

Look for: `🤖 Using ChatGPT for chatbot`

### 2. Test in Browser
1. Go to `http://localhost:3000`
2. Click the purple chat bubble (bottom-right)
3. Type: "Hello, can you help me?"
4. You should get a natural ChatGPT response!

### 3. Check Health Endpoint
Visit: `http://localhost:3000/api/chatbot/health`

Should show:
```json
{
    "status": "healthy",
    "service": "ChatGPT (OpenAI)",
    "model": "gpt-3.5-turbo"
}
```

## 💰 Cost Management

### Expected Usage
- **Small website**: $2-5/month
- **Medium traffic**: $10-20/month
- **GPT-3.5-turbo**: ~$0.002 per conversation

### Cost Controls
1. Set monthly billing limits in OpenAI dashboard
2. Monitor usage in **Usage** section
3. The chatbot automatically manages conversation history

## 🛡️ Fallback Mode

If ChatGPT is unavailable, the system automatically falls back to:
- Local FAQ responses
- Basic keyword matching
- Still functional, just less intelligent

You'll see: `💬 Using local chatbot simulation`

## 🔧 Customization

### Modify System Prompt
Edit `src/chatgpt-service.js` around line 45:

```javascript
content: `You are a helpful assistant for a login/signup website...`
```

### Adjust Model Settings
In `src/chatgpt-service.js`:

```javascript
model: 'gpt-3.5-turbo',    // or 'gpt-4' for better quality
max_tokens: 300,           // Shorter responses
temperature: 0.7,          // Creativity level (0-1)
```

## 🐛 Troubleshooting

### "Using local chatbot simulation"
- Check your API key is correct
- Verify `.env` file is in project root
- Restart the server

### API Errors
- Check billing is set up
- Verify API key hasn't expired
- Check OpenAI service status

### Rate Limits
- Upgrade your OpenAI plan
- Reduce conversation frequency
- Consider caching responses

## 📊 Monitoring

### View Logs
```bash
# Check server logs for ChatGPT activity
[ChatGPT] Session: abc123, Intent: PasswordHelp, Messages: 3
```

### Usage Statistics
Visit: `http://localhost:3000/api/chatbot/stats`

## 🎯 Next Steps

1. **Get your OpenAI API key** (most important!)
2. **Set environment variable** or edit config file
3. **Restart server** and test
4. **Monitor costs** in OpenAI dashboard
5. **Customize responses** to match your brand

## 💡 Pro Tips

- Start with GPT-3.5-turbo (cheaper, fast)
- Set monthly spending limits
- Monitor usage weekly
- The chatbot learns from conversation context
- Users get much better help than basic FAQ bots!

---

**Your ChatGPT-powered chatbot is ready! 🎉**

Just add your API key and restart to activate intelligent conversations.
