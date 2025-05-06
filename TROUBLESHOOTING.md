# Troubleshooting GigHubify

This document provides solutions for common issues you might encounter when setting up and running the GigHubify project.

## Firebase Authentication Issues

### Issue: Invalid API Key Error

**Error message:** `FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`

**Solution:**

1. Make sure your `.env` file has the correct Firebase configuration values.
2. Copy the values from `.env.example` to your `.env` file, which should look like:

```
VITE_FIREBASE_API_KEY=AIzaSyCTNVI2Hxrzdsk-Rr0x1gFSKyvDsv1ONcs
VITE_FIREBASE_AUTH_DOMAIN=gighubify.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gighubify
VITE_FIREBASE_STORAGE_BUCKET=gighubify.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=410025737386
VITE_FIREBASE_APP_ID=1:410025737386:web:96b7ca9630e3bd2d24a4d3
VITE_FIREBASE_MEASUREMENT_ID=G-WHPRZYD0L0
```

3. After updating the `.env` file, restart your development server with:

```bash
npm run dev
```

## Firebase Permission Issues

### Issue: "Missing or insufficient permissions" Error

**Error message:** `FirebaseError: Missing or insufficient permissions`

**Solution:**

This error indicates that your Firebase security rules are too restrictive. You need to update your Firebase security rules to allow read/write operations:

1. Log in to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left sidebar, click on "Firestore Database"
4. Click on the "Rules" tab
5. Update the security rules with the following (for development purposes):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to all collections
    match /{document=**} {
      allow read: if true;
    }
    
    // Users collection - allow read/write during development
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Services collection - allow read/write during development
    match /services/{serviceId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Orders collection - allow read/write during development
    match /orders/{orderId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Reviews collection - allow read/write during development
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if true;
    }
    
    // Messages collection - allow read/write during development
    match /messages/{messageId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

6. Click "Publish" to save your changes

> **Important Security Note**: These permissive rules are suitable for development but **NOT for production**. Before deploying to production, implement proper security rules that validate authentication and authorization.

## TypeScript Naming Conflicts

### Issue: "Identifier 'User' has already been declared" Error

**Error message:** `SyntaxError: Identifier 'User' has already been declared`

**Solution:**

This error occurs because we have naming conflicts with the `User` identifier, which is imported from different modules. We need to rename the imports to avoid conflicts:

1. In `src/pages/ServiceDetail.tsx`, update the import statement:

```typescript
// Change this line
import { ArrowLeft, Clock, Star, User, Calendar, CheckCircle } from 'lucide-react';

// To this
import { ArrowLeft, Clock, Star, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';
```

2. In `src/components/Navbar.tsx`, update the import statement:

```typescript
// Change this line
import { Menu, X, Sun, Moon, PlusCircle, User, LogOut, Settings } from 'lucide-react';

// To this
import { Menu, X, Sun, Moon, PlusCircle, User as UserIcon, LogOut, Settings } from 'lucide-react';
```

3. Also update all occurrences of `<User />` to `<UserIcon />` in these files.

4. In `src/pages/SignUp.tsx`, update the import statement:

```typescript
// Change this line
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

// To this
import { Eye, EyeOff, Mail, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';
```

5. After making these changes, restart your development server.

## Running the Project

After making these changes, you should be able to run the project without errors:

```bash
npm run dev
```

## Production Considerations

Before deploying to production:

1. Update your Firebase security rules to be more restrictive and secure
2. Set up proper environment variables in your production environment
3. Implement comprehensive error handling
4. Add proper user authentication flow
5. Implement data validation 

## Authentication and Firestore Errors

### Error: "No document to update"

#### Problem

You may encounter the following error when trying to update a user's profile or upload a profile image:

```
Error updating document in users: FirebaseError: No document to update: projects/gighubify/databases/(default)/documents/users/[USER_ID]
```

This happens when a user is authenticated in Firebase Authentication, but their corresponding document doesn't exist in the Firestore "users" collection.

#### Solution

We've implemented several fixes to address this issue:

1. **Enhanced `updateDocument` function:**
   - Now checks if the document exists before trying to update it
   - If the document doesn't exist, it automatically creates it

2. **Enhanced `updateUserProfile` function:**
   - Verifies document existence before updating
   - Creates the document with basic user information if it doesn't exist

3. **Enhanced `updateProfileImage` function:**
   - Checks if the user document exists before updating
   - Creates a new user document with the profile image if necessary

4. **Modified AuthContext:**
   - The `onAuthStateChanged` listener now verifies and creates user documents if they don't exist
   - The `signIn`, `googleSignIn`, and `facebookSignIn` methods now ensure user documents exist

5. **Modified BuyerDashboard:**
   - Creates a user document if it doesn't exist when loading the dashboard

#### When This Can Happen

This error can occur in several scenarios:

1. When a user signs up but the document creation process fails for some reason
2. When a user signs in with social authentication for the first time
3. When you've moved from development to production or reset your database
4. When manually creating users in Firebase Authentication console

The fixes implemented will automatically create the necessary user document if it doesn't exist, preventing this error from occurring.

## Other Common Issues

### Firebase Storage CORS Errors

We've migrated from Firebase Storage to Base64 encoding to avoid CORS issues. See BASE64_IMAGES_GUIDE.md for details on this implementation.

### Authentication Fails Silently

Make sure your Firebase configuration is correct in `.env` and that the API key has the necessary permissions 