// AWS Lambda Function for Lex Chatbot
// Deploy this to AWS Lambda and connect it to your Lex bot

exports.handler = async (event) => {
    console.log('Lex event received:', JSON.stringify(event, null, 2));
    
    const intentName = event.sessionState.intent.name;
    const slots = event.sessionState.intent.slots;
    const sessionAttributes = event.sessionState.sessionAttributes || {};
    
    let response;
    
    try {
        switch (intentName) {
            case 'PasswordHelp':
                response = handlePasswordHelp(event);
                break;
                
            case 'AccountCreation':
                response = handleAccountCreation(event);
                break;
                
            case 'LoginHelp':
                response = handleLoginHelp(event);
                break;
                
            case 'ProfileHelp':
                response = handleProfileHelp(event);
                break;
                
            case 'TechnicalSupport':
                response = handleTechnicalSupport(event);
                break;
                
            case 'Greeting':
                response = handleGreeting(event);
                break;
                
            default:
                response = handleFallback(event);
        }
        
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
        
    } catch (error) {
        console.error('Error processing intent:', error);
        return createResponse(
            event,
            'Failed',
            "I'm sorry, I encountered an error. Please try again later."
        );
    }
};

function handlePasswordHelp(event) {
    const steps = [
        "🔐 **Password Reset Steps:**",
        "",
        "1. Go to the login page",
        "2. Click 'Forgot Password' link",
        "3. Enter your email address",
        "4. Check your email for reset instructions",
        "5. Follow the link to create a new password",
        "",
        "If you don't see the reset email, check your spam folder.",
        "",
        "Need more help? I can connect you with support."
    ];
    
    return createResponse(
        event,
        'Fulfilled',
        steps.join('\n'),
        null,
        ['Contact Support', 'Go to Login Page', 'I\'m done']
    );
}

function handleAccountCreation(event) {
    const message = `📝 **Creating Your Account:**

1. Click 'Register' on the homepage
2. Fill in all required fields:
   • Full Name
   • Valid Email Address
   • Strong Password
   • Phone Number
3. Click 'Submit'
4. You'll be redirected to your welcome page!

**Tips:**
• Use a strong password with 8+ characters
• Make sure your email is correct
• Phone number helps with account recovery

After creating your account, you can:
• Upload a profile picture
• Access your dashboard
• Update your information anytime

Ready to get started?`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        null,
        ['Go to Registration', 'Login Help', 'Profile Questions']
    );
}

function handleLoginHelp(event) {
    const message = `🔑 **Login Troubleshooting:**

**Common Issues & Solutions:**

1. **Wrong Credentials**
   • Use your EMAIL address (not username)
   • Check for typos in password
   • Ensure Caps Lock is off

2. **Browser Issues**
   • Clear browser cache/cookies
   • Try incognito/private mode
   • Disable browser extensions

3. **Account Issues**
   • Account might be locked
   • Password might have expired
   • Email not verified

**Still can't login?**
Try resetting your password or contact support.`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        null,
        ['Reset Password', 'Clear Browser Cache', 'Contact Support']
    );
}

function handleProfileHelp(event) {
    const message = `👤 **Profile Management Help:**

**Profile Dashboard Features:**
• View your account information
• Upload/change profile picture
• Update personal details
• Manage privacy settings
• Track your membership stats

**Profile Picture Upload:**
• Supported formats: JPG, PNG, GIF, WebP
• Maximum size: 5MB
• Click the camera icon to upload
• Pictures are stored securely

**Privacy Settings:**
• Public: Everyone can see your profile
• Friends: Only friends can see details
• Private: Only you can see your info

**Profile Completion:**
Complete all fields to get 100% profile completion!

What would you like to do with your profile?`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        null,
        ['Upload Photo', 'Update Info', 'Privacy Settings', 'View Dashboard']
    );
}

function handleTechnicalSupport(event) {
    const userIssue = slots?.issue?.value?.originalValue || 'general issue';
    
    const message = `🔧 **Technical Support:**

I understand you're experiencing: ${userIssue}

**Quick Troubleshooting Steps:**

1. **Refresh the page** (Ctrl+F5 or Cmd+R)
2. **Clear browser data:**
   • Clear cache and cookies
   • Restart your browser
3. **Check browser compatibility:**
   • Chrome, Firefox, Safari, Edge
   • Enable JavaScript
4. **Network issues:**
   • Check internet connection
   • Try different WiFi/network

**Still having problems?**
Please note:
• What you were trying to do
• Any error messages
• Your browser and device type

This helps our support team assist you better.`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        { issueType: userIssue },
        ['Contact Support', 'Try Again', 'Different Issue']
    );
}

function handleGreeting(event) {
    const timeOfDay = getTimeOfDay();
    
    const message = `${timeOfDay}! 👋 Welcome to our help assistant!

I'm here to help you with:

🔐 **Account Issues**
• Password resets
• Login problems
• Account creation

👤 **Profile Management**
• Dashboard navigation
• Photo uploads
• Settings management

🛠️ **Technical Support**
• Browser issues
• Error troubleshooting
• Feature questions

What can I help you with today?`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        null,
        ['Login Help', 'Create Account', 'Profile Help', 'Technical Issue']
    );
}

function handleFallback(event) {
    const message = `I'm not sure I understood that correctly. 

I can help you with:
• Login and password issues
• Account creation
• Profile management
• Technical problems

Could you try rephrasing your question, or choose one of the options below?`;

    return createResponse(
        event,
        'Fulfilled',
        message,
        null,
        ['Login Help', 'Create Account', 'Profile Help', 'Talk to Human']
    );
}

function createResponse(event, fulfillmentState, message, sessionAttributes = null, quickReplies = null) {
    const response = {
        sessionState: {
            intent: {
                name: event.sessionState.intent.name,
                state: fulfillmentState
            },
            sessionAttributes: sessionAttributes || event.sessionState.sessionAttributes || {}
        },
        messages: [
            {
                contentType: 'PlainText',
                content: message
            }
        ]
    };
    
    // Add quick replies if provided
    if (quickReplies && quickReplies.length > 0) {
        response.messages.push({
            contentType: 'ImageResponseCard',
            imageResponseCard: {
                title: 'Quick Actions',
                buttons: quickReplies.slice(0, 5).map(reply => ({
                    text: reply,
                    value: reply
                }))
            }
        });
    }
    
    return response;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

// Helper function to extract user preferences
function getUserPreferences(sessionAttributes) {
    return {
        preferredLanguage: sessionAttributes.preferredLanguage || 'en',
        isReturningUser: sessionAttributes.isReturningUser === 'true',
        lastVisit: sessionAttributes.lastVisit || null
    };
}

// Helper function to log user interactions for analytics
function logInteraction(intentName, fulfillmentState, sessionId) {
    console.log('User interaction:', {
        intent: intentName,
        fulfillment: fulfillmentState,
        session: sessionId,
        timestamp: new Date().toISOString()
    });
}
