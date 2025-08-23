// Chatbot External Service Blocker
// This script prevents external chatbot services from interfering

(function() {
    'use strict';
    
    console.log('🛡️ Initializing internal chatbot protection...');
    
    // Block external chatbot redirects
    function blockExternalChatbots() {
        // Override common external chatbot methods
        if (window.Microsoft && window.Microsoft.CopilotStudio) {
            console.log('🚫 Blocking Microsoft Copilot Studio');
            window.Microsoft.CopilotStudio.open = function() {
                console.log('🤖 Redirected to internal chatbot instead');
                if (window.chatbot) {
                    window.chatbot.toggleChat();
                }
                return false;
            };
        }
        
        // Block any external chat window opens
        const originalOpen = window.open;
        window.open = function(url, target, features) {
            if (url && (
                url.includes('copilot') ||
                url.includes('chatbot') ||
                url.includes('assistant') ||
                url.includes('help.microsoft.com') ||
                url.includes('support.microsoft.com')
            )) {
                console.log('🚫 Blocked external chat redirect to:', url);
                console.log('🤖 Opening internal chatbot instead');
                if (window.chatbot) {
                    window.chatbot.toggleChat();
                }
                return null;
            }
            return originalOpen.call(this, url, target, features);
        };
        
        // Intercept any external chat button clicks
        document.addEventListener('click', function(e) {
            const target = e.target;
            const button = target.closest('button, a, [role="button"]');
            
            if (button && !button.hasAttribute('data-internal-chat')) {
                const text = button.textContent.toLowerCase();
                const hasExternalChatKeywords = (
                    text.includes('help') ||
                    text.includes('support') ||
                    text.includes('chat') ||
                    text.includes('assistant')
                ) && !button.closest('#chatWidget');
                
                if (hasExternalChatKeywords) {
                    // Check if this might be an external chat button
                    const href = button.href || button.getAttribute('data-href');
                    if (href && (href.includes('copilot') || href.includes('microsoft') || href.includes('support'))) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🚫 Blocked external help redirect');
                        console.log('🤖 Opening internal chatbot instead');
                        if (window.chatbot) {
                            window.chatbot.toggleChat();
                        }
                        return false;
                    }
                }
            }
        }, true);
    }
    
    // Initialize protection when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', blockExternalChatbots);
    } else {
        blockExternalChatbots();
    }
    
    // Also initialize after a short delay to catch late-loading scripts
    setTimeout(blockExternalChatbots, 100);
    
    console.log('✅ Internal chatbot protection active');
})();
