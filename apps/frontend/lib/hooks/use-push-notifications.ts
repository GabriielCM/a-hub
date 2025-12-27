'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from '@/lib/push-notifications';

interface UsePushNotificationsResult {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { accessToken, isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial state
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      setIsSupported(isPushSupported());
      setPermission(getNotificationPermission());

      if (isAuthenticated) {
        const subscribed = await isSubscribedToPush();
        setIsSubscribed(subscribed);
      }

      setIsLoading(false);
    };

    checkStatus();
  }, [isAuthenticated]);

  const subscribe = useCallback(async () => {
    if (!accessToken) return false;
    setIsLoading(true);
    const success = await subscribeToPush(accessToken);
    if (success) {
      setIsSubscribed(true);
      setPermission('granted');
    }
    setIsLoading(false);
    return success;
  }, [accessToken]);

  const unsubscribe = useCallback(async () => {
    if (!accessToken) return false;
    setIsLoading(true);
    const success = await unsubscribeFromPush(accessToken);
    if (success) {
      setIsSubscribed(false);
    }
    setIsLoading(false);
    return success;
  }, [accessToken]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
