# 🗄️ MongoDB Setup Guide

This application now supports MongoDB for persistent data storage!

## 🚀 Quick Start (No Setup Required)

The application will automatically fall back to **in-memory storage** if MongoDB is not available. You can start using the app immediately without any database setup.

## 📦 Option 1: Local MongoDB Installation

### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install with default settings
3. MongoDB will run automatically on `mongodb://localhost:27017`

### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu):
```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## ☁️ Option 2: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Get your connection string
5. Set the environment variable:

```bash
# In your .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/login-signup-app
```

## 🔧 Configuration

### Environment Variables

Create or update your `.env` file:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/login-signup-app

# Optional: Database name (default: login-signup-app)
DB_NAME=your-app-name

# Other existing variables...
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

### Connection String Examples

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/login-signup-app

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/login-signup-app

# MongoDB with authentication
MONGODB_URI=mongodb://username:password@localhost:27017/login-signup-app

# Custom port
MONGODB_URI=mongodb://localhost:27018/login-signup-app
```

## 🎯 Features

### ✅ What Works with MongoDB:
- **Persistent user accounts** (survive server restarts)
- **Password hashing** with bcrypt
- **User authentication** with secure password comparison
- **Admin management** with role-based access
- **User statistics** and reporting
- **Profile management** (still uses local files)

### 🔄 Automatic Fallback:
- If MongoDB connection fails, app uses in-memory storage
- No downtime or errors
- Clear status messages in console

## 📊 Database Structure

### Users Collection:
```javascript
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$12$hashed_password",
  "phonenumber": "+1234567890",
  "role": "user", // or "admin"
  "status": "active", // or "inactive"
  "lastLogin": Date,
  "createdAt": Date,
  "updatedAt": Date
}
```

## 🧪 Testing the Setup

1. Start your application:
```bash
node src/index.js
```

2. Look for these status messages:
```
✅ Using MongoDB for data storage
🗄️ Connected to MongoDB successfully
📍 Database: login-signup-app
```

3. Or if MongoDB isn't available:
```
⚠️ Using in-memory storage (MongoDB not available)
💡 To use MongoDB: Install MongoDB and set MONGODB_URI
```

## 🔍 Verification

### Check if MongoDB is Working:
1. Register a new user
2. Restart the server (`Ctrl+C` then `node src/index.js`)
3. Try to login with the same user
4. If login works after restart = MongoDB is working! 🎉

### Admin Panel:
- Login as admin: `admin@system.com` / `admin123`
- Check user statistics
- Create/manage users

## 🛠️ Troubleshooting

### Connection Issues:
```bash
# Check if MongoDB is running
# Windows:
net start | findstr MongoDB

# macOS/Linux:
ps aux | grep mongod
```

### Common Errors:
1. **"MongoDB connection error"** - MongoDB not installed/running
2. **"Authentication failed"** - Wrong credentials in connection string
3. **"Database not found"** - Will be created automatically

### Getting Help:
- Check MongoDB logs
- Verify connection string format
- Ensure MongoDB service is running
- Check firewall settings for cloud databases

## 💡 Production Tips

1. **Use MongoDB Atlas** for production
2. **Enable authentication** on local MongoDB
3. **Use environment variables** for sensitive data
4. **Regular backups** of your database
5. **Monitor connection health**

## 🎯 Migration Notes

- Existing data in memory will be lost when switching to MongoDB
- Admin user is automatically created in MongoDB
- Test users are created if none exist
- Profile data (JSON files) remains separate

---

**Your app now has enterprise-level database support!** 🚀
