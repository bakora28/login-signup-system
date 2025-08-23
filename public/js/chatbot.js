// Chatbot Widget JavaScript
class ChatbotWidget {
    constructor() {
        this.isOpen = false;
        this.sessionId = null;
        this.messageCount = 0;
        this.isTyping = false;
        
        this.init();
    }

    init() {
        this.createChatWidget();
        // Delay event listener attachment to ensure DOM elements exist
        setTimeout(() => {
            this.attachEventListeners();
            this.showWelcomeMessage();
            console.log('🤖 Chatbot widget initialized');
        }, 100);
    }

    createChatWidget() {
        const chatHTML = `
            <div class="chat-widget" id="chatWidget">
                <!-- Chat Toggle Button -->
                <button class="chat-toggle" id="chatToggle" type="button" data-internal-chat="true">
                    <i class="fas fa-comments"></i>
                    <span class="chat-badge" id="chatBadge" style="display: none;">!</span>
                </button>

                <!-- Chat Window -->
                <div class="chat-window" id="chatWindow">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div>
                            <h3>ChatGPT Assistant 🤖</h3>
                            <div class="chat-status">
                                <span class="status-indicator"></span>
                                Powered by OpenAI
                            </div>
                        </div>
                        <button class="chat-close" id="chatClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Chat Messages -->
                    <div class="chat-messages" id="chatMessages">
                        <div class="welcome-message">
                            <h4>👋 Hi! I'm your ChatGPT Assistant</h4>
                            <p>I'm powered by OpenAI's ChatGPT and built into this site to help with login issues, account setup, profile management, and more!</p>
                            <small style="opacity: 0.8;">✅ Intelligent AI chat within your website</small>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator" id="typingIndicator">
                        <div class="typing-dots">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    </div>

                    <!-- Quick Replies -->
                    <div class="quick-replies" id="quickReplies">
                        <button class="quick-reply" data-message="I forgot my password">🔐 Forgot Password</button>
                        <button class="quick-reply" data-message="How do I create an account?">📝 Create Account</button>
                        <button class="quick-reply" data-message="I can't login">🚪 Login Help</button>
                        <button class="quick-reply" data-message="How do I upload a profile picture?">📸 Upload Photo</button>
                    </div>

                    <!-- Chat Input -->
                    <div class="chat-input-area">
                        <textarea 
                            class="chat-input" 
                            id="chatInput" 
                            placeholder="Type your message..."
                            rows="1"
                        ></textarea>
                        <button class="chat-send" id="chatSend">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
        console.log('✅ Chatbot HTML added to DOM');
    }

    attachEventListeners() {
        console.log('🔗 Attaching chatbot event listeners...');
        
        const chatToggle = document.getElementById('chatToggle');
        const chatClose = document.getElementById('chatClose');
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const quickReplies = document.querySelectorAll('.quick-reply');
        
        // Check if elements exist
        if (!chatToggle || !chatClose || !chatInput || !chatSend) {
            console.error('❌ Chatbot elements not found, retrying...');
            setTimeout(() => this.attachEventListeners(), 200);
            return;
        }
        
        console.log('✅ All chatbot elements found, attaching listeners...');

        // Toggle chat window - prevent any external redirects
        chatToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleChat();
            return false;
        });
        
        chatClose.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeChat();
            return false;
        });

        // Send message
        chatSend.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('💬 Send button clicked');
            this.sendMessage();
        });
        
        // Enter key to send message
        chatInput.addEventListener('keypress', (e) => {
            console.log('⌨️ Key pressed:', e.key);
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('💬 Enter key sending message');
                this.sendMessage();
            }
        });
        
        // Debug input changes
        chatInput.addEventListener('input', (e) => {
            console.log('📝 Input value:', e.target.value);
            this.autoResizeInput();
        });

        // Make sure input is focusable and enabled
        chatInput.removeAttribute('disabled');
        chatInput.setAttribute('tabindex', '0');

        // Quick replies
        quickReplies.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.dataset.message;
                this.sendQuickReply(message);
            });
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            const chatWidget = document.getElementById('chatWidget');
            if (this.isOpen && !chatWidget.contains(e.target)) {
                // Don't close if clicking on the toggle button
                if (!e.target.closest('#chatToggle')) {
                    this.closeChat();
                }
            }
        });
    }

    toggleChat() {
        console.log('🤖 Internal chatbot toggle activated');
        
        const chatWindow = document.getElementById('chatWindow');
        const chatToggle = document.getElementById('chatToggle');
        const chatBadge = document.getElementById('chatBadge');

        // Check if elements exist
        if (!chatWindow || !chatToggle) {
            console.error('❌ Chatbot elements not found, cannot toggle');
            return;
        }

        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            console.log('🤖 Opening internal chat widget');
            chatWindow.classList.add('active');
            chatToggle.classList.add('active');
            chatToggle.innerHTML = '<i class="fas fa-times"></i>';
            
            // Only hide badge if it exists
            if (chatBadge) {
                chatBadge.style.display = 'none';
            }
            
            // Force the chat window to be visible
            chatWindow.style.display = 'flex';
            chatWindow.style.visibility = 'visible';
            chatWindow.style.opacity = '1';
            chatWindow.style.position = 'fixed';
            chatWindow.style.zIndex = '999999';
            
            console.log('✅ Chat window should now be visible');
            
            // Focus input
            setTimeout(() => {
                const input = document.getElementById('chatInput');
                if (input) {
                    console.log('🎯 Focusing chat input');
                    input.focus();
                    input.click(); // Ensure it's really focused
                }
            }, 300);
        } else {
            this.closeChat();
        }
    }

    closeChat() {
        const chatWindow = document.getElementById('chatWindow');
        const chatToggle = document.getElementById('chatToggle');

        // Check if elements exist
        if (!chatWindow || !chatToggle) {
            console.error('❌ Chatbot elements not found, cannot close');
            return;
        }

        this.isOpen = false;
        chatWindow.classList.remove('active');
        chatToggle.classList.remove('active');
        chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
        
        // Force hide the chat window
        chatWindow.style.display = 'none';
        chatWindow.style.visibility = 'hidden';
        chatWindow.style.opacity = '0';
        
        console.log('✅ Chat window hidden');
    }

    async sendMessage() {
        console.log('📤 sendMessage called');
        const chatInput = document.getElementById('chatInput');
        
        if (!chatInput) {
            console.error('❌ Chat input not found');
            return;
        }
        
        const message = chatInput.value.trim();
        console.log('📝 Message to send:', message);

        if (!message || this.isTyping) {
            console.log('⚠️ No message or already typing');
            return;
        }

        // Clear input
        chatInput.value = '';
        this.autoResizeInput();

        // Add user message to chat
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTyping();

        try {
            // Send to chatbot service
            const response = await this.callChatbotAPI(message);
            
            // Hide typing indicator
            this.hideTyping();
            
            // Add bot response
            this.addMessage(response.message, 'bot');
            
            // Update session
            this.sessionId = response.sessionId;
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTyping();
            this.addMessage("I'm sorry, I'm having trouble right now. Please try again later.", 'bot');
        }
    }

    sendQuickReply(message) {
        // Hide quick replies temporarily
        const quickReplies = document.getElementById('quickReplies');
        quickReplies.style.display = 'none';
        
        // Send the message
        const chatInput = document.getElementById('chatInput');
        chatInput.value = message;
        this.sendMessage();
        
        // Show quick replies again after response
        setTimeout(() => {
            quickReplies.style.display = 'flex';
        }, 500);
    }

    async callChatbotAPI(message) {
        const response = await fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: this.sessionId
            })
        });

        if (!response.ok) {
            throw new Error('Chatbot API error');
        }

        return await response.json();
    }

    addMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        // Handle multiline messages and formatting
        const formattedMessage = this.formatMessage(message);
        messageDiv.innerHTML = formattedMessage;
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        this.messageCount++;
    }

    formatMessage(message) {
        // Convert newlines to line breaks
        let formatted = message.replace(/\n/g, '<br>');
        
        // Make text between ** bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Make text between * italic
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert bullet points
        formatted = formatted.replace(/^• /gm, '🔹 ');
        
        return formatted;
    }

    showTyping() {
        this.isTyping = true;
        const typingIndicator = document.getElementById('typingIndicator');
        const chatSend = document.getElementById('chatSend');
        
        typingIndicator.classList.add('active');
        chatSend.disabled = true;
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTyping() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        const chatSend = document.getElementById('chatSend');
        
        typingIndicator.classList.remove('active');
        chatSend.disabled = false;
    }

    autoResizeInput() {
        const chatInput = document.getElementById('chatInput');
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
    }

    showWelcomeMessage() {
        // Show notification badge to attract attention
        const chatBadge = document.getElementById('chatBadge');
        // Removed 3-second delay - show immediately
        chatBadge.style.display = 'flex';
    }

    // Show notification (can be called from outside)
    showNotification() {
        const chatBadge = document.getElementById('chatBadge');
        chatBadge.style.display = 'flex';
        
        // Pulse effect
        const chatToggle = document.getElementById('chatToggle');
        chatToggle.style.animation = 'pulse 0.5s ease-in-out 3';
    }

    // Add contextual help based on current page
    addContextualHelp(context) {
        const contextMessages = {
            'login': "Having trouble logging in? I can help with password resets and login issues!",
            'signup': "Need help creating your account? I can guide you through the registration process!",
            'profile': "Want to know more about profile features? Ask me about uploading photos or managing your account!",
            'error': "Looks like something went wrong. I can help troubleshoot common issues!"
        };

        if (contextMessages[context]) {
            setTimeout(() => {
                this.addMessage(contextMessages[context], 'bot');
                this.showNotification();
            }, 1000);
        }
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Initializing internal chatbot widget...');
    
    // Only initialize if the chatbot elements don't already exist
    if (!document.getElementById('chatWidget')) {
        window.chatbot = new ChatbotWidget();
        console.log('✅ Internal chatbot widget ready');
        
        // Prevent any external chat conflicts
        document.body.setAttribute('data-internal-chatbot', 'active');
        
        // Add contextual help based on current page
        const currentPath = window.location.pathname;
        if (currentPath.includes('/login')) {
            window.chatbot.addContextualHelp('login');
        } else if (currentPath.includes('/signup')) {
            window.chatbot.addContextualHelp('signup');
        } else if (currentPath.includes('/profile')) {
            window.chatbot.addContextualHelp('profile');
        }
    } else {
        console.log('⚠️ Chatbot widget already exists');
    }
});

// Global function to show chatbot notification
function showChatbotNotification() {
    if (window.chatbot) {
        window.chatbot.showNotification();
    }
}

// Global function to open chatbot with specific message
function openChatbotWithMessage(message) {
    console.log('🔗 Help button clicked, opening chatbot with message:', message);
    
    // Wait for chatbot to be initialized if needed
    function tryOpenChatbot() {
        if (window.chatbot) {
            console.log('✅ Chatbot found, checking elements...');
            
            // Verify chatbot elements exist
            const chatWindow = document.getElementById('chatWindow');
            const chatToggle = document.getElementById('chatToggle');
            
            if (!chatWindow || !chatToggle) {
                console.log('⏳ Chatbot elements not ready, retrying...');
                setTimeout(tryOpenChatbot, 500);
                return;
            }
            
            console.log('✅ Chatbot elements ready, opening...');
            
            // Open chatbot if not already open
            if (!window.chatbot.isOpen) {
                window.chatbot.toggleChat();
            }
            
            // Send the help message
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    console.log('💬 Sending help message:', message);
                    chatInput.value = message;
                    window.chatbot.sendMessage();
                } else {
                    console.error('❌ Chat input not found, retrying...');
                    setTimeout(() => {
                        const retryInput = document.getElementById('chatInput');
                        if (retryInput) {
                            retryInput.value = message;
                            window.chatbot.sendMessage();
                        }
                    }, 500);
                }
            }, 500);
        } else {
            console.log('⏳ Chatbot not ready, retrying...');
            setTimeout(tryOpenChatbot, 1000);
        }
    }
    
    tryOpenChatbot();
}
