// Chatbot API Routes
const express = require('express');
const router = express.Router();
const ChatGPTService = require('./chatgpt-service');

// Store active chat sessions (in production, use Redis or DynamoDB)
const chatSessions = new Map();

// Chatbot API endpoint
router.post('/api/chatbot', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        // Process message through ChatGPT service
        const response = await ChatGPTService.processMessage(message, sessionId);
        
        // Update session info
        const session = chatSessions.get(response.sessionId) || {
            startTime: new Date(),
            messageCount: 0,
            lastActivity: new Date()
        };
        
        session.messageCount++;
        session.lastActivity = new Date();
        chatSessions.set(response.sessionId, session);
        
        // Log chat interaction
        console.log(`[ChatGPT] Session: ${response.sessionId}, Intent: ${response.intentName}, Messages: ${session.messageCount}`);
        
        res.json({
            message: response.message,
            sessionId: response.sessionId,
            intentName: response.intentName,
            messageCount: session.messageCount
        });
        
    } catch (error) {
        console.error('Chatbot API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Sorry, I\'m having trouble right now. Please try again later.'
        });
    }
});

// Get chat session info
router.get('/api/chatbot/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = chatSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }
        
        res.json({
            sessionId: sessionId,
            startTime: session.startTime,
            lastActivity: session.lastActivity,
            messageCount: session.messageCount,
            duration: Math.floor((new Date() - session.startTime) / 1000)
        });
        
    } catch (error) {
        console.error('Session info error:', error);
        res.status(500).json({
            error: 'Failed to get session info'
        });
    }
});

// End chat session
router.delete('/api/chatbot/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (chatSessions.has(sessionId)) {
            const session = chatSessions.get(sessionId);
            console.log(`[ChatGPT] Session ended: ${sessionId}, Duration: ${Math.floor((new Date() - session.startTime) / 1000)}s, Messages: ${session.messageCount}`);
            
            chatSessions.delete(sessionId);
            
            // End session in ChatGPT service
            await ChatGPTService.endSession(sessionId);
        }
        
        res.json({
            success: true,
            message: 'Session ended successfully'
        });
        
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            error: 'Failed to end session'
        });
    }
});

// Get chatbot statistics
router.get('/api/chatbot/stats', async (req, res) => {
    try {
        const now = new Date();
        const activeSessions = Array.from(chatSessions.values()).filter(
            session => (now - session.lastActivity) < 30 * 60 * 1000 // Active within 30 minutes
        );
        
        const totalMessages = Array.from(chatSessions.values()).reduce(
            (sum, session) => sum + session.messageCount, 0
        );
        
        res.json({
            totalSessions: chatSessions.size,
            activeSessions: activeSessions.length,
            totalMessages: totalMessages,
            averageMessagesPerSession: chatSessions.size > 0 ? Math.round(totalMessages / chatSessions.size) : 0
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Failed to get statistics'
        });
    }
});

// Health check for chatbot service
router.get('/api/chatbot/health', async (req, res) => {
    try {
        // Test the chatbot service
        const testResponse = await ChatGPTService.processMessage('health check', 'health-check-session');
        
        const stats = ChatGPTService.getStats();
        
        res.json({
            status: 'healthy',
            service: stats.isUsingChatGPT ? 'ChatGPT (OpenAI)' : 'Local Simulation',
            model: stats.model,
            timestamp: new Date().toISOString(),
            activeSessions: chatSessions.size,
            chatGPTSessions: stats.activeSessions
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// FAQ endpoint for common questions
router.get('/api/chatbot/faq', (req, res) => {
    const faqs = [
        {
            question: "How do I reset my password?",
            answer: "Go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your email.",
            category: "Account"
        },
        {
            question: "How do I create an account?",
            answer: "Click 'Register' on the homepage, fill in your details (name, email, password, phone), and click submit.",
            category: "Account"
        },
        {
            question: "How do I upload a profile picture?",
            answer: "After logging in, go to your Profile Dashboard and click the camera icon next to your profile picture.",
            category: "Profile"
        },
        {
            question: "What image formats are supported?",
            answer: "We support JPG, PNG, GIF, WebP, and other image formats up to 5MB in size.",
            category: "Profile"
        },
        {
            question: "Why can't I login?",
            answer: "Make sure you're using your email address (not username) and check your password. If you still can't login, try resetting your password.",
            category: "Login"
        },
        {
            question: "How do I access my profile dashboard?",
            answer: "After logging in, you'll see a 'View Profile Dashboard' button on the welcome page, or you can go directly to /profile/dashboard.",
            category: "Profile"
        }
    ];
    
    res.json({
        faqs: faqs,
        categories: ["Account", "Profile", "Login"],
        total: faqs.length
    });
});

// Cleanup old sessions (run periodically)
function cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of chatSessions.entries()) {
        if (now - session.lastActivity > maxAge) {
            console.log(`[ChatGPT] Cleaning up old session: ${sessionId}`);
            chatSessions.delete(sessionId);
        }
    }
}

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

module.exports = router;
