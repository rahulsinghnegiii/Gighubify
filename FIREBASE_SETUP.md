# Firebase Setup Instructions

## Firebase Configuration

The project is already configured to use Firebase. The Firebase configuration is stored in `.env` and should contain the following variables:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Firebase Security Rules

You're currently facing "Missing or insufficient permissions" errors. This means your Firebase security rules are restricting access to your database. To fix this, you need to update your Firestore security rules.

### How to Update Firestore Security Rules

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

## Production Security Rules (Implement Before Deployment)

For production, you should implement more restrictive rules like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Services collection
    match /services/{serviceId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                            request.auth.uid == resource.data.sellerId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
                          (request.auth.uid == resource.data.buyerId || 
                           request.auth.uid == resource.data.sellerId);
    }
    
    // Other collections with appropriate rules...
  }
}
```

## Firebase Storage Rules

If you're using Firebase Storage, don't forget to update the Storage rules as well:

1. In the Firebase Console, click on "Storage"
2. Click on the "Rules" tab
3. Update with rules appropriate for your application

For development:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

For production, implement more restrictive rules.

## Need Help?

For more information on Firebase security rules, refer to the [Firebase documentation](https://firebase.google.com/docs/firestore/security/get-started). 