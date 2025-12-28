const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:3001/api';

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  return Notification.requestPermission();
}

/**
 * Fetch VAPID public key from backend
 */
export async function getVapidPublicKey(): Promise<string> {
  try {
    const response = await fetch(`${API_URL}/notifications/vapid-public-key`);
    const data = await response.json();
    return data.publicKey || '';
  } catch (error) {
    console.error('Failed to fetch VAPID public key:', error);
    return '';
  }
}

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Ensure service worker is registered
 */
async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('[Push] Service Worker not supported');
    return null;
  }

  try {
    // Check if already registered
    const existingReg = await navigator.serviceWorker.getRegistration('/');
    if (existingReg) {
      console.log('[Push] Service Worker already registered, state:', existingReg.active?.state);
      // If it's active, return it
      if (existingReg.active) {
        return existingReg;
      }
      // Wait for it to become active
      if (existingReg.installing || existingReg.waiting) {
        console.log('[Push] Service Worker installing/waiting, waiting for activation...');
        await new Promise<void>((resolve) => {
          const sw = existingReg.installing || existingReg.waiting;
          sw!.addEventListener('statechange', function handler(e) {
            if ((e.target as ServiceWorker).state === 'activated') {
              sw!.removeEventListener('statechange', handler);
              resolve();
            }
          });
        });
        return existingReg;
      }
    }

    // Register manually
    console.log('[Push] Registering Service Worker manually...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[Push] Service Worker registered, scope:', registration.scope);

    // Wait for it to be active
    if (registration.installing) {
      console.log('[Push] Waiting for Service Worker to activate...');
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', function handler(e) {
          if ((e.target as ServiceWorker).state === 'activated') {
            registration.installing?.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
    }

    console.log('[Push] Service Worker is now active');
    return registration;
  } catch (error) {
    console.error('[Push] Failed to register Service Worker:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(accessToken: string): Promise<boolean> {
  try {
    console.log('[Push] 1. Starting subscription process...');
    console.log('[Push] AccessToken present:', !!accessToken);

    if (!accessToken) {
      console.error('[Push] FAILED: No access token provided');
      return false;
    }

    if (!isPushSupported()) {
      console.warn('[Push] FAILED: Not supported');
      return false;
    }
    console.log('[Push] 2. Push is supported');

    // Check current permission first
    const currentPermission = Notification.permission;
    console.log('[Push] 3. Current permission:', currentPermission);

    if (currentPermission === 'denied') {
      console.warn('[Push] FAILED: Permission was denied');
      return false;
    }

    // Request permission if not granted
    if (currentPermission !== 'granted') {
      console.log('[Push] 4. Requesting permission...');
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('[Push] FAILED: Permission request denied');
        return false;
      }
    }
    console.log('[Push] 5. Permission granted');

    // Ensure service worker is registered and active
    console.log('[Push] 6. Ensuring service worker is registered...');
    let registration = await ensureServiceWorkerRegistered();

    if (!registration) {
      // Fallback: try navigator.serviceWorker.ready with timeout
      console.log('[Push] 6b. Fallback: trying navigator.serviceWorker.ready...');
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 10000)
      );
      registration = (await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise,
      ])) as ServiceWorkerRegistration | null;
    }

    if (!registration) {
      console.error('[Push] FAILED: Service worker not ready');
      return false;
    }
    console.log('[Push] 7. Service worker ready');

    // Get VAPID public key
    console.log('[Push] 8. Fetching VAPID key from backend...');
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.error('[Push] FAILED: VAPID public key empty or not available');
      return false;
    }
    console.log(
      '[Push] 9. VAPID key received:',
      vapidPublicKey.substring(0, 30) + '...'
    );

    // Subscribe to push manager
    console.log('[Push] 10. Subscribing to PushManager...');
    const subscription = await (
      registration as ServiceWorkerRegistration
    ).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    console.log('[Push] 11. PushManager subscription created');

    // Extract keys
    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
      console.error('[Push] FAILED: Subscription missing endpoint or keys');
      return false;
    }

    const keys: PushSubscriptionKeys = {
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    };
    console.log(
      '[Push] 12. Keys extracted, endpoint:',
      keys.endpoint.substring(0, 60) + '...'
    );

    // Send to backend
    console.log('[Push] 13. Sending subscription to backend...');
    console.log('[Push] API URL:', API_URL);
    const response = await fetch(`${API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(keys),
    });

    console.log('[Push] 14. Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Push] FAILED: Backend error:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('[Push] 15. SUCCESS! Subscription saved:', result.id);
    return true;
  } catch (error) {
    console.error('[Push] FAILED with exception:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(
  accessToken: string
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe();

      // Unsubscribe on backend
      await fetch(`${API_URL}/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

/**
 * Check if already subscribed to push
 */
export async function isSubscribedToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    // Add timeout to prevent hanging if service worker not registered
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3000)
    );

    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      timeoutPromise,
    ]);

    if (!registration) return false;

    const subscription = await (
      registration as ServiceWorkerRegistration
    ).pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
