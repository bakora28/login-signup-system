require('dotenv').config();
const express = require('express')
const app = express();
const path = require('path')
const hbs = require('hbs')
const cookieParser = require('cookie-parser')

// Database Connection
const Database = require('./database');

// User Storage - MongoDB storage with fallback
let UserStorage;
let usingMongoDB = false;

// Profile System
const profileRoutes = require('./profile-routes')

// Chatbot System
const chatbotRoutes = require('./chatbot-routes')

// Admin System
const adminRoutes = require('./admin-routes')

const templatePath = path.join(__dirname, '../templates')

app.use(express.json())
app.use(cookieParser())
// to read from template
app.set('view engine', 'hbs')
app.set("views", templatePath)

// Register Handlebars helpers
hbs.registerHelper('eq', function(a, b) {
    return a === b;
});

hbs.registerHelper('if', function(conditional, options) {
    if (conditional) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

hbs.registerHelper('formatDate', function(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
});
// Enable static file serving for CSS and other assets
app.use('/public', express.static(path.join(__dirname, '../public')))

app.use(express.urlencoded({ extended: false }))

// Profile routes
app.use('/profile', profileRoutes)

// Chatbot routes
app.use('/', chatbotRoutes)

// Admin routes
app.use('/', adminRoutes)

// Email routes
const emailRoutes = require('./email-routes')
app.use('/api/email', emailRoutes)

app.get('/', (req,res)=>{
    // Check if user is logged in
    const token = req.cookies?.token;
    let user = null;
    
    if (token) {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            // Token is invalid, user remains null
        }
    }
    
    res.render('home', { user: user });
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/welcome', (req, res) => {
    // This route can be accessed directly, but ideally should come from login/signup
    res.render('welcome', {
        userName: 'Guest',
        userEmail: 'No email provided',
        userPhone: 'No phone provided'
    });
})

app.post("/signup", async (req, res) => {
    try {
        // Verify reCAPTCHA
        const recaptchaResponse = req.body['g-recaptcha-response'];
        if (!recaptchaResponse) {
            return res.send('Please complete the reCAPTCHA verification.');
        }

        // Verify reCAPTCHA with Google (using test secret key for development)
        const axios = require('axios');
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
        
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;
        
        try {
            const recaptchaVerification = await axios.post(verificationUrl);
            if (!recaptchaVerification.data.success) {
                return res.send('reCAPTCHA verification failed. Please try again.');
            }
        } catch (error) {
            console.log('reCAPTCHA verification error:', error.message);
            return res.send('reCAPTCHA verification error. Please try again.');
        }

        const data = {
            name: req.body.name,
            password: req.body.password,
            email: req.body.email,
            phonenumber: req.body.phonenumber,
        }
        await UserStorage.insertMany([data])
        console.log('User registered:', data);
        
        // Create a simple token for the user (for profile access)
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        
        // Get the created user from storage to get the correct ID field
        const createdUser = await UserStorage.findOne({ email: data.email });
        
        const token = jwt.sign(
            { 
                id: usingMongoDB ? createdUser._id : createdUser.id, // Use correct ID field
                email: data.email,
                name: data.name,
                phoneNumber: data.phonenumber
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Redirect to welcome page with user data
        res.render('welcome', {
            userName: data.name,
            userEmail: data.email,
            userPhone: data.phonenumber
        });
    } catch (error) {
        console.log('Error during signup:', error.message);
        res.send('Error during registration. Please try again.')
    }
})


app.post("/login", async (req, res) => {
    try {
        let user;
        
        if (usingMongoDB) {
            // Use MongoDB authentication with password comparison
            user = await UserStorage.authenticateUser(req.body.email, req.body.password);
        } else {
            // Use in-memory storage with plain text comparison
            const check = await UserStorage.findOne({ email: req.body.email });
            if (check && check.password === req.body.password) {
                user = check;
            }
        }
        
        if (user) {
            // Check if account is active
            if (user.status === 'inactive') {
                res.send("Your account has been deactivated. Please contact support for assistance.")
                return;
            }
            
            // Create JWT token
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
            
            const token = jwt.sign(
                { 
                    id: usingMongoDB ? user._id : user.id, // Use correct ID field
                    email: user.email,
                    name: user.name,
                    phoneNumber: user.phonenumber
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Set HTTP-only cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Update last login time
            if (usingMongoDB) {
                await UserStorage.updateLastLogin(user._id);
            } else {
                UserStorage.updateLastLogin(user.id);
            }
            
            // Successful login - redirect to welcome page with user data
            res.render('welcome', {
                userName: user.name,
                userEmail: user.email,
                userPhone: user.phonenumber
            });
        } else {
            res.send("Wrong email or password")
        }

    } catch (error) {
        console.log('Error during login:', error.message);
        res.send('Wrong details or server error')
    }
})

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

const PORT = process.env.PORT || 3002;

// Initialize Database and Storage
async function initializeApp() {
    try {
        // Try to connect to MongoDB
        const mongoConnected = await Database.connect();
        
        if (mongoConnected) {
            // Use MongoDB storage
            UserStorage = require('./mongodb-storage');
            usingMongoDB = true;
            console.log('✅ Using MongoDB for data storage');
        } else {
            // Fall back to in-memory storage
            UserStorage = require('./storage');
            usingMongoDB = false;
            console.log('⚠️  Using in-memory storage (MongoDB not available)');
        }
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`)
            console.log("🎉 Features Enabled!")
            console.log("   ✅ User Profile Dashboard")
            console.log("   ✅ ChatGPT-Powered Assistant")
            console.log("   ✅ File Upload (Profile Pictures)")
            console.log("   ✅ JWT Authentication")
            console.log("   ✅ Admin Management System")
            console.log(`   ${usingMongoDB ? '✅' : '⚠️'} Database: ${usingMongoDB ? 'MongoDB' : 'In-Memory'}`)
            console.log("")
            console.log("📋 Available routes:")
            console.log(`   • Home: http://localhost:${PORT}`)
            console.log(`   • Signup: http://localhost:${PORT}/signup`)
            console.log(`   • Login: http://localhost:${PORT}/login`)
            console.log(`   • Profile Dashboard: http://localhost:${PORT}/profile/dashboard`)
            console.log(`   • Admin Login: http://localhost:${PORT}/admin/login`)
            console.log(`   • Admin Dashboard: http://localhost:${PORT}/admin/dashboard`)
            console.log(`   • Chatbot API: http://localhost:${PORT}/api/chatbot`)
            console.log(`   • FAQ API: http://localhost:${PORT}/api/chatbot/faq`)
            console.log("")
            console.log("🤖 Chatbot Features:")
            console.log("   • Password reset assistance")
            console.log("   • Account creation help") 
            console.log("   • Login troubleshooting")
            console.log("   • Technical support")
            console.log("")
            console.log("💡 Setup Guides:")
            console.log("   • ChatGPT Integration: CHATGPT_SETUP.md")
            console.log("")
            console.log("👑 Admin Access:")
            console.log("   • Default Email: admin@system.com")
            console.log("   • Default Password: admin123")
            console.log("")
            if (usingMongoDB) {
                console.log("🗄️  Database Status: Connected to MongoDB")
            } else {
                console.log("⚠️  Database Status: Using in-memory storage")
                console.log("   💡 To use MongoDB: Install MongoDB and set MONGODB_URI")
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
}

// Start the application
initializeApp();
