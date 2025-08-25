// Profile Service with Local Storage and S3 Support
const fs = require('fs').promises;
const path = require('path');
const S3Service = require('./services/S3Service');

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
            // Safety check for undefined userId
            if (!userId) {
                console.error('getProfile called with undefined userId');
                return null;
            }
            
            // First try to get profile by userId
            let profile = await this.getProfileFromLocal(userId);
            
            // If not found, try to find by email (for backward compatibility)
            if (!profile && userId.includes('@')) {
                profile = await this.findProfileByEmail(userId);
            }
            
            if (profile && profile.profilePicture) {
                // Handle both S3 and local URLs
                if (profile.profilePicture.startsWith('http')) {
                    // S3 URL
                    profile.profilePictureUrl = profile.profilePicture;
                } else {
                    // Local file path
                    profile.profilePictureUrl = profile.profilePicture;
                }
            }
            
            return profile;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    }

    static async updateProfilePicture(userId, pictureData) {
        try {
            const profile = await this.getProfileFromLocal(userId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Handle old profile picture deletion
            if (profile.profilePicture) {
                if (profile.profilePicture.startsWith('http')) {
                    // S3 URL - extract key and delete
                    try {
                        const urlParts = profile.profilePicture.split('/');
                        const key = urlParts.slice(-2).join('/'); // Get last two parts for key
                        await S3Service.deleteFile(key);
                    } catch (error) {
                        console.warn('Error deleting old S3 profile picture:', error);
                    }
                } else if (profile.profilePicture.startsWith('/public/')) {
                    // Local file - delete
                    try {
                        const oldFilePath = path.join(__dirname, '..', profile.profilePicture);
                        if (fs.existsSync(oldFilePath)) {
                            fs.unlinkSync(oldFilePath);
                        }
                    } catch (error) {
                        console.warn('Error deleting old local profile picture:', error);
                    }
                }
            }

            // Update profile with new picture data
            if (typeof pictureData === 'string') {
                // Backward compatibility - just URL string
                profile.profilePicture = pictureData;
            } else {
                // New format with metadata
                profile.profilePicture = pictureData.url;
                profile.profilePictureMetadata = pictureData;
            }
            
            profile.updatedAt = new Date().toISOString();
            await this.saveProfileToLocal(profile);

            // Return the URL
            return typeof pictureData === 'string' ? pictureData : pictureData.url;
        } catch (error) {
            console.error('Error updating profile picture:', error);
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
            console.log(`Profile saved for user: ${profile.userId}`);
        } catch (error) {
            console.error('Error saving profile to local storage:', error);
            throw error;
        }
    }

    static async getProfileFromLocal(userId) {
        const filePath = path.join(__dirname, '../data', `${userId}.json`);

        try {
            const data = await fs.readFile(filePath, 'utf8');
            const profile = JSON.parse(data);
            
            // Verify this profile belongs to the requested user
            if (profile.userId !== userId) {
                console.warn(`Profile mismatch: requested ${userId}, found ${profile.userId}`);
                return null;
            }
            
            return profile;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    // Find profile by email (for backward compatibility)
    static async findProfileByEmail(email) {
        try {
            const dataDir = path.join(__dirname, '../data');
            const files = await fs.readdir(dataDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(dataDir, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const profile = JSON.parse(data);
                    
                    if (profile.email === email) {
                        console.log(`Found profile by email: ${email}`);
                        return profile;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding profile by email:', error);
            return null;
        }
    }

    // Update user details
    static async updateUserDetails(userId, updates) {
        try {
            const profile = await this.getProfileFromLocal(userId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            // Update only allowed fields
            const allowedFields = ['name', 'email', 'phoneNumber', 'bio'];
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    profile[field] = updates[field];
                }
            });

            profile.updatedAt = new Date().toISOString();
            await this.saveProfileToLocal(profile);
            
            return profile;
        } catch (error) {
            console.error('Error updating user details:', error);
            throw error;
        }
    }

    // Update last login time
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

    // Get profile statistics
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

    // Clean up corrupted or mismatched profile data
    static async cleanupCorruptedProfiles() {
        try {
            const dataDir = path.join(__dirname, '../data');
            const files = await fs.readdir(dataDir);
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(dataDir, file);
                        const data = await fs.readFile(filePath, 'utf8');
                        const profile = JSON.parse(data);
                        
                        // Check if profile has required fields
                        if (!profile.userId || !profile.email || !profile.name) {
                            console.log(`Removing corrupted profile: ${file}`);
                            await fs.unlink(filePath);
                            cleanedCount++;
                        }
                    } catch (error) {
                        console.log(`Removing unreadable profile: ${file}`);
                        const filePath = path.join(dataDir, file);
                        await fs.unlink(filePath);
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`Cleaned up ${cleanedCount} corrupted profiles`);
            }
            
            return cleanedCount;
        } catch (error) {
            console.error('Error cleaning up profiles:', error);
            return 0;
        }
    }

    // Get all profile files for debugging
    static async getAllProfileFiles() {
        try {
            const dataDir = path.join(__dirname, '../data');
            const files = await fs.readdir(dataDir);
            const profiles = [];
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(dataDir, file);
                        const data = await fs.readFile(filePath, 'utf8');
                        const profile = JSON.parse(data);
                        profiles.push({
                            file: file,
                            userId: profile.userId,
                            email: profile.email,
                            name: profile.name
                        });
                    } catch (error) {
                        profiles.push({
                            file: file,
                            error: error.message
                        });
                    }
                }
            }
            
            return profiles;
        } catch (error) {
            console.error('Error getting profile files:', error);
            return [];
        }
    }

    static calculateProfileCompletion(profile) {
        const fields = ['name', 'email', 'phoneNumber', 'bio', 'profilePicture'];
        const completed = fields.filter(field => profile[field] && profile[field].trim() !== '').length;
        return Math.round((completed / fields.length) * 100);
    }
}

module.exports = ProfileService;
