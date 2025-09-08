# Netlify Deployment Guide for AI First Academy

This guide will walk you through deploying the AI First Academy application to Netlify. The application consists of a full-stack setup with a frontend (React + Vite) and a serverless backend.

## 📁 Project Structure Overview

```
aifirstacademy/
├── client/                    # React frontend application
│   ├── components/           # Reusable UI components
│   ├── pages/               # Application pages/routes
│   ├── lib/                 # Utility functions and API calls
│   └── hooks/               # Custom React hooks
├── server/                   # Serverless backend functions
├── shared/                   # Shared types and utilities
├── dist/                     # Build output directory
├── netlify/                  # Netlify-specific configuration
├── public/                   # Static assets
├── netlify.toml             # Netlify configuration
├── package.json             # Dependencies and build scripts
└── vite.config.ts           # Vite configuration
```

## 🚀 Prerequisites

Before deploying to Netlify, ensure you have:

1. **Node.js** (v18 or higher)
2. **pnpm** package manager
3. **Git** repository hosted on GitHub, GitLab, or Bitbucket
4. **Netlify account** (free tier available)

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```bash
# Database Configuration
DATABASE_URL="your_database_connection_string"
DIRECT_URL="your_direct_database_connection_string"

# Authentication
JWT_SECRET="your_jwt_secret_key"
AUTH_SECRET="your_auth_secret"

# Email Configuration (if using email features)
SMTP_HOST="your_smtp_host"
SMTP_PORT="587"
SMTP_USER="your_email_username"
SMTP_PASS="your_email_password"

# External API Keys (if applicable)
OPENAI_API_KEY="your_openai_api_key"

# Application URLs
VITE_API_BASE_URL="/.netlify/functions"
VITE_APP_URL="https://your-app-name.netlify.app"
```

### 2. Package Dependencies

Ensure all dependencies are properly installed:

```bash
pnpm install
```

### 3. Build Verification

Test the build process locally:

```bash
# Build the client
pnpm build

# Test serverless functions (if using Netlify CLI)
netlify dev
```

## 🔧 Netlify Configuration

The project includes a `netlify.toml` file with the following configuration:

```toml
[build]
  publish = "dist"
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
```

## 📤 Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect Your Repository**
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Select your repository

2. **Configure Build Settings**
   - **Build command**: `pnpm build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add all the environment variables from your `.env` file
   - **Important**: Don't include `VITE_` prefixed variables in Netlify env vars if they contain secrets

4. **Deploy**
   - Click "Deploy site"
   - Netlify will assign a random subdomain (e.g., `happy-panda-123456.netlify.app`)

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   netlify init
   ```

4. **Deploy**
   ```bash
   # Deploy to preview
   netlify deploy

   # Deploy to production
   netlify deploy --prod
   ```

### Option 3: Deploy via Git Integration

1. **Push to Repository**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Auto-Deploy**
   - If connected via Netlify dashboard, deployment will trigger automatically
   - Check the deploy logs in Netlify dashboard

## 🗄️ Database Setup

### Using Supabase (Recommended for Serverless)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your database URL and anon key

2. **Database Schema**
   - Run your database migrations
   - Set up authentication tables if using Supabase Auth

3. **Environment Variables**
   ```bash
   DATABASE_URL="postgresql://[username]:[password]@[host]:[port]/[database]?sslmode=require"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   ```

### Using PlanetScale or Railway

Similar setup process - create database, get connection string, add to environment variables.

## ⚙️ Serverless Functions

The application uses Netlify Functions for the backend API. Key files:

- `netlify/functions/` - Contains serverless function handlers
- `server/` - Original server code that may need adaptation
- API endpoints are accessible at `/.netlify/functions/endpoint-name`

### Function Structure Example

```typescript
// netlify/functions/api-hello.ts
import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ message: 'Hello from Netlify!' })
  }
}
```

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to git
   - Use Netlify's environment variable settings for sensitive data
   - Prefix client-side variables with `VITE_`

2. **CORS Configuration**
   - Configure proper CORS headers in your functions
   - Set appropriate allowed origins

3. **Authentication**
   - Ensure JWT secrets are securely generated
   - Use secure authentication methods

## 🎯 Domain Configuration

### Custom Domain Setup

1. **Purchase Domain** (optional)
   - Use any domain registrar (Namecheap, GoDaddy, etc.)

2. **Configure DNS**
   - In Netlify dashboard: Site settings → Domain management
   - Add custom domain
   - Configure DNS records as instructed

3. **SSL Certificate**
   - Netlify provides free SSL certificates automatically
   - Force HTTPS in site settings

## 🔍 Monitoring and Debugging

### Netlify Analytics
- Enable Netlify Analytics in site settings
- Monitor traffic, performance, and errors

### Function Logs
- Check function logs in Netlify dashboard
- Use `console.log()` for debugging serverless functions

### Build Logs
- Review build logs for deployment issues
- Check for missing dependencies or build errors

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   ```bash
   # Issue: Node version mismatch
   # Solution: Set NODE_VERSION in netlify.toml or environment variables
   ```

2. **Function Timeouts**
   ```bash
   # Issue: Functions timing out (10s limit on free tier)
   # Solution: Optimize function code or upgrade to Pro plan
   ```

3. **Environment Variables Not Working**
   - Check variable names (case-sensitive)
   - Ensure `VITE_` prefix for client-side variables
   - Redeploy after changing environment variables

4. **Database Connection Issues**
   ```bash
   # Issue: Database connection fails
   # Solutions:
   # - Check connection string format
   # - Ensure database accepts connections from Netlify IPs
   # - Use connection pooling for serverless environments
   ```

5. **API Routes Not Working**
   - Verify `netlify.toml` redirects configuration
   - Check function file naming conventions
   - Ensure functions are in correct directory

## 📈 Performance Optimization

1. **Frontend Optimization**
   - Use lazy loading for components
   - Optimize images and assets
   - Enable Netlify's asset optimization

2. **Function Optimization**
   - Minimize function cold starts
   - Use connection pooling for databases
   - Cache frequently accessed data

3. **CDN Configuration**
   - Netlify's global CDN is automatic
   - Configure cache headers appropriately

## 🔄 Continuous Deployment

### Automated Deployments

1. **Branch Deployments**
   - Configure branch deploys for staging/preview
   - Main branch auto-deploys to production

2. **Deploy Previews**
   - Automatic deploy previews for pull requests
   - Test changes before merging

3. **Build Hooks**
   - Set up webhooks for external triggers
   - Rebuild on CMS content changes

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions Guide](https://functions.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [React Router with Netlify](https://docs.netlify.com/routing/redirects/)

## 📞 Support

If you encounter issues during deployment:

1. Check Netlify's community forums
2. Review deployment logs carefully
3. Test the build process locally first
4. Verify all environment variables are set correctly

---

## ✅ Deployment Checklist

- [ ] Repository is connected to Netlify
- [ ] All environment variables are configured
- [ ] Database is set up and accessible
- [ ] Build command and publish directory are correct
- [ ] Functions are working in preview deploy
- [ ] Custom domain is configured (if applicable)
- [ ] SSL certificate is active
- [ ] Analytics and monitoring are enabled

**Congratulations! Your AI First Academy application should now be live on Netlify! 🎉**
