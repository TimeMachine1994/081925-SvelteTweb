## FireCMS starter template

Welcome to FireCMS!

Remember to drop a ⭐ in our [Github page](https://github.com/firecmsco/firecms),
and join our [Discord community](https://discord.gg/fxy7xsQm3m) to get help and
share your projects.

This is a starter template for your next project. It includes the basic
configuration to get you started.

In order to run this project, you will need to create a Firebase project,
create a web app and copy the configuration to the `firebase_config.ts`.

## 🚀 Running the project

```bash
npm run dev
```

## 📦 Building the project

```bash
npm run build
```

## 🌐 Deployment Options

### Option 1: Vercel Deployment (Recommended)

#### Step 1: Create `vercel.json`

Create a `vercel.json` file in this directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Step 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from this directory
vercel

# For production deployment
vercel --prod
```

#### Step 3: Configure Environment Variables in Vercel

In your Vercel project dashboard, add these environment variables:

```bash
VITE_FIREBASE_API_KEY=AIzaSyAXmTxzYRc-LhMEW75nZjjjQCZov1gpiw0
VITE_FIREBASE_AUTH_DOMAIN=fir-tweb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fir-tweb
VITE_FIREBASE_STORAGE_BUCKET=fir-tweb.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=509455146790
VITE_FIREBASE_APP_ID=1:509455146790:web:7ec99527214b05d7b9ebe7
```

#### Step 4: Deploy via Vercel Dashboard (Alternative)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `firecms`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add environment variables
6. Click **Deploy**

#### Custom Domain Setup

Recommended subdomain: `admin.tributestream.live`

1. In Vercel Project Settings → Domains
2. Add custom domain
3. Follow DNS configuration instructions
4. SSL provisioned automatically

### Option 2: Firebase Hosting

Make sure you update your `package.json` `deploy` script with the correct
project name. Then run:

```bash
npm run deploy
```

> Note: this may not work if you have set up your Firebase hosting with
> a custom config.

## 🔒 Firebase Security

Ensure admin users have proper access in Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    function isAdminEmail() {
      return request.auth != null && 
        (request.auth.token.email == 'austinbryanfilm@gmail.com' ||
         request.auth.token.email.matches('.*@tributestream.com'));
    }
    
    match /{document=**} {
      allow read, write: if isAdmin() || isAdminEmail();
    }
  }
}
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (Vercel-compatible)
- `npm run build:check` - Build with TypeScript checking
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Firebase Hosting
- `npm run deploy:vercel` - Deploy to Vercel
- `npm run typecheck` - Run TypeScript type checking

## 🐛 Troubleshooting

### Vercel Build Fails
- Verify environment variables are set in Vercel dashboard
- Check `vercel.json` exists in this directory
- Review build logs in Vercel

### Firebase Connection Issues
- Verify environment variables match Firebase project
- Check Firebase Authentication is enabled
- Ensure Firestore rules allow admin access

### Routing Issues (404 errors)
- Verify `vercel.json` rewrites configuration
- SPA routing should redirect all routes to `/index.html`
