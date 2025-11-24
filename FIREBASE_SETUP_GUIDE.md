# Firebase Firestore Messaging Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard
4. Enable **Firestore Database**:
   - Go to "Firestore Database" in left menu
   - Click "Create database"
   - Start in **test mode** (we'll add security rules later)
   - Choose a location (closest to your users)

## Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the Web icon (`</>`) to add a web app
4. Register app (give it a name like "GCLamp Mobile")
5. Copy the Firebase configuration object (we'll use this in the app)

## Step 3: Install Firebase SDK

```bash
npm install firebase
```

## Step 4: Firestore Security Rules (Important!)

Go to Firestore Database → Rules tab and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages collection - users can only read/write their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.senderId == request.auth.uid || 
         resource.data.receiverId == request.auth.uid);
    }
    
    // Conversations collection - users can only access conversations they're part of
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Users collection - users can read their own data, write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Note**: For now, we'll use test mode rules, but you should implement proper authentication later.

## Step 5: Firestore Data Structure

### Collections:

1. **conversations** - Chat rooms/conversations
   ```
   conversationId (auto-generated)
   ├── participants: [userId1, userId2]  // Array of user IDs
   ├── lastMessage: string
   ├── lastMessageTime: timestamp
   ├── lastMessageSender: string
   ├── createdAt: timestamp
   └── updatedAt: timestamp
   ```

2. **messages** - Individual messages
   ```
   messageId (auto-generated)
   ├── conversationId: string
   ├── senderId: string
   ├── senderName: string
   ├── content: string
   ├── timestamp: timestamp
   ├── isRead: boolean
   └── type: 'text' | 'image' | 'file'
   ```

3. **users** (optional) - User metadata for messaging
   ```
   userId (matches your backend user ID)
   ├── name: string
   ├── email: string
   ├── role: 'student' | 'instructor'
   └── lastSeen: timestamp
   ```

## Step 6: Integration with Your Backend

Since you have existing user authentication:
- Use your backend JWT tokens
- Map your user IDs to Firebase (use same user ID)
- Sync user data from backend to Firebase when needed
- Firebase will handle real-time messaging, backend handles authentication

## Next Steps

After setup, we'll:
1. Create Firebase service/configuration
2. Create messaging service using Firestore
3. Update messages.tsx to use Firebase
4. Create/update chat-detail.tsx for real-time chat
5. Add message sending/receiving functionality

