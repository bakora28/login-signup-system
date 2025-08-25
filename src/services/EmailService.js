const AWS = require('aws-sdk');

class EmailService {
    constructor() {
        // Configure AWS SES
        this.ses = new AWS.SES({
            region: process.env.AWS_SES_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });
        
        this.fromEmail = process.env.AWS_SES_FROM_EMAIL;
    }

    // Send welcome email when user signs up
    async sendWelcomeEmail(userEmail, username) {
        try {
            const params = {
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [userEmail]
                },
                Message: {
                    Subject: {
                        Data: `Welcome to Our App, ${username}!`,
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Html: {
                            Data: `
                                <h2>Welcome to Our App!</h2>
                                <p>Hello ${username},</p>
                                <p>Thank you for signing up! Your account has been created successfully.</p>
                                <p>We're excited to have you on board!</p>
                                <br>
                                <p>Best regards,</p>
                                <p>The App Team</p>
                            `,
                            Charset: 'UTF-8'
                        },
                        Text: {
                            Data: `Welcome to Our App, ${username}! Thank you for signing up.`,
                            Charset: 'UTF-8'
                        }
                    }
                }
            };

            const result = await this.ses.sendEmail(params).promise();
            console.log('✅ Welcome email sent successfully:', result.MessageId);
            return { success: true, messageId: result.MessageId };
        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(userEmail, resetToken) {
        try {
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            
            const params = {
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [userEmail]
                },
                Message: {
                    Subject: {
                        Data: 'Password Reset Request',
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Html: {
                            Data: `
                                <h2>Password Reset Request</h2>
                                <p>You requested a password reset for your account.</p>
                                <p>Click the link below to reset your password:</p>
                                <p><a href="${resetLink}">Reset Password</a></p>
                                <p>If you didn't request this, please ignore this email.</p>
                                <br>
                                <p>Best regards,</p>
                                <p>The App Team</p>
                            `,
                            Charset: 'UTF-8'
                        },
                        Text: {
                            Data: `Password Reset Request. Click here: ${resetLink}`,
                            Charset: 'UTF-8'
                        }
                    }
                }
            };

            const result = await this.ses.sendEmail(params).promise();
            console.log('✅ Password reset email sent successfully:', result.MessageId);
            return { success: true, messageId: result.MessageId };
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send account verification email
    async sendVerificationEmail(userEmail, verificationToken) {
        try {
            const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
            
            const params = {
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [userEmail]
                },
                Message: {
                    Subject: {
                        Data: 'Verify Your Email Address',
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Html: {
                            Data: `
                                <h2>Verify Your Email Address</h2>
                                <p>Please verify your email address by clicking the link below:</p>
                                <p><a href="${verificationLink}">Verify Email</a></p>
                                <p>This link will expire in 24 hours.</p>
                                <br>
                                <p>Best regards,</p>
                                <p>The App Team</p>
                            `,
                            Charset: 'UTF-8'
                        },
                        Text: {
                            Data: `Verify your email: ${verificationLink}`,
                            Charset: 'UTF-8'
                        }
                    }
                }
            };

            const result = await this.ses.sendEmail(params).promise();
            console.log('✅ Verification email sent successfully:', result.MessageId);
            return { success: true, messageId: result.MessageId };
        } catch (error) {
            console.error('❌ Error sending verification email:', error);
            return { success: false, error: error.message };
        }
    }

    // Test email functionality
    async sendTestEmail(toEmail) {
        try {
            const params = {
                Source: this.fromEmail,
                Destination: {
                    ToAddresses: [toEmail]
                },
                Message: {
                    Subject: {
                        Data: 'Test Email from Your App',
                        Charset: 'UTF-8'
                    },
                    Body: {
                        Text: {
                            Data: 'This is a test email from your application using AWS SES!',
                            Charset: 'UTF-8'
                        }
                    }
                }
            };

            const result = await this.ses.sendEmail(params).promise();
            console.log('✅ Test email sent successfully:', result.MessageId);
            return { success: true, messageId: result.MessageId };
        } catch (error) {
            console.error('❌ Error sending test email:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;
