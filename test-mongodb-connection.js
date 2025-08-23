#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test
 * 
 * This script tests your MongoDB Atlas connection before deployment.
 * Usage: node test-mongodb-connection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('💡 Create a .env file with your MongoDB Atlas connection string:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    process.exit(1);
}

console.log('🧪 Testing MongoDB Atlas Connection...');
console.log('🔗 Connection URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));

async function testConnection() {
    try {
        // Connection options for Atlas
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
        };

        console.log('⏳ Connecting to MongoDB Atlas...');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, options);
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log(`📍 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        console.log(`🔌 Ready State: ${mongoose.connection.readyState}`);
        
        // Test basic operations
        console.log('\n🧪 Testing basic database operations...');
        
        // Create a test collection
        const testCollection = mongoose.connection.db.collection('test_connection');
        
        // Insert test document
        const testDoc = { 
            test: true, 
            timestamp: new Date(),
            message: 'Connection test successful'
        };
        
        await testCollection.insertOne(testDoc);
        console.log('✅ Successfully inserted test document');
        
        // Read test document
        const retrievedDoc = await testCollection.findOne({ test: true });
        console.log('✅ Successfully retrieved test document:', retrievedDoc._id);
        
        // Delete test document
        await testCollection.deleteOne({ _id: retrievedDoc._id });
        console.log('✅ Successfully deleted test document');
        
        // Drop test collection
        await testCollection.drop();
        console.log('✅ Successfully cleaned up test collection');
        
        console.log('\n🎉 All tests passed! Your MongoDB Atlas connection is working perfectly.');
        console.log('🚀 Your application is ready to use MongoDB Atlas.');
        
    } catch (error) {
        console.error('\n❌ Connection test failed:');
        
        if (error.name === 'MongooseServerSelectionError') {
            console.error('🔴 Server Selection Error - Could not connect to MongoDB Atlas');
            console.log('\n🔧 Troubleshooting tips:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify your connection string is correct');
            console.log('   3. Ensure your IP address is whitelisted in MongoDB Atlas');
            console.log('   4. Check your username and password');
        } else if (error.name === 'MongoParseError') {
            console.error('🔴 Connection String Parse Error');
            console.log('\n🔧 Troubleshooting tips:');
            console.log('   1. Check your connection string format');
            console.log('   2. Ensure you\'re using mongodb+srv:// format');
            console.log('   3. Verify special characters in password are URL encoded');
        } else {
            console.error('🔴 Unexpected error:', error.message);
        }
        
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⚠️  Test interrupted');
    await mongoose.disconnect();
    process.exit(0);
});

// Run the test
testConnection();
