/**
 * Messaging Service
 * Handles real-time messaging using Firebase Firestore
 */

import {
    addDoc,
    collection,
    doc,
    getDocs,
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
    // Conversation exists, return its ID
    return snapshot.docs[0].id;
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
    const conversations: Conversation[] = snapshot.docs.map((doc) => {
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
      };
    });
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

