# ThriftHub

A vintage-inspired online thrift shopping marketplace built with React, TypeScript, Tailwind CSS, Firebase Authentication (Google Sign-In), Cloud Firestore, and Firebase Storage. Features product listings in Philippine Pesos (₱), Cash on Delivery (COD) checkout, a Seller Studio, User Profile with order tracking, and a protected Admin Dashboard.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Cloud Firestore (`firestore.rules` + `firebase-blueprint.json`)
- **Storage**: Firebase Storage (`storage.rules`)
- **Hosting**: Ready for Netlify (`netlify.toml`)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## GitHub & Netlify Deployment Guide

### 1. Push to a Public GitHub Repository
```bash
git init
git add .
git commit -m "Initial ThriftHub release"
git branch -M main
git remote add origin https://github.com/<your-username>/thrifthub.git
git push -u origin main
```

### 2. Deploy to Netlify
1. Log in to [Netlify](https://app.netlify.com/) and choose **Add new site -> Import an existing project**.
2. Connect your GitHub account and select your public `thrifthub` repository.
3. Netlify will automatically detect `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. (Optional) Under **Site configuration -> Environment variables**, add `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_FIREBASE_DATABASE_ID` if overriding `firebase-applet-config.json`.
5. Click **Deploy site**. Once deployed, copy your `.netlify.app` URL (e.g., `https://thrifthub-ph.netlify.app`).

### 3. Add Netlify Domain to Firebase Authorized Domains (CRITICAL)
Without this step, Google Sign-In will fail on your live Netlify site:
1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Go to **Authentication -> Settings -> Authorized domains**.
3. Click **Add domain** and enter your Netlify domain (e.g., `your-site-name.netlify.app`).

### 4. Deploy Firestore & Storage Rules
If deploying rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage
```
