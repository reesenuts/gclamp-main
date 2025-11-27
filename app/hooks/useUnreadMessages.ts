/**
 * Hook to track unread message count
 * Provides real-time updates of unread messages across all conversations
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { authService, messagingService } from '../services';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null);

  // Check for user changes and update accordingly
  const checkUserChange = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const newUserId = user?.id || null;
      
      // If user has changed, clear state and update
      if (previousUserIdRef.current !== newUserId) {
        // Unsubscribe from previous user's conversations
        if (unsubscribeConversationsRef.current) {
          unsubscribeConversationsRef.current();
          unsubscribeConversationsRef.current = null;
        }
        
        setUnreadCount(0);
        previousUserIdRef.current = newUserId;
        setCurrentUserId(newUserId);
      } else if (currentUserId !== newUserId) {
        setCurrentUserId(newUserId);
      }
    } catch (error) {
      console.error('Error checking user for unread messages:', error);
      if (previousUserIdRef.current !== null) {
        if (unsubscribeConversationsRef.current) {
          unsubscribeConversationsRef.current();
          unsubscribeConversationsRef.current = null;
        }
        setUnreadCount(0);
        previousUserIdRef.current = null;
        setCurrentUserId(null);
      }
    }
  }, [currentUserId]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async (userId: string) => {
    try {
      const count = await messagingService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  }, []);

  // Subscribe to conversations and refresh unread count when conversations change
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to conversations to detect when new messages arrive
    const unsubscribe = messagingService.subscribeToConversations(
      currentUserId,
      async (conversations) => {
        // Refresh unread count whenever conversations update
        await refreshUnreadCount(currentUserId);
      }
    );

    unsubscribeConversationsRef.current = unsubscribe;

    // Initial fetch
    refreshUnreadCount(currentUserId);

    return () => {
      unsubscribe();
    };
  }, [currentUserId, refreshUnreadCount]);

  // Initial user check
  useEffect(() => {
    checkUserChange();
  }, [checkUserChange]);

  // Periodically refresh unread count (every 3 seconds) as backup
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      refreshUnreadCount(currentUserId);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUserId, refreshUnreadCount]);

  return { unreadCount };
};

