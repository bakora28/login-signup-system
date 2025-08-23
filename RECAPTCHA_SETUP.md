# reCAPTCHA Setup Guide

## Remove "This reCAPTCHA is for testing purposes only" Message

The warning message appears because we're using Google's test keys. To remove it, you need to get your own reCAPTCHA keys.

### Step 1: Get Real reCAPTCHA Keys

1. Go to [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin/create)
2. Sign in with your Google account
3. Create a new site:
   - **Label**: Your website name
   - **reCAPTCHA type**: reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains**: Add your domain (e.g., `localhost`, `yoursite.com`)
4. Accept the reCAPTCHA Terms of Service
5. Click **Submit**

### Step 2: Replace Test Keys

You'll get two keys:
- **Site Key** (public): Used in the frontend
- **Secret Key** (private): Used in the backend

### Step 3: Update Your Code

**Frontend (templates/signup.hbs):**
```html
<!-- Replace the test site key -->
<div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY_HERE"></div>
```

**Backend (src/index.js):**
```javascript
// Replace the test secret key
const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';
```

### Step 4: Environment Variables (Recommended)

Create a `.env` file in your project root:
```
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

Then use:
```javascript
const secretKey = process.env.RECAPTCHA_SECRET_KEY;
```

### Current Test Keys (Shows Warning)
- **Site Key**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

**Note**: Test keys always show the warning message. Only real keys from Google will remove it.
