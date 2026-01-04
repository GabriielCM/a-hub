import { renderHook, waitFor, act } from '@testing-library/react';
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import * as pushNotifications from '@/lib/push-notifications';

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock the push-notifications module
jest.mock('@/lib/push-notifications', () => ({
  isPushSupported: jest.fn(),
  getNotificationPermission: jest.fn(),
  subscribeToPush: jest.fn(),
  unsubscribeFromPush: jest.fn(),
  isSubscribedToPush: jest.fn(),
}));

import { useAuth } from '@/lib/auth-context';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPushNotifications = pushNotifications as jest.Mocked<typeof pushNotifications>;

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      accessToken: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    mockPushNotifications.isPushSupported.mockReturnValue(true);
    mockPushNotifications.getNotificationPermission.mockReturnValue('default');
    mockPushNotifications.isSubscribedToPush.mockResolvedValue(false);
    mockPushNotifications.subscribeToPush.mockResolvedValue(true);
    mockPushNotifications.unsubscribeFromPush.mockResolvedValue(true);
  });

  describe('initialization', () => {
    it('should return initial state when not authenticated', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSupported).toBe(true);
      expect(result.current.permission).toBe('default');
      expect(result.current.isSubscribed).toBe(false);
    });

    it('should check subscription status when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
      mockPushNotifications.isSubscribedToPush.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockPushNotifications.isSubscribedToPush).toHaveBeenCalled();
      expect(result.current.isSubscribed).toBe(true);
    });

    it('should detect when push is not supported', async () => {
      mockPushNotifications.isPushSupported.mockReturnValue(false);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSupported).toBe(false);
    });

    it('should detect current permission state', async () => {
      mockPushNotifications.getNotificationPermission.mockReturnValue('granted');

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permission).toBe('granted');
    });

    it('should detect denied permission', async () => {
      mockPushNotifications.getNotificationPermission.mockReturnValue('denied');

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permission).toBe('denied');
    });
  });

  describe('subscribe', () => {
    it('should subscribe successfully when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.subscribe();
      });

      expect(success).toBe(true);
      expect(mockPushNotifications.subscribeToPush).toHaveBeenCalledWith('test-token');
      expect(result.current.isSubscribed).toBe(true);
      expect(result.current.permission).toBe('granted');
    });

    it('should return false when not authenticated', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.subscribe();
      });

      expect(success).toBe(false);
      expect(mockPushNotifications.subscribeToPush).not.toHaveBeenCalled();
    });

    it('should handle subscription failure', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
      mockPushNotifications.subscribeToPush.mockResolvedValue(false);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.subscribe();
      });

      expect(success).toBe(false);
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully when authenticated', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
      mockPushNotifications.isSubscribedToPush.mockResolvedValue(true);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = false;
      await act(async () => {
        success = await result.current.unsubscribe();
      });

      expect(success).toBe(true);
      expect(mockPushNotifications.unsubscribeFromPush).toHaveBeenCalledWith('test-token');
      expect(result.current.isSubscribed).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.unsubscribe();
      });

      expect(success).toBe(false);
      expect(mockPushNotifications.unsubscribeFromPush).not.toHaveBeenCalled();
    });

    it('should handle unsubscribe failure', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });
      mockPushNotifications.isSubscribedToPush.mockResolvedValue(true);
      mockPushNotifications.unsubscribeFromPush.mockResolvedValue(false);

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let success: boolean = true;
      await act(async () => {
        success = await result.current.unsubscribe();
      });

      expect(success).toBe(false);
      // isSubscribed should not change on failure
      expect(result.current.isSubscribed).toBe(true);
    });
  });

  describe('loading states', () => {
    it('should set loading during subscribe', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // Delay the subscribe response
      mockPushNotifications.subscribeToPush.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start subscribing
      act(() => {
        result.current.subscribe();
      });

      // Should be loading immediately after calling subscribe
      expect(result.current.isLoading).toBe(true);

      // Wait for subscribe to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading during unsubscribe', async () => {
      mockUseAuth.mockReturnValue({
        accessToken: 'test-token',
        isAuthenticated: true,
        user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR', createdAt: '', updatedAt: '' },
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      // Delay the unsubscribe response
      mockPushNotifications.unsubscribeFromPush.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      const { result } = renderHook(() => usePushNotifications());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start unsubscribing
      act(() => {
        result.current.unsubscribe();
      });

      // Should be loading immediately after calling unsubscribe
      expect(result.current.isLoading).toBe(true);

      // Wait for unsubscribe to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
