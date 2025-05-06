/**
 * This script updates Firebase Storage CORS settings
 * Run this script with: node update-cors.js
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// CORS configuration file
const corsConfig = [
  {
    origin: ["*"], // Allow all origins for development
    method: ["GET", "HEAD", "PUT", "POST", "DELETE"],
    maxAgeSeconds: 3600,
    responseHeader: ["Content-Type", "Content-Disposition", "Content-Length", "Authorization", "Origin", "X-Requested-With"]
  }
];

// Write the CORS configuration to a file
const corsFilePath = path.join(__dirname, 'cors.json');
fs.writeFileSync(corsFilePath, JSON.stringify(corsConfig, null, 2));
console.log('CORS configuration file created at:', corsFilePath);

// Update Firebase Storage CORS settings
console.log('Updating Firebase Storage CORS settings...');
exec('firebase storage:cors update --project=gighubify cors.json', (error, stdout, stderr) => {
  if (error) {
    console.error('Error updating CORS settings:', error);
    console.error('Make sure you are logged in to Firebase CLI and have access to the project.');
    console.log('You can login with: firebase login');
    return;
  }
  
  console.log('CORS settings updated successfully!');
  console.log(stdout);
  
  if (stderr) {
    console.warn('Warning:', stderr);
  }
  
  console.log('\nNext steps:');
  console.log('1. Update your Firebase Storage Rules in the Firebase Console');
  console.log('2. Restart your development server');
  console.log('3. Ensure you use getDownloadURL() instead of constructing URLs manually');
}); 