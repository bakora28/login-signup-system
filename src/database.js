// MongoDB Connection and Configuration
const mongoose = require('mongoose');

// MongoDB connection string - can be local or remote
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/login-signup-app';

class Database {
    static async connect() {
        try {
            // Set mongoose options
            const options = {
                // Modern connection options
                useNewUrlParser: true,
                useUnifiedTopology: true,
                
                // Connection timeout
                serverSelectionTimeoutMS: 5000,
                
                // Database name
                dbName: 'login-signup-app'
            };

            // Connect to MongoDB
            await mongoose.connect(MONGODB_URI, options);
            
            console.log('🗄️  Connected to MongoDB successfully');
            console.log(`📍 Database: ${mongoose.connection.name}`);
            console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            
            // Initialize default data
            await this.initializeData();
            
        } catch (error) {
            console.error('❌ MongoDB connection error:', error.message);
            
            // Fall back to in-memory storage if MongoDB is not available
            console.log('🔄 Falling back to in-memory storage...');
            return false;
        }
        
        return true;
    }

    static async initializeData() {
        try {
            const User = require('./models/User');
            
            // Create initial admin user with proper password hashing
            const adminExists = await User.findOne({ role: 'admin' });
            
            if (!adminExists) {
                const admin = new User({
                    name: 'Administrator',
                    email: 'admin@system.com',
                    password: 'admin123', // This will be hashed by the pre-save hook
                    phonenumber: '+1234567890',
                    role: 'admin',
                    status: 'active'
                });
                
                await admin.save();
                console.log('✅ Created initial admin user with hashed password');
            } else {
                console.log('✅ Admin user already exists');
            }
            
            // Create some test users if none exist
            const userCount = await User.countDocuments({ role: 'user' });
            
            if (userCount === 0) {
                const testUsers = [
                    {
                        name: 'John Doe',
                        email: 'john@example.com',
                        password: 'password123',
                        phonenumber: '+1234567891',
                        role: 'user',
                        status: 'active'
                    },
                    {
                        name: 'Jane Smith',
                        email: 'jane@example.com',
                        password: 'password123',
                        phonenumber: '+1234567892',
                        role: 'user',
                        status: 'inactive'
                    },
                    {
                        name: 'Bob Johnson',
                        email: 'bob@example.com',
                        password: 'password123',
                        phonenumber: '+1234567893',
                        role: 'user',
                        status: 'active'
                    }
                ];
                
                for (const userData of testUsers) {
                    const user = new User(userData);
                    await user.save(); // This will hash the password
                }
                
                console.log('✅ Created test users with hashed passwords');
            }
            
            // Display current stats
            const stats = await User.getStats();
            console.log('📊 Database initialized with:', stats);
            
        } catch (error) {
            console.error('Error initializing database data:', error);
        }
    }

    static async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
        }
    }

    static isConnected() {
        return mongoose.connection.readyState === 1;
    }

    static getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        return states[mongoose.connection.readyState] || 'unknown';
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB disconnected');
});

// Handle app termination
process.on('SIGINT', async () => {
    await Database.disconnect();
    process.exit(0);
});

module.exports = Database;
