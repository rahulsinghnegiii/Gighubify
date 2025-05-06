# Setting Up Cloudinary for GigHubify Media Uploads

This guide will help you set up Cloudinary for handling media uploads in GigHubify, specifically for videos, audio, and larger image files.

## Why Cloudinary?

While GigHubify uses base64 encoding for smaller images (under 1MB), we use Cloudinary for:

- Videos (MP4, WEBM, MOV, etc.)
- Audio files (MP3, WAV, OGG, etc.)
- Larger images (over 1MB)

Cloudinary provides:
- Efficient storage and delivery through CDNs
- Automatic optimization and transcoding
- Easy management of media assets
- Better performance than base64 for larger files

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

### 2. Get Your Cloud Name

Your cloud name is displayed prominently in your dashboard. It looks something like: `your-cloud-name`

### 3. Create an Upload Preset

To securely upload media directly from the browser without API keys:

1. Go to Settings > Upload
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Set the following options:
   - **Preset name**: Choose a name (e.g., `gighubify_uploads`)
   - **Signing Mode**: Unsigned
   - **Folder**: Set a folder name (e.g., `gighubify`)
   - **Overwrite**: Set to false (recommended)
   - **Resource Type**: Auto

5. Click "Save" to create the preset

### 4. Update Your .env File

Add the following variables to your `.env` file:

```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

Replace `your_cloud_name` with your actual cloud name and `your_upload_preset` with the name you created in step 3.

### 5. Set up CORS Configuration

For cross-domain uploads to work properly:

1. Go to Settings > Security
2. In the "Allowed CORS origins" section, add your app's domain(s)
   - For local development, add: `http://localhost:3000`
   - For production, add your actual domain

3. Click "Save" to update the settings

## Testing Your Setup

To test if your Cloudinary setup is working:

1. Try uploading a video or audio file using the service creation form
2. Check your Cloudinary Media Library to see if the file appears there
3. The upload should complete successfully, and the media should be playable in the app

## Troubleshooting

If you encounter issues with uploads:

1. **CORS errors**: Double-check your CORS settings in Cloudinary
2. **Upload fails**: Verify that your cloud name and upload preset are correct
3. **Media not playing**: Check browser console for any errors

## Cloudinary Usage Limits

The free plan includes:
- 25GB storage
- 25GB monthly bandwidth
- Up to 25 monthly transformations

This is typically sufficient for development and small production applications. For higher usage, consider upgrading to a paid plan.

## Reference Documentation

- [Cloudinary React Documentation](https://cloudinary.com/documentation/react_integration)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)
- [Cloudinary Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery) 