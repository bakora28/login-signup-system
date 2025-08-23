// MongoDB User Storage Service - Enhanced with complete data management
const User = require('./models/User');
const UserDataService = require('./services/UserDataService');

class MongoUserStorage {
    // Add a new user (for registration) - Enhanced with complete profile creation
    static async insertMany(userData) {
        try {
            const createdUsers = [];
            
            for (const userInfo of userData) {
                const user = await UserDataService.createUser(userInfo);
                createdUsers.push(user);
            }
            
            console.log('✅ Complete user accounts created:', createdUsers.length);
            return createdUsers;
        } catch (error) {
            // Handle duplicate email error
            if (error.code === 11000) {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    // Find a user by query (email, name, or id)
    static async findOne(query) {
        try {
            let user = null;
            
            if (query.email) {
                user = await User.findOne({ email: query.email });
            } else if (query.name) {
                user = await User.findOne({ name: query.name });
            } else if (query.id || query._id) {
                user = await User.findById(query.id || query._id);
            }
            
            return user;
        } catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    }

    // Get all users (for admin dashboard)
    static getAllUsers() {
        try {
            return User.find({}).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    // Get all regular users (exclude admins)
    static getRegularUsers() {
        try {
            return User.find({ role: 'user' }).sort({ createdAt: -1 });
        } catch (error) {
            console.error('Error getting regular users:', error);
            return [];
        }
    }

    // Update user status (activate/deactivate)
    static async updateUserStatus(userId, status) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { status: status },
                { new: true, runValidators: true }
            );
            
            if (!user) {
                throw new Error('User not found');
            }
            
            console.log(`User ${userId} status updated to: ${status}`);
            return user;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }

    // Delete user
    static async deleteUser(userId) {
        try {
            const user = await User.findByIdAndDelete(userId);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            console.log('User deleted:', user.email);
            return user;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Update user details
    static async updateUser(userId, updateData) {
        try {
            // Remove sensitive fields that shouldn't be updated directly
            const { password, role, ...safeUpdateData } = updateData;
            
            const user = await User.findByIdAndUpdate(
                userId,
                safeUpdateData,
                { new: true, runValidators: true }
            );
            
            if (!user) {
                throw new Error('User not found');
            }
            
            console.log(`User ${userId} updated`);
            return user;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Update last login time
    static async updateLastLogin(userId) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { lastLogin: new Date() },
                { new: true }
            );
            
            return user;
        } catch (error) {
            console.error('Error updating last login:', error);
            return null;
        }
    }

    // Create a new user with validation
    static async createUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            
            console.log('New user created:', user.email);
            return user;
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    // Authenticate user (login) - Enhanced with complete data access
    static async authenticateUser(email, password) {
        try {
            return await UserDataService.authenticateUser(email, password);
        } catch (error) {
            console.error('Error authenticating user:', error);
            return null;
        }
    }

    // Get user statistics - Enhanced with complete data stats
    static async getStats() {
        try {
            return await UserDataService.getUserStats();
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                total: 0,
                active: 0,
                inactive: 0,
                admins: 0,
                regular: 0,
                totalProfiles: 0,
                totalFiles: 0
            };
        }
    }
    
    // ============ ENHANCED METHODS FOR COMPLETE DATA MANAGEMENT ============
    
    // Get complete user data (profile, settings, files)
    static async getCompleteUserData(userId) {
        try {
            return await UserDataService.getCompleteUserData(userId);
        } catch (error) {
            console.error('Error getting complete user data:', error);
            throw error;
        }
    }
    
    // Profile management
    static async getUserProfile(userId) {
        try {
            return await UserDataService.getUserProfile(userId);
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }
    
    static async updateUserProfile(userId, profileData) {
        try {
            return await UserDataService.updateUserProfile(userId, profileData);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }
    
    // File management
    static async saveFileMetadata(fileData) {
        try {
            return await UserDataService.saveFileMetadata(fileData);
        } catch (error) {
            console.error('Error saving file metadata:', error);
            throw error;
        }
    }
    
    static async updateProfilePicture(userId, fileData) {
        try {
            return await UserDataService.updateProfilePicture(userId, fileData);
        } catch (error) {
            console.error('Error updating profile picture:', error);
            throw error;
        }
    }
    
    static async getUserFiles(userId, category = null) {
        try {
            return await UserDataService.getUserFiles(userId, category);
        } catch (error) {
            console.error('Error getting user files:', error);
            throw error;
        }
    }
    
    // Settings management
    static async getUserSettings(userId) {
        try {
            return await UserDataService.getUserSettings(userId);
        } catch (error) {
            console.error('Error getting user settings:', error);
            throw error;
        }
    }
    
    static async updateUserSetting(userId, settingPath, value, metadata = {}) {
        try {
            return await UserDataService.updateUserSetting(userId, settingPath, value, metadata);
        } catch (error) {
            console.error('Error updating user setting:', error);
            throw error;
        }
    }
    
    // Data export
    static async exportUserData(userId, format = 'json') {
        try {
            return await UserDataService.exportUserData(userId, format);
        } catch (error) {
            console.error('Error exporting user data:', error);
            throw error;
        }
    }

    // Clear all users (for testing - use with caution!)
    static async clearAll() {
        try {
            await User.deleteMany({});
            console.log('All users cleared');
        } catch (error) {
            console.error('Error clearing users:', error);
        }
    }

    // Change user password
    static async changePassword(userId, newPassword) {
        try {
            const user = await User.findById(userId);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            user.password = newPassword;
            await user.save(); // This will trigger the password hashing middleware
            
            console.log(`Password changed for user: ${user.email}`);
            return user;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

module.exports = MongoUserStorage;
