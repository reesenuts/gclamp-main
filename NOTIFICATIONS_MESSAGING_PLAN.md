 # Notifications & Messaging Implementation Plan

## Current Backend Status

### ✅ Messaging - **ALREADY EXISTS**
The backend already has messaging functionality:
- **Table**: `test_lamp.messages_tbl`
- **Stored Procedures**: 
  - `lgMessages` (get messages) - Parameters: `p_classcode`, `p_member`
  - `lpMessage` (add message) - Parameters: `p_senderid`, `p_message`, `p_classcode`, `p_member`, `p_date`
- **API Endpoints**: 
  - `getmsg` - Get messages
  - `addmsg` - Add message
- **Table Structure**:
  - `recno_fld` - Record number
  - `messagecode_fld` - Message code
  - `roomcode_fld` - Room/class code
  - `roommember_fld` - Member ID
  - `authorid_fld` - Sender ID
  - `content_fld` - Message content
  - `datetime_fld` - Timestamp
  - `isseen_fld` - Read status
  - `isdeleted_fld` - Deleted flag

### ❌ Notifications - **DOES NOT EXIST**
No dedicated notifications system in the backend.

---

## Implementation Strategy

### Option 1: Minimal Backend Changes (Recommended)

#### For Messaging:
✅ **No backend changes needed** - Just integrate existing endpoints

**Frontend Implementation:**
1. Create messaging service methods (already exists in `lamp.service.ts`)
2. Build messaging UI components
3. Implement real-time polling or WebSocket (if available)
4. Handle message sending/receiving

**Required Frontend Work:**
- Message list component
- Chat interface component
- Message input component
- Integration with existing `getmsg` and `addmsg` endpoints

---

#### For Notifications:
**Option 1A: Polling-Based (No Backend Changes)**
- Poll existing endpoints periodically:
  - `getclassactivities` - Check for new activities
  - `getclasspost` - Check for new posts
  - `getclasscomments` - Check for new comments/replies
- Compare timestamps to detect new items
- Store notification state locally (AsyncStorage)
- **Pros**: Zero backend changes
- **Cons**: Not real-time, requires polling, battery usage

**Option 1B: Simple Notifications Table (Minimal Backend Changes)**
- Create a simple `notifications_tbl` table:
  ```sql
  CREATE TABLE notifications_tbl (
    recno_fld INT PRIMARY KEY AUTO_INCREMENT,
    userid_fld VARCHAR(50),        -- Who receives the notification
    type_fld VARCHAR(20),          -- 'activity', 'post', 'comment', 'reply'
    title_fld VARCHAR(255),
    message_fld TEXT,
    link_fld VARCHAR(255),         -- JSON or string for navigation
    isread_fld TINYINT DEFAULT 0,
    datetime_fld DATETIME,
    isdeleted_fld TINYINT DEFAULT 0
  );
  ```
- Create stored procedures:
  - `lgNotifications` - Get notifications for user
  - `lpNotification` - Create notification
  - `luNotification` - Mark as read
- **Pros**: Real notifications, can be triggered by backend events
- **Cons**: Requires backend changes (but minimal)

**Option 1C: Hybrid Approach (Recommended)**
- Use polling for immediate needs (no backend changes)
- Add simple notifications table later if needed
- Frontend can work with both approaches

---

### Option 2: Third-Party Services (No Backend Changes)

**You only need to pick ONE service for messaging and ONE for notifications** (or use a unified solution that handles both).

#### Option 2A: Firebase (Unified Solution - Recommended for Third-Party)
**Handles BOTH messaging AND notifications:**
- **Firestore** or **Realtime Database** for messaging
- **Firebase Cloud Messaging (FCM)** for push notifications
- **Pros**: 
  - One platform for both features
  - Real-time messaging
  - Push notifications (works when app is closed)
  - Free tier available (generous limits)
  - Good React Native support
- **Cons**: 
  - External dependency
  - Data stored in Firebase (not your database)
  - Requires Firebase project setup
  - Need to sync with your backend for user data

#### Option 2B: Mix and Match

**For Messaging (Pick ONE):**
- **Firebase Realtime Database** or **Firestore** - Real-time database
- **Pusher** - WebSocket service (simpler than Socket.io)
- **Socket.io** - Requires backend WebSocket server (not truly "no backend changes")
- **Ably** - Real-time messaging service

**For Notifications (Pick ONE):**
- **Firebase Cloud Messaging (FCM)** - Google's push notification service
- **OneSignal** - Push notification service (supports multiple platforms)
- **Pusher Beams** - Push notifications from Pusher

**Pros**: Real-time, scalable, no backend changes (except Socket.io)
**Cons**: External dependency, potential costs, data stored externally, setup complexity

---

### Option 3: Full Backend Implementation

Create complete notification and messaging system in backend:
- Real-time WebSocket server
- Notification service
- Message queue system
- **Pros**: Full control, integrated with existing system
- **Cons**: Significant backend development time

---

## Recommended Approach

### Phase 1: Messaging (Immediate - No Backend Changes)
1. ✅ Integrate existing `getmsg` and `addmsg` endpoints
2. Build messaging UI
3. Implement polling for new messages (every 5-10 seconds)
4. Add message seen status updates

### Phase 2: Notifications (Short-term - Minimal Backend Changes)
1. **Start with Option 1A (Polling)**:
   - Poll existing endpoints every 30-60 seconds
   - Compare with local cache to detect new items
   - Store notification state in AsyncStorage
   - Works immediately, no backend changes

2. **Upgrade to Option 1B (Simple Table)** when ready:
   - Add `notifications_tbl` table
   - Create 3 stored procedures (can reuse existing patterns)
   - Backend triggers notifications when:
     - New activity posted → notify students
     - New post → notify class members
     - New comment/reply → notify post author
   - Frontend polls `getnotifications` endpoint

### Phase 3: Real-Time (Future - Optional)
- Add WebSocket support if needed
- Or integrate Firebase/Pusher for real-time features

---

## Third-Party Service Comparison

### If Choosing Option 2 (Third-Party Services):

#### Best Choice: **Firebase (Unified Solution)**
- **Why**: Handles both messaging AND notifications in one platform
- **Setup**: 
  1. Create Firebase project
  2. Install `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@react-native-firebase/firestore`
  3. Configure for iOS/Android
- **Cost**: Free tier (generous), then pay-as-you-go
- **Data Sync**: You'll need to sync user data between your backend and Firebase

#### Alternative: **Pusher + OneSignal**
- **Pusher** for real-time messaging
- **OneSignal** for push notifications
- **Why**: Simpler individual services, but requires managing two platforms
- **Cost**: Both have free tiers

#### Not Recommended: **Socket.io**
- Requires backend WebSocket server
- Not truly "no backend changes"
- Better to use existing backend messaging endpoints

---

## Implementation Details

### Messaging Implementation

**Frontend Structure:**
```
app/
  components/
    messages/
      message-list.tsx        # List of conversations
      chat-screen.tsx         # Individual chat interface
      message-bubble.tsx      # Message display component
      message-input.tsx       # Input component
```

**API Integration:**
- `lampService.getMessages({ p_classcode, p_member })` - Get messages
- `lampService.addMessage({ p_senderid, p_message, p_classcode, p_member })` - Send message

**Features:**
- Class-based messaging (roomcode = classcode)
- Read/unread status
- Message history
- Real-time polling (5-10 second intervals)

---

### Notifications Implementation (Polling Approach)

**Frontend Structure:**
```
app/
  services/
    notification.service.ts  # Polling logic, state management
  components/
    notifications/
      notification-item.tsx   # Individual notification display
```

**Polling Strategy:**
1. Poll every 30-60 seconds when app is active
2. Check:
   - `getclassactivities` - New activities since last check
   - `getclasspost` - New posts since last check
   - `getclasscomments` - New comments/replies since last check
3. Compare timestamps with local cache
4. Generate notifications for new items
5. Store in AsyncStorage
6. Display in notifications tab

**Notification Types:**
- `activity` - New activity posted
- `post` - New post in class feed
- `comment` - Comment on your post
- `reply` - Reply to your comment
- `resource` - New resource uploaded

---

## Database Schema (If Adding Notifications Table)

```sql
CREATE TABLE test_lamp.notifications_tbl (
  recno_fld INT PRIMARY KEY AUTO_INCREMENT,
  userid_fld VARCHAR(50) NOT NULL,           -- Recipient user ID
  type_fld VARCHAR(20) NOT NULL,            -- 'activity', 'post', 'comment', 'reply', 'resource'
  title_fld VARCHAR(255),
  message_fld TEXT,
  linkdata_fld TEXT,                        -- JSON: {type, id, courseCode, postId, etc.}
  isread_fld TINYINT DEFAULT 0,
  datetime_fld DATETIME DEFAULT CURRENT_TIMESTAMP,
  isdeleted_fld TINYINT DEFAULT 0,
  INDEX idx_userid (userid_fld),
  INDEX idx_read (isread_fld),
  INDEX idx_datetime (datetime_fld)
);
```

**Stored Procedures Needed:**
1. `lgNotifications` - Get notifications for user
   - Parameters: `p_userid`
   - Returns: Unread notifications, recent read notifications

2. `lpNotification` - Create notification
   - Parameters: `p_userid`, `p_type`, `p_title`, `p_message`, `p_linkdata`
   - Returns: Created notification

3. `luNotification` - Mark as read
   - Parameters: `p_recno`
   - Returns: Success status

---

## Next Steps

1. **Immediate**: Implement messaging using existing backend
2. **Short-term**: Implement polling-based notifications (no backend changes)
3. **Medium-term**: Add notifications table if polling isn't sufficient
4. **Future**: Consider real-time features if needed

---

## Questions to Consider

1. **Messaging**: 
   - Is class-based messaging sufficient, or do we need direct user-to-user messaging?
   - Do we need group chats or just class-wide messaging?

2. **Notifications**:
   - How real-time do notifications need to be?
   - Should notifications work when app is closed? (Requires push notifications)
   - Do we need notification preferences/settings?

3. **Backend Constraints**:
   - Can we add a new table?
   - Can we modify stored procedures?
   - Are there any restrictions on database changes?

