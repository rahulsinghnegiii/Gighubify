# Firebase Storage Guide

## CORS Issue Troubleshooting

The error you're seeing is related to Cross-Origin Resource Sharing (CORS) restrictions in Firebase Storage. Here's how to diagnose and fix it:

### 1. Check if the File Exists

The 404 error suggests the file might not exist. Let's verify:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Storage in the left menu
4. Check if the file exists at the path: `profile-images/0BsT5PXpNlYMO0WXbiy41LRz24x1/1746205731415-2c0594nhbvw.webp`

### 2. Verify Firebase Storage Configuration

Make sure your Firebase Storage is properly configured in your application:

```javascript
// Check that storage is correctly initialized
import { getStorage } from "firebase/storage";
import { app } from "./firebase"; // Your firebase app initialization

const storage = getStorage(app);
```

### 3. Fix Upload Function

There might be an issue with how you're uploading files. Here's a corrected version of the upload function:

```typescript
// In src/lib/firebase/storage.ts
export const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Ensure proper file path formatting
    const filePath = `profile-images/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${file.name.split('.').pop()}`;
    
    // Upload the file
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    
    // Get a long-lived download URL that doesn't require authentication
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};
```

### 4. Using the Correct URL Format

When accessing files from Firebase Storage, make sure to use the download URL:

```typescript
// Instead of constructing URLs manually like this:
const url = `https://firebasestorage.googleapis.com/v0/b/gighubify.firebasestorage.app/o?name=profile-images/${userId}/...`;

// Use the getDownloadURL function:
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const storageRef = ref(storage, `profile-images/${userId}/filename.jpg`);
const downloadURL = await getDownloadURL(storageRef);
// Now use downloadURL in your <img> tag or fetch request
```

### 5. Fix Image Display Component

If you're displaying user profile images, ensure you're using the correct approach:

```tsx
// Example component for displaying user profile image
const UserProfileImage = ({ photoURL, displayName }) => {
  return (
    <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10">
      {photoURL ? (
        <img 
          src={photoURL} 
          alt={displayName || 'User'} 
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback for error loading image
            e.currentTarget.src = '/path/to/default/avatar.png';
          }}
        />
      ) : (
        <UserIcon className="h-5 w-5 text-primary m-auto" />
      )}
    </div>
  );
};
```

## Best Practices for Firebase Storage

1. **Always use `getDownloadURL()`** rather than constructing URLs manually
2. **Handle image loading errors** with fallbacks
3. **Use meaningful file paths** that include user IDs for permission control
4. **Apply proper CORS settings** for your production environment
5. **Implement proper security rules** that match your application's needs

## Production Considerations

For production, consider making the CORS rules more restrictive:

```json
[
  {
    "origin": ["https://your-production-domain.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Disposition", "Content-Length"]
  }
]
``` 