/**
 * Messaging Service
 * Handles real-time messaging using Firebase Firestore
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../config/firebase';
import { getFirestoreInstance } from './firebase.service';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
  editedAt?: Date;
};

export type Conversation = {
  id: string;
  participants: string[]; // Array of user IDs
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageSender: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional metadata
  participantNames?: { [userId: string]: string }; // Cache participant names
  deletedBy?: string[]; // Array of user IDs who have deleted this conversation
};

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string,
  userName1: string,
  userName2: string
): Promise<string> => {
  const db = getFirestoreInstance();
  const participants = [userId1, userId2].sort(); // Sort for consistent conversation ID

  // Check if conversation already exists
  const conversationsRef = collection(db, FIRESTORE_COLLECTIONS.CONVERSATIONS);
  const q = query(
    conversationsRef,
    where('participants', '==', participants)
  );

  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    // Conversation exists, check if it was deleted by either user
    const conversationDoc = snapshot.docs[0];
    const conversationData = conversationDoc.data();
    const deletedBy = conversationData.deletedBy || [];
    
    // If the conversation was deleted by either user, restore it by removing them from deletedBy
    if (deletedBy.includes(userId1) || deletedBy.includes(userId2)) {
      const updatedDeletedBy = deletedBy.filter(
        (id: string) => id !== userId1 && id !== userId2
      );
      await updateDoc(conversationDoc.ref, {
        deletedBy: updatedDeletedBy,
        updatedAt: serverTimestamp(),
      });
    }
    
    return conversationDoc.id;
  }

  // Create new conversation
  const conversationData = {
    participants,
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    lastMessageSender: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    participantNames: {
      [userId1]: userName1,
      [userId2]: userName2,
    },
  };

  const docRef = await addDoc(conversationsRef, conversationData);
  return docRef.id;
};

/**
 * Send a message
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
  type: 'text' | 'image' | 'file' = 'text'
): Promise<string> => {
  const db = getFirestoreInstance();

  // Add message to messages collection
  const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
  const messageData = {
    conversationId,
    senderId,
    senderName,
    content,
    timestamp: serverTimestamp(),
    isRead: false,
    type,
  };

  const docRef = await addDoc(messagesRef, messageData);

  // Update conversation with last message
  const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CONVERSATIONS, conversationId);
  await updateDoc(conversationRef, {
    lastMessage: content,
    lastMessageTime: serverTimestamp(),
    lastMessageSender: senderId,
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Recalculate the last message metadata for a conversation
 */
export const refreshConversationMetadata = async (conversationId: string): Promise<void> => {
  const db = getFirestoreInstance();
  const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);

  const latestMessageQuery = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  const latestSnapshot = await getDocs(latestMessageQuery);
  const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CONVERSATIONS, conversationId);

  if (latestSnapshot.empty) {
    await updateDoc(conversationRef, {
      lastMessage: '',
      lastMessageSender: '',
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const latestData = latestSnapshot.docs[0].data();

  await updateDoc(conversationRef, {
    lastMessage: latestData.content || '',
    lastMessageSender: latestData.senderId || '',
    lastMessageTime: latestData.timestamp || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update an existing message
 */
export const updateMessage = async (
  conversationId: string,
  messageId: string,
  content: string
): Promise<void> => {
  const db = getFirestoreInstance();
  const messageRef = doc(db, FIRESTORE_COLLECTIONS.MESSAGES, messageId);

  await updateDoc(messageRef, {
    content,
    editedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await refreshConversationMetadata(conversationId);
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const db = getFirestoreInstance();
  const messageRef = doc(db, FIRESTORE_COLLECTIONS.MESSAGES, messageId);

  await deleteDoc(messageRef);
  await refreshConversationMetadata(conversationId);
};

/**
 * Delete a conversation for a specific user (soft delete)
 * The conversation and messages remain in the database but are hidden from the user
 * If all participants delete the conversation, it will be hard deleted
 */
export const deleteConversation = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const db = getFirestoreInstance();
  const conversationRef = doc(db, FIRESTORE_COLLECTIONS.CONVERSATIONS, conversationId);
  
  // Get current conversation data
  const conversationDoc = await getDoc(conversationRef);
  
  if (!conversationDoc.exists()) {
    throw new Error('Conversation not found');
  }
  
  const conversationData = conversationDoc.data();
  const participants = conversationData.participants || [];
  const deletedBy = conversationData.deletedBy || [];
  
  // Add user to deletedBy array if not already present
  if (!deletedBy.includes(userId)) {
    deletedBy.push(userId);
  }
  
  // Check if all participants have deleted the conversation
  const allParticipantsDeleted = participants.every((participantId: string) => 
    deletedBy.includes(participantId)
  );
  
  if (allParticipantsDeleted) {
    // Hard delete: Remove conversation and all its messages
    const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
    const messagesQuery = query(
      messagesRef,
      where('conversationId', '==', conversationId)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    const deletePromises = messagesSnapshot.docs.map((docSnapshot) =>
      deleteDoc(docSnapshot.ref)
    );
    
    // Delete all messages and the conversation
    await Promise.all(deletePromises);
    await deleteDoc(conversationRef);
  } else {
    // Soft delete: Just update the deletedBy array
    await updateDoc(conversationRef, {
      deletedBy,
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Get messages for a conversation (real-time listener)
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const db = getFirestoreInstance();
  const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
  
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        timestamp: data.timestamp?.toDate() || new Date(),
        isRead: data.isRead || false,
        type: data.type || 'text',
        editedAt: data.editedAt?.toDate(),
      };
    });
    callback(messages);
  });
};

/**
 * Get all conversations for a user (real-time listener)
 */
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  const db = getFirestoreInstance();
  const conversationsRef = collection(db, FIRESTORE_COLLECTIONS.CONVERSATIONS);
  
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          lastMessageSender: data.lastMessageSender || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          participantNames: data.participantNames || {},
          deletedBy: data.deletedBy || [],
        };
      })
      // Filter out conversations deleted by the current user
      .filter((conv) => !conv.deletedBy || !conv.deletedBy.includes(userId));
    callback(conversations);
  });
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const db = getFirestoreInstance();
  const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
  
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    where('senderId', '!=', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map((docSnapshot) => {
    return updateDoc(docSnapshot.ref, { isRead: true });
  });

  await Promise.all(updatePromises);
};

/**
 * Get unread message count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  const db = getFirestoreInstance();
  
  // Get all conversations for user
  const conversationsRef = collection(db, FIRESTORE_COLLECTIONS.CONVERSATIONS);
  const conversationsQuery = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  );
  
  const conversationsSnapshot = await getDocs(conversationsQuery);
  const conversationIds = conversationsSnapshot.docs.map((doc) => doc.id);

  if (conversationIds.length === 0) return 0;

  // Count unread messages
  const messagesRef = collection(db, FIRESTORE_COLLECTIONS.MESSAGES);
  let totalUnread = 0;

  for (const conversationId of conversationIds) {
    const messagesQuery = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    totalUnread += messagesSnapshot.size;
  }

  return totalUnread;
};

