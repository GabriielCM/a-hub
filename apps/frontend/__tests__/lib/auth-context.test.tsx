import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// Test component that uses the auth context
function TestComponent() {
  const { user, accessToken, isLoading, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('test@test.com', 'password');
    } catch {
      // Handle error silently for testing
    }
  };

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="token">{accessToken || 'none'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    describe('initialization', () => {
      it('should initialize as unauthenticated when no tokens in localStorage', async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        });

        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(screen.getByTestId('user')).toHaveTextContent('none');
        expect(screen.getByTestId('token')).toHaveTextContent('none');
      });

      it('should restore session from valid stored tokens', async () => {
        const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'COLLABORATOR' as const, createdAt: '', updatedAt: '' };
        localStorage.setItem('a-hub-access-token', 'valid-access-token');
        localStorage.setItem('a-hub-refresh-token', 'valid-refresh-token');
        mockApi.getMe.mockResolvedValue(mockUser);

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('token')).toHaveTextContent('valid-access-token');
      });

      it('should refresh tokens when access token is expired', async () => {
        const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'COLLABORATOR' as const, createdAt: '', updatedAt: '' };
        localStorage.setItem('a-hub-access-token', 'expired-access-token');
        localStorage.setItem('a-hub-refresh-token', 'valid-refresh-token');

        mockApi.getMe
          .mockRejectedValueOnce(new Error('Unauthorized'))
          .mockResolvedValueOnce(mockUser);
        mockApi.refreshToken.mockResolvedValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        });

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        expect(mockApi.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
        expect(screen.getByTestId('token')).toHaveTextContent('new-access-token');
        expect(localStorage.getItem('a-hub-access-token')).toBe('new-access-token');
        expect(localStorage.getItem('a-hub-refresh-token')).toBe('new-refresh-token');
      });

      it('should clear auth when refresh token is also expired', async () => {
        localStorage.setItem('a-hub-access-token', 'expired-access-token');
        localStorage.setItem('a-hub-refresh-token', 'expired-refresh-token');

        mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
        mockApi.refreshToken.mockRejectedValue(new Error('Refresh token expired'));

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        });

        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(localStorage.getItem('a-hub-access-token')).toBeNull();
        expect(localStorage.getItem('a-hub-refresh-token')).toBeNull();
      });
    });

    describe('login', () => {
      it('should login successfully and store tokens', async () => {
        const user = userEvent.setup();
        const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'COLLABORATOR' as const, createdAt: '', updatedAt: '' };
        mockApi.login.mockResolvedValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: mockUser,
        });

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        });

        await user.click(screen.getByText('Login'));

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        expect(mockApi.login).toHaveBeenCalledWith('test@test.com', 'password');
        expect(screen.getByTestId('user')).toHaveTextContent('Test User');
        expect(screen.getByTestId('token')).toHaveTextContent('access-token');
        expect(localStorage.getItem('a-hub-access-token')).toBe('access-token');
        expect(localStorage.getItem('a-hub-refresh-token')).toBe('refresh-token');
      });

      it('should not authenticate on invalid credentials', async () => {
        const user = userEvent.setup();
        mockApi.login.mockRejectedValue(new Error('Invalid credentials'));

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        });

        await user.click(screen.getByText('Login'));

        // Wait a bit for any state updates
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    describe('logout', () => {
      it('should logout and clear tokens', async () => {
        const user = userEvent.setup();
        const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'COLLABORATOR' as const, createdAt: '', updatedAt: '' };

        // Setup authenticated state
        localStorage.setItem('a-hub-access-token', 'access-token');
        localStorage.setItem('a-hub-refresh-token', 'refresh-token');
        mockApi.getMe.mockResolvedValue(mockUser);
        mockApi.logout.mockResolvedValue({});

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        await user.click(screen.getByText('Logout'));

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });

        expect(mockApi.logout).toHaveBeenCalledWith('access-token');
        expect(screen.getByTestId('user')).toHaveTextContent('none');
        expect(screen.getByTestId('token')).toHaveTextContent('none');
        expect(localStorage.getItem('a-hub-access-token')).toBeNull();
        expect(localStorage.getItem('a-hub-refresh-token')).toBeNull();
      });

      it('should clear tokens even if logout API fails', async () => {
        const user = userEvent.setup();
        const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'COLLABORATOR' as const, createdAt: '', updatedAt: '' };

        localStorage.setItem('a-hub-access-token', 'access-token');
        localStorage.setItem('a-hub-refresh-token', 'refresh-token');
        mockApi.getMe.mockResolvedValue(mockUser);
        mockApi.logout.mockRejectedValue(new Error('Network error'));

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        });

        await user.click(screen.getByText('Logout'));

        await waitFor(() => {
          expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        });

        // Tokens should be cleared despite API error
        expect(localStorage.getItem('a-hub-access-token')).toBeNull();
      });

      it('should handle logout when not authenticated', async () => {
        const user = userEvent.setup();

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('ready');
        });

        await user.click(screen.getByText('Logout'));

        // Should not call API when no token
        expect(mockApi.logout).not.toHaveBeenCalled();
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });
  });
});
