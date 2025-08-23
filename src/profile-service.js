// Profile Service with Local Storage
const fs = require('fs').promises;
const path = require('path');

class ProfileService {
    static async createProfile(userId, profileData) {
        try {
            const profile = {
                userId: userId,
                name: profileData.name,
                email: profileData.email,
                phoneNumber: profileData.phoneNumber || null,
                profilePicture: profileData.profilePicture || null,
                bio: profileData.bio || '',
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: true,
                preferences: {
                    notifications: true,
                    privacy: 'public'
                }
            };

            // Store profile data in local storage for now
            await this.saveProfileToLocal(profile);
            return profile;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }

    static async getProfile(userId) {
        try {
            const profile = await this.getProfileFromLocal(userId);
            
            if (profile && profile.profilePicture) {
                // Use local file path
                profile.profilePictureUrl = profile.profilePicture;
            }
            
            return profile;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }

    static async updateProfilePicture(userId, localPath) {
        try {
            const profile = await this.getProfileFromLocal(userId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Delete old profile picture if exists and it's a local file
            if (profile.profilePicture && profile.profilePicture.startsWith('/public/')) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const oldFilePath = path.join(__dirname, '..', profile.profilePicture);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                } catch (error) {
                    console.warn('Error deleting old profile picture:', error);
                }
            }

            // Update profile with new picture path
            profile.profilePicture = localPath;
            profile.updatedAt = new Date().toISOString();
            await this.saveProfileToLocal(profile);

            // Return the local URL
            return localPath;
        } catch (error) {
            console.error('Error updating profile picture locally:', error);
            throw error;
        }
    }

    // Local storage helpers (temporary until database is set up)
    static async saveProfileToLocal(profile) {
        const dataDir = path.join(__dirname, '../data');
        const filePath = path.join(dataDir, `${profile.userId}.json`);

        try {
            await fs.mkdir(dataDir, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(profile, null, 2));
        } catch (error) {
            console.error('Error saving profile to local storage:', error);
            throw error;
        }
    }

    static async getProfileFromLocal(userId) {
        const filePath = path.join(__dirname, '../data', `${userId}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    static async updateLastLogin(userId) {
        try {
            const profile = await this.getProfileFromLocal(userId);
            if (profile) {
                profile.lastLogin = new Date().toISOString();
                await this.saveProfileToLocal(profile);
            }
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }

    static async getProfileStats(userId) {
        try {
            const profile = await this.getProfile(userId);
            if (!profile) return null;

            const joinDate = new Date(profile.joinDate);
            const lastLogin = new Date(profile.lastLogin);
            const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysSinceLastLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

            return {
                memberSince: joinDate.toLocaleDateString(),
                daysSinceJoin,
                lastLoginDate: lastLogin.toLocaleDateString(),
                daysSinceLastLogin,
                isRecentlyActive: daysSinceLastLogin <= 7,
                profileCompletion: this.calculateProfileCompletion(profile)
            };
        } catch (error) {
            console.error('Error getting profile stats:', error);
            throw error;
        }
    }

    static calculateProfileCompletion(profile) {
        const fields = ['name', 'email', 'phoneNumber', 'bio', 'profilePicture'];
        const completed = fields.filter(field => profile[field] && profile[field].trim() !== '').length;
        return Math.round((completed / fields.length) * 100);
    }
}

module.exports = ProfileService;
