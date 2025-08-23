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
            
            // Create initial admin user
            await User.createInitialAdmin();
            
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
                
                await User.insertMany(testUsers);
                console.log('✅ Created test users');
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
