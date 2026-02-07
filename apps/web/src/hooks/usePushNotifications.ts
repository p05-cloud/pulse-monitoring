import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: null,
    subscription: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      const permission = 'Notification' in window ? Notification.permission : null;

      if (isSupported && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setState({
            isSupported,
            isSubscribed: !!subscription,
            permission,
            subscription,
          });
        } catch {
          setState({ isSupported, isSubscribed: false, permission, subscription: null });
        }
      } else {
        setState({ isSupported, isSubscribed: false, permission, subscription: null });
      }
    };

    checkSupport();
  }, []);

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setError('Push notifications are not supported');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied');
        setState(prev => ({ ...prev, permission }));
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };
      if (VAPID_PUBLIC_KEY) {
        subscribeOptions.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      }
      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Send subscription to server
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscription),
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission,
        subscription,
      }));

      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    setLoading(true);
    setError(null);

    try {
      await state.subscription.unsubscribe();

      // Notify server
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/v1/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [state.subscription]);

  const showLocalNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!state.isSupported || Notification.permission !== 'granted') {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    },
    [state.isSupported]
  );

  return {
    ...state,
    loading,
    error,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}
