# 📧 Email Setup Guide for OTP Authentication

The AI-First Academy uses One-Time Password (OTP) codes for secure authentication. This guide shows you how to set up email delivery for OTP codes.

## 🚀 Quick Start (Development)

For **immediate testing**, no setup is required! The system will:
- ✅ Display OTP codes in the server console
- ✅ Log detailed email information for debugging
- ✅ Work out of the box for development

Just start the server with `pnpm dev` and look for the OTP code in the console output.

## 🔧 Production Setup Options

Choose one of these options for production email delivery:

### Option 1: Resend API (Recommended)
**Best for production** - Reliable, fast, and affordable.

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to your `.env` file:
```env
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=AI-First Academy <no-reply@yourdomain.com>
```

### Option 2: Gmail (Easy Setup)
**Best for quick setup** - Uses your existing Gmail account.

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Add to your `.env` file:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### Option 3: Custom SMTP
**Best for existing email infrastructure** - Use any SMTP server.

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
SMTP_FROM=AI-First Academy <no-reply@yourdomain.com>
```

### Option 4: Ethereal (Testing Only)
**Automatic for development** - Creates temporary test accounts.
- No configuration needed
- Preview URLs logged to console
- Perfect for testing email layouts

## 🧪 Testing Your Setup

1. Start the server: `pnpm dev`
2. Try to sign up or log in on the frontend
3. Check the server console for:
   - ✅ "Email successfully sent via [Service]"
   - 🔑 The OTP code (in development mode)
   - 📧 Preview URL (if using Ethereal)

## 🔍 Troubleshooting

### OTP Not Appearing in Console?
- Check that the server is running
- Look for error messages in the console
- Verify the authentication flow reached the OTP step

### Email Not Being Sent?
The system tries email services in this order:
1. Resend → 2. Gmail → 3. SMTP → 4. Ethereal → 5. Console

If all configured services fail, the OTP will still appear in the console as a fallback.

### Common Issues:
- **Gmail**: Make sure to use an "App Password", not your regular password
- **SMTP**: Check that your SMTP settings are correct
- **Resend**: Verify your domain is configured and API key is valid

## 📋 Environment Variables Summary

```env
# Basic Configuration
NODE_ENV=development

# Option 1: Resend (Production)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=AI-First Academy <no-reply@yourdomain.com>

# Option 2: Gmail (Easy)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Option 3: SMTP (Custom)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
SMTP_FROM=AI-First Academy <no-reply@yourdomain.com>
```

## ✅ Development Checklist

- [ ] Server starts without errors
- [ ] Can access the signup/login pages
- [ ] OTP codes appear in console when testing auth
- [ ] Can successfully verify OTP codes
- [ ] Choose and configure a production email service

## 🆘 Need Help?

If you're still having issues:
1. Check the server console for detailed error messages
2. Verify your environment variables are correctly set
3. Test with the console fallback first (no configuration needed)
4. Try the Ethereal option for development testing

The system is designed to work immediately for development, so you should see OTP codes in the console even without any email configuration!
