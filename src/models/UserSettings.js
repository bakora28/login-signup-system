// MongoDB User Settings Model - Complete user preferences and configurations
const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // General preferences
    general: {
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'ko']
        },
        timezone: {
            type: String,
            default: 'UTC'
        },
        dateFormat: {
            type: String,
            default: 'MM/dd/yyyy',
            enum: ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']
        },
        timeFormat: {
            type: String,
            default: '12h',
            enum: ['12h', '24h']
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    
    // Privacy settings
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'private', 'friends-only'],
            default: 'public'
        },
        showOnlineStatus: {
            type: Boolean,
            default: true
        },
        allowSearchEngineIndexing: {
            type: Boolean,
            default: true
        },
        dataProcessingConsent: {
            type: Boolean,
            default: false
        },
        analyticsConsent: {
            type: Boolean,
            default: false
        }
    },
    
    // Notification settings
    notifications: {
        email: {
            enabled: {
                type: Boolean,
                default: true
            },
            frequency: {
                type: String,
                enum: ['instant', 'daily', 'weekly', 'never'],
                default: 'instant'
            },
            types: {
                security: { type: Boolean, default: true },
                account: { type: Boolean, default: true },
                marketing: { type: Boolean, default: false },
                updates: { type: Boolean, default: true },
                social: { type: Boolean, default: true }
            }
        },
        sms: {
            enabled: {
                type: Boolean,
                default: false
            },
            types: {
                security: { type: Boolean, default: true },
                account: { type: Boolean, default: false }
            }
        },
        push: {
            enabled: {
                type: Boolean,
                default: true
            },
            types: {
                messages: { type: Boolean, default: true },
                updates: { type: Boolean, default: true },
                marketing: { type: Boolean, default: false }
            }
        }
    },
    
    // Security settings
    security: {
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorMethod: {
            type: String,
            enum: ['sms', 'email', 'authenticator'],
            default: 'email'
        },
        loginNotifications: {
            type: Boolean,
            default: true
        },
        sessionTimeout: {
            type: Number,
            default: 24 // hours
        },
        allowMultipleSessions: {
            type: Boolean,
            default: true
        },
        passwordChangeReminder: {
            type: Boolean,
            default: true
        }
    },
    
    // Theme and appearance
    appearance: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'light'
        },
        colorScheme: {
            type: String,
            default: 'blue'
        },
        fontSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        reducedMotion: {
            type: Boolean,
            default: false
        },
        highContrast: {
            type: Boolean,
            default: false
        }
    },
    
    // Data management
    dataManagement: {
        autoBackup: {
            type: Boolean,
            default: true
        },
        backupFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'weekly'
        },
        dataRetention: {
            type: Number,
            default: 365 // days
        },
        exportFormat: {
            type: String,
            enum: ['json', 'csv', 'xml'],
            default: 'json'
        }
    },
    
    // Communication preferences
    communication: {
        preferredContactMethod: {
            type: String,
            enum: ['email', 'phone', 'sms', 'in-app'],
            default: 'email'
        },
        allowDirectMessages: {
            type: Boolean,
            default: true
        },
        autoReplyEnabled: {
            type: Boolean,
            default: false
        },
        autoReplyMessage: {
            type: String,
            maxlength: 200
        }
    },
    
    // Integration settings
    integrations: {
        socialLogin: {
            google: { type: Boolean, default: false },
            facebook: { type: Boolean, default: false },
            twitter: { type: Boolean, default: false },
            linkedin: { type: Boolean, default: false }
        },
        apiAccess: {
            enabled: { type: Boolean, default: false },
            apiKey: String,
            rateLimitTier: {
                type: String,
                enum: ['basic', 'standard', 'premium'],
                default: 'basic'
            }
        }
    },
    
    // Custom settings (extensible)
    customSettings: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    
    // Settings history for audit trail
    settingsHistory: [{
        setting: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedAt: {
            type: Date,
            default: Date.now
        },
        changedBy: String // IP address or user agent
    }]
}, {
    timestamps: true
});

// Method to update a specific setting with history tracking
userSettingsSchema.methods.updateSetting = async function(settingPath, newValue, metadata = {}) {
    const oldValue = this.get(settingPath);
    
    // Add to history
    this.settingsHistory.push({
        setting: settingPath,
        oldValue: oldValue,
        newValue: newValue,
        changedBy: metadata.ip || 'unknown'
    });
    
    // Update the setting
    this.set(settingPath, newValue);
    
    return await this.save();
};

// Static method to get default settings for a new user
userSettingsSchema.statics.createDefaultSettings = async function(userId) {
    try {
        const defaultSettings = new this({ userId });
        return await defaultSettings.save();
    } catch (error) {
        throw error;
    }
};

// Static method to get settings with fallback to defaults
userSettingsSchema.statics.getUserSettings = async function(userId) {
    try {
        let settings = await this.findOne({ userId });
        
        if (!settings) {
            settings = await this.createDefaultSettings(userId);
        }
        
        return settings;
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('UserSettings', userSettingsSchema);
