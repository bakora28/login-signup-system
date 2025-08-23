# MongoDB Atlas Setup Guide

This guide will help you set up a free MongoDB Atlas cluster for your login-signup system.

## 🎯 Overview

MongoDB Atlas is a cloud-hosted MongoDB service that offers a free tier (M0) perfect for development and small applications.

## 📋 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. **Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**
2. **Click "Try Free"** or **"Sign Up"**
3. **Create your account** with email/password or Google/GitHub
4. **Verify your email** if required

### Step 2: Create a Free Cluster (M0)

1. **Choose "Build a Database"**
2. **Select "M0 Cluster"** (Free tier)
   - **Cloud Provider**: AWS (recommended)
   - **Region**: Choose closest to your location
   - **Cluster Name**: `login-signup-cluster` (or any name you prefer)
3. **Click "Create Cluster"**
4. **Wait 1-3 minutes** for cluster creation

### Step 3: Create Database User

1. **In the "Security" tab**, click **"Database Access"**
2. **Click "Add New Database User"**
3. **Configure the user**:
   - **Authentication Method**: Password
   - **Username**: `loginapp_user` (or your preferred username)
   - **Password**: Generate a secure password or create your own
   - **Database User Privileges**: "Read and write to any database"
4. **Click "Add User"**
5. **⚠️ IMPORTANT**: Save your username and password securely!

### Step 4: Configure Network Access

1. **In the "Security" tab**, click **"Network Access"**
2. **Click "Add IP Address"**
3. **Choose one option**:
   
   **Option A: Allow Access from Anywhere (Easier for deployment)**
   - Click "Allow Access from Anywhere"
   - IP Address: `0.0.0.0/0`
   - ⚠️ This is less secure but works for most deployments
   
   **Option B: Add Specific IPs (More Secure)**
   - Add your current IP
   - Add Render's IP ranges (if deploying to Render)
   - You can always modify this later

4. **Click "Confirm"**

### Step 5: Get Connection String

1. **Go to "Database" tab**
2. **Click "Connect" on your cluster**
3. **Choose "Connect your application"**
4. **Select**:
   - **Driver**: Node.js
   - **Version**: 4.1 or later
5. **Copy the connection string** (it looks like):
   ```
   mongodb+srv://<username>:<password>@login-signup-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<username>` and `<password>`** with your actual credentials

### Step 6: Create Database and Collections (Optional)

MongoDB will automatically create the database and collections when your app first writes data, but you can create them manually:

1. **In your cluster**, click **"Browse Collections"**
2. **Click "Add My Own Data"**
3. **Create Database**:
   - **Database Name**: `loginapp`
   - **Collection Name**: `users`
4. **Click "Create"**

## 🔧 Connection String Format

Your final connection string should look like this:
```
mongodb+srv://loginapp_user:yourpassword@login-signup-cluster.xxxxx.mongodb.net/loginapp?retryWrites=true&w=majority
```

**Components**:
- `mongodb+srv://` - The SRV format (keep this!)
- `loginapp_user` - Your database username
- `yourpassword` - Your database password
- `login-signup-cluster.xxxxx.mongodb.net` - Your cluster URL
- `loginapp` - Your database name (optional, can be omitted)

## 🔒 Security Best Practices

1. **Strong Password**: Use a complex password for your database user
2. **IP Restrictions**: Limit access to specific IPs when possible
3. **Environment Variables**: Never hardcode credentials in your code
4. **Regular Rotation**: Change passwords periodically

## 🚀 Using with Your Application

### Local Development

1. **Create a `.env` file** in your project root:
   ```env
   MONGODB_URI=mongodb+srv://loginapp_user:yourpassword@login-signup-cluster.xxxxx.mongodb.net/loginapp?retryWrites=true&w=majority
   ```

2. **Test your connection** by starting your app:
   ```bash
   npm run dev
   ```

3. **Look for the success message**:
   ```
   ✅ Using MongoDB for data storage
   🗄️  Database Status: Connected to MongoDB
   ```

### Render Deployment

1. **In Render Dashboard**, add environment variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your full connection string

2. **Deploy your service** - it will automatically connect to MongoDB Atlas

## 🛠️ Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check username/password in connection string
   - Ensure user has correct permissions

2. **"Connection timeout"**
   - Check network access settings
   - Verify IP whitelist includes your server's IP

3. **"Database not found"**
   - This is normal - MongoDB creates databases automatically
   - Or manually create the database in Atlas

4. **"SRV record not found"**
   - Keep the `mongodb+srv://` format
   - Don't change it to `mongodb://`

### Testing Connection

You can test your connection with this simple Node.js script:

```javascript
const mongoose = require('mongoose');

const MONGODB_URI = 'your_connection_string_here';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
```

## 📊 Atlas Dashboard Features

Once connected, you can use the Atlas dashboard to:
- **Browse Collections**: View your data
- **Performance**: Monitor database performance
- **Alerts**: Set up monitoring alerts
- **Backup**: Configure automated backups (paid feature)

## 💰 Free Tier Limits

M0 Free tier includes:
- **512 MB storage**
- **Shared RAM**
- **No backup** (manual export only)
- **Perfect for development** and small applications

## 🔄 Next Steps

After setting up MongoDB Atlas:
1. ✅ Add `MONGODB_URI` to your environment variables
2. ✅ Test local connection
3. ✅ Deploy to Render with the connection string
4. ✅ Monitor your application logs for successful database connection

---

**Need Help?** Check the [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/) or contact support through the Atlas dashboard.
