// ChatGPT Integration Service
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

// OpenAI Configuration
const OPENAI_CONFIG = {
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
    organization: process.env.OPENAI_ORG_ID || null // Optional
};

// Initialize OpenAI Client
let openai;
const USE_CHATGPT = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';

if (USE_CHATGPT) {
    openai = new OpenAI(OPENAI_CONFIG);
    console.log('🤖 Using ChatGPT for chatbot');
} else {
    console.log('💬 Using local chatbot simulation (set OPENAI_API_KEY to use ChatGPT)');
}

// Store conversation history per session
const sessionHistory = new Map();

class ChatGPTService {
    
    // Process user message through ChatGPT or local simulation
    static async processMessage(message, sessionId = null) {
        try {
            if (USE_CHATGPT) {
                return await this.processWithChatGPT(message, sessionId);
            } else {
                return await this.processWithLocalBot(message, sessionId);
            }
        } catch (error) {
            console.error('Error processing ChatGPT message:', error);
            return {
                message: "I'm sorry, I'm having trouble understanding right now. Please try again later.",
                sessionId: sessionId || uuidv4(),
                intentName: 'Error'
            };
        }
    }

    // Process with ChatGPT API
    static async processWithChatGPT(message, sessionId) {
        const session = sessionId || uuidv4();
        
        // Get or create conversation history for this session
        let history = sessionHistory.get(session) || [];
        
        // Add system prompt if this is a new session
        if (history.length === 0) {
            history.push({
                role: 'system',
                content: `You are a helpful assistant for a login/signup website. You help users with:
- Account creation and registration
- Login issues and password resets
- Profile management and photo uploads
- Technical support
- General website navigation

Key information about the website:
- Users register with: name, email, password, phone number
- Login uses email (not username) and password
- Users have a profile dashboard for managing their info
- Profile pictures can be uploaded (JPG, PNG, GIF, WebP up to 5MB)
- The site has JWT authentication with secure cookies

Be friendly, helpful, and concise. Use emojis occasionally. If users have technical issues, provide clear step-by-step solutions.`
            });
        }
        
        // Add user message to history
        history.push({
            role: 'user',
            content: message
        });
        
        // Keep history manageable (last 20 messages)
        if (history.length > 21) { // 1 system + 20 conversation messages
            history = [history[0], ...history.slice(-20)];
        }
        
        // Call ChatGPT API
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: history,
            max_tokens: 300,
            temperature: 0.7,
            presence_penalty: 0.3,
            frequency_penalty: 0.3
        });

        const response = completion.choices[0].message.content;
        
        // Add assistant response to history
        history.push({
            role: 'assistant',
            content: response
        });
        
        // Store updated history
        sessionHistory.set(session, history);
        
        // Determine intent based on message content
        const intent = this.determineIntent(message);

        return {
            message: response,
            sessionId: session,
            intentName: intent
        };
    }

    // Determine intent from user message
    static determineIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('password') || lowerMessage.includes('forgot') || lowerMessage.includes('reset')) {
            return 'PasswordHelp';
        }
        if (lowerMessage.includes('signup') || lowerMessage.includes('register') || lowerMessage.includes('account')) {
            return 'AccountCreation';
        }
        if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
            return 'LoginHelp';
        }
        if (lowerMessage.includes('profile') || lowerMessage.includes('picture') || lowerMessage.includes('photo')) {
            return 'ProfileHelp';
        }
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return 'Greeting';
        }
        if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
            return 'Thanks';
        }
        if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
            return 'Goodbye';
        }
        
        return 'General';
    }

    // Local simulation fallback
    static async processWithLocalBot(message, sessionId) {
        const session = sessionId || uuidv4();
        const lowerMessage = message.toLowerCase().trim();

        // Simple FAQ responses
        const responses = this.getLocalResponses();
        
        for (const [keywords, response] of responses) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return {
                    message: response.message,
                    sessionId: session,
                    intentName: response.intent
                };
            }
        }

        // Default response
        return {
            message: "Hi! I'm here to help. You can ask me about:\n\n• Password reset\n• Account creation\n• Login issues\n• Profile management\n\nWhat would you like help with?",
            sessionId: session,
            intentName: 'Greeting'
        };
    }

    // Local FAQ responses (fallback when ChatGPT is not available)
    static getLocalResponses() {
        return [
            // Greetings
            [['hello', 'hi', 'hey', 'good morning', 'good afternoon'], {
                message: "Hello! 👋 I'm your virtual assistant. I can help you with login issues, password resets, and account management. What do you need help with?",
                intent: 'Greeting'
            }],
            
            // Password Help
            [['password', 'forgot password', 'reset password', 'can\'t login'], {
                message: "🔐 **Password Help:**\n\n1. Go to the login page\n2. Click 'Forgot Password' (if available)\n3. Enter your email address\n4. Check your email for reset instructions\n\nIf you don't see a forgot password link, please contact support.",
                intent: 'PasswordHelp'
            }],
            
            // Account Creation
            [['signup', 'register', 'create account', 'new account'], {
                message: "📝 **Creating an Account:**\n\n1. Click 'Register' on the homepage\n2. Fill in your details:\n   • Full Name\n   • Email Address\n   • Password\n   • Phone Number\n3. Click 'Submit'\n4. You'll be redirected to your welcome page!\n\nThen you can access your profile dashboard.",
                intent: 'AccountCreation'
            }],
            
            // Login Issues
            [['login', 'sign in', 'can\'t access', 'login problem'], {
                message: "🔑 **Login Troubleshooting:**\n\n• Make sure you're using your **email address** (not username)\n• Check your password for typos\n• Ensure Caps Lock is off\n• Try refreshing the page\n\nIf you still can't login, you might need to reset your password.",
                intent: 'LoginHelp'
            }],
            
            // Profile Management
            [['profile', 'dashboard', 'picture', 'upload photo'], {
                message: "👤 **Profile Management:**\n\n• Access your profile dashboard after logging in\n• Click the camera icon to upload a profile picture\n• Supported formats: JPG, PNG, GIF (max 5MB)\n• Update your personal information anytime\n• Manage privacy settings\n\nYour profile shows your membership stats and completion percentage!",
                intent: 'ProfileHelp'
            }],
            
            // Technical Issues
            [['error', 'not working', 'broken', 'bug', 'issue'], {
                message: "🔧 **Technical Issues:**\n\n• Try refreshing your browser\n• Clear your browser cache\n• Disable browser extensions temporarily\n• Make sure JavaScript is enabled\n\nIf the problem persists, please note:\n• What you were trying to do\n• Any error messages\n• Your browser type",
                intent: 'TechnicalHelp'
            }],
            
            // Thanks
            [['thank', 'thanks', 'appreciate'], {
                message: "You're welcome! 😊 Is there anything else I can help you with today?",
                intent: 'Thanks'
            }],
            
            // Goodbye
            [['bye', 'goodbye', 'see you', 'exit'], {
                message: "Goodbye! Feel free to ask if you need any help. Have a great day! 👋",
                intent: 'Goodbye'
            }]
        ];
    }

    // Get session information
    static async getSession(sessionId) {
        const history = sessionHistory.get(sessionId);
        return {
            sessionId: sessionId,
            startTime: new Date().toISOString(),
            messageCount: history ? history.length - 1 : 0, // Subtract 1 for system message
            hasHistory: !!history
        };
    }

    // End session and cleanup
    static async endSession(sessionId) {
        if (sessionHistory.has(sessionId)) {
            const history = sessionHistory.get(sessionId);
            console.log(`ChatGPT session ended: ${sessionId}, Messages: ${history.length - 1}`);
            sessionHistory.delete(sessionId);
        }
        return { success: true };
    }

    // Clear old sessions (cleanup)
    static cleanupOldSessions() {
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours
        const now = Date.now();
        
        for (const [sessionId] of sessionHistory.entries()) {
            // Simple cleanup - in production you'd track session timestamps
            if (sessionHistory.size > 100) { // Keep only recent 100 sessions
                sessionHistory.delete(sessionId);
                console.log(`Cleaned up old ChatGPT session: ${sessionId}`);
                break;
            }
        }
    }

    // Get chatbot statistics
    static getStats() {
        return {
            activeSessions: sessionHistory.size,
            totalConversations: sessionHistory.size,
            isUsingChatGPT: USE_CHATGPT,
            model: USE_CHATGPT ? 'gpt-3.5-turbo' : 'local-simulation'
        };
    }
}

// Cleanup old sessions every hour
setInterval(() => {
    ChatGPTService.cleanupOldSessions();
}, 60 * 60 * 1000);

module.exports = ChatGPTService;
