// Simple in-memory storage to replace MongoDB for development
let users = [];

// Initialize with default admin user and test users
if (users.length === 0) {
    users.push({
        id: 'admin-001',
        name: 'Administrator',
        email: 'admin@system.com',
        password: 'admin123',
        phonenumber: '+1234567890',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        lastLogin: null
    });

    // Add some test users for admin to manage
    users.push({
        id: 'user-001',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phonenumber: '+1234567891',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        lastLogin: null
    });

    users.push({
        id: 'user-002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phonenumber: '+1234567892',
        role: 'user',
        status: 'inactive',
        createdAt: new Date(),
        lastLogin: null
    });

    users.push({
        id: 'user-003',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'password123',
        phonenumber: '+1234567893',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        lastLogin: null
    });

    console.log('✅ Initialized system with admin and test users');
}

class UserStorage {
    // Add a new user
    static async insertMany(userData) {
        // Simulate async operation
        return new Promise((resolve, reject) => {
            try {
                // Add default properties to new users
                const enhancedUsers = userData.map(user => ({
                    ...user,
                    id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    role: user.role || 'user',
                    status: user.status || 'active',
                    createdAt: new Date(),
                    lastLogin: null
                }));
                
                // Add user to in-memory array
                users.push(...enhancedUsers);
                console.log('User added to storage:', enhancedUsers);
                resolve(enhancedUsers);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Find a user by name, email, or ID
    static async findOne(query) {
        return new Promise((resolve, reject) => {
            try {
                let user = null;
                
                if (query.name) {
                    user = users.find(user => user.name === query.name);
                } else if (query.email) {
                    user = users.find(user => user.email === query.email);
                } else if (query.id) {
                    user = users.find(user => user.id === query.id);
                }
                
                resolve(user || null);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get all users (for admin dashboard)
    static getAllUsers() {
        return users;
    }

    // Get all regular users (exclude admins)
    static getRegularUsers() {
        return users.filter(user => user.role !== 'admin');
    }

    // Update user status
    static async updateUserStatus(userId, status) {
        return new Promise((resolve, reject) => {
            try {
                const userIndex = users.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    users[userIndex].status = status;
                    users[userIndex].updatedAt = new Date();
                    console.log(`User ${userId} status updated to: ${status}`);
                    resolve(users[userIndex]);
                } else {
                    reject(new Error('User not found'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // Delete user
    static async deleteUser(userId) {
        return new Promise((resolve, reject) => {
            try {
                const userIndex = users.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    const deletedUser = users.splice(userIndex, 1)[0];
                    console.log(`User deleted:`, deletedUser);
                    resolve(deletedUser);
                } else {
                    reject(new Error('User not found'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // Update user details
    static async updateUser(userId, updateData) {
        return new Promise((resolve, reject) => {
            try {
                const userIndex = users.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date() };
                    console.log(`User ${userId} updated:`, users[userIndex]);
                    resolve(users[userIndex]);
                } else {
                    reject(new Error('User not found'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // Update last login time
    static async updateLastLogin(userId) {
        return new Promise((resolve, reject) => {
            try {
                const userIndex = users.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    users[userIndex].lastLogin = new Date();
                    resolve(users[userIndex]);
                }
                resolve(null);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Clear all users (for testing)
    static clearAll() {
        users = [];
    }

    // Get user statistics
    static getStats() {
        const totalUsers = users.length;
        const activeUsers = users.filter(user => user.status === 'active').length;
        const inactiveUsers = users.filter(user => user.status === 'inactive').length;
        const adminUsers = users.filter(user => user.role === 'admin').length;
        const regularUsers = users.filter(user => user.role === 'user').length;

        return {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            admins: adminUsers,
            regular: regularUsers
        };
    }
}

module.exports = UserStorage;
