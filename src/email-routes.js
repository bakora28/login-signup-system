const express = require('express');
const router = express.Router();
const EmailService = require('./services/EmailService');

const emailService = new EmailService();

// Test email route
router.post('/test-email', async (req, res) => {
    try {
        const { toEmail } = req.body;
        
        if (!toEmail) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email address is required' 
            });
        }

        const result = await emailService.sendTestEmail(toEmail);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Test email sent successfully!',
                messageId: result.messageId 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Error in test email route:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send test email' 
        });
    }
});

// Send welcome email route
router.post('/welcome-email', async (req, res) => {
    try {
        const { userEmail, username } = req.body;
        
        if (!userEmail || !username) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and username are required' 
            });
        }

        const result = await emailService.sendWelcomeEmail(userEmail, username);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Welcome email sent successfully!',
                messageId: result.messageId 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Error in welcome email route:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send welcome email' 
        });
    }
});

// Send password reset email route
router.post('/password-reset-email', async (req, res) => {
    try {
        const { userEmail, resetToken } = req.body;
        
        if (!userEmail || !resetToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and reset token are required' 
            });
        }

        const result = await emailService.sendPasswordResetEmail(userEmail, resetToken);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Password reset email sent successfully!',
                messageId: result.messageId 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        console.error('Error in password reset email route:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send password reset email' 
        });
    }
});

module.exports = router;
