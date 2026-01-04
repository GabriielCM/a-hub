import { api } from '@/lib/api';

const mockFetch = global.fetch as jest.Mock;

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = (data: unknown, status = 200) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    });
  };

  const mockErrorResponse = (message: string, status = 400) => {
    return Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    });
  };

  describe('Auth endpoints', () => {
    describe('login', () => {
      it('should call login endpoint with credentials', async () => {
        const mockData = {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR' },
        };
        mockFetch.mockReturnValue(mockResponse(mockData));

        const result = await api.login('test@test.com', 'password');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@test.com', password: 'password' }),
          })
        );
        expect(result).toEqual(mockData);
      });

      it('should throw error on invalid credentials', async () => {
        mockFetch.mockReturnValue(mockErrorResponse('Invalid credentials', 401));

        await expect(api.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
      });
    });

    describe('refreshToken', () => {
      it('should call refresh endpoint with token', async () => {
        const mockData = { accessToken: 'new-access', refreshToken: 'new-refresh' };
        mockFetch.mockReturnValue(mockResponse(mockData));

        const result = await api.refreshToken('old-refresh');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/refresh'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer old-refresh',
            }),
          })
        );
        expect(result).toEqual(mockData);
      });
    });

    describe('logout', () => {
      it('should call logout endpoint with token', async () => {
        mockFetch.mockReturnValue(mockResponse({}));

        await api.logout('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/logout'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer token',
            }),
          })
        );
      });
    });
  });

  describe('User endpoints', () => {
    describe('getMe', () => {
      it('should fetch current user with token', async () => {
        const mockUser = { id: '1', name: 'Test', email: 'test@test.com', role: 'COLLABORATOR' };
        mockFetch.mockReturnValue(mockResponse(mockUser));

        const result = await api.getMe('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/me'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer token',
            }),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe('getUsers', () => {
      it('should fetch all users', async () => {
        const mockUsers = [
          { id: '1', name: 'User 1', email: 'user1@test.com' },
          { id: '2', name: 'User 2', email: 'user2@test.com' },
        ];
        mockFetch.mockReturnValue(mockResponse(mockUsers));

        const result = await api.getUsers('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users'),
          expect.any(Object)
        );
        expect(result).toEqual(mockUsers);
      });
    });

    describe('updateUser', () => {
      it('should update user with PATCH', async () => {
        const mockUser = { id: '1', name: 'Updated', email: 'test@test.com' };
        mockFetch.mockReturnValue(mockResponse(mockUser));

        const result = await api.updateUser('1', { name: 'Updated' }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/1'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ name: 'Updated' }),
          })
        );
        expect(result).toEqual(mockUser);
      });
    });

    describe('deleteUser', () => {
      it('should delete user', async () => {
        mockFetch.mockReturnValue(mockResponse({}));

        await api.deleteUser('1', 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/1'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Space endpoints', () => {
    describe('getSpaces', () => {
      it('should fetch all spaces without token', async () => {
        const mockSpaces = [{ id: '1', name: 'Space 1' }];
        mockFetch.mockReturnValue(mockResponse(mockSpaces));

        const result = await api.getSpaces();

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces'),
          expect.objectContaining({
            headers: expect.not.objectContaining({
              Authorization: expect.any(String),
            }),
          })
        );
        expect(result).toEqual(mockSpaces);
      });
    });

    describe('getSpaceAvailability', () => {
      it('should fetch availability with month and year', async () => {
        const mockAvailability = { spaceId: '1', month: 1, year: 2024, bookedDates: [] };
        mockFetch.mockReturnValue(mockResponse(mockAvailability));

        const result = await api.getSpaceAvailability('1', 1, 2024);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces/1/availability?month=1&year=2024'),
          expect.any(Object)
        );
        expect(result).toEqual(mockAvailability);
      });
    });

    describe('createSpace', () => {
      it('should create space with POST', async () => {
        const mockSpace = { id: '1', name: 'New Space', value: 100 };
        mockFetch.mockReturnValue(mockResponse(mockSpace));

        const result = await api.createSpace({ name: 'New Space', value: 100 }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/spaces'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'New Space', value: 100 }),
          })
        );
        expect(result).toEqual(mockSpace);
      });
    });
  });

  describe('Booking endpoints', () => {
    describe('getMyBookings', () => {
      it('should fetch user bookings', async () => {
        const mockBookings = [{ id: '1', date: '2024-01-01', status: 'PENDING' }];
        mockFetch.mockReturnValue(mockResponse(mockBookings));

        const result = await api.getMyBookings('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/bookings'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer token',
            }),
          })
        );
        expect(result).toEqual(mockBookings);
      });
    });

    describe('createBooking', () => {
      it('should create booking', async () => {
        const mockBooking = { id: '1', date: '2024-01-01', status: 'PENDING', spaceId: '1' };
        mockFetch.mockReturnValue(mockResponse(mockBooking));

        const result = await api.createBooking({ date: '2024-01-01', spaceId: '1' }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/bookings'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockBooking);
      });
    });

    describe('updateBookingStatus', () => {
      it('should update booking status', async () => {
        const mockBooking = { id: '1', status: 'APPROVED' };
        mockFetch.mockReturnValue(mockResponse(mockBooking));

        const result = await api.updateBookingStatus('1', 'APPROVED', 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/bookings/1'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ status: 'APPROVED' }),
          })
        );
        expect(result).toEqual(mockBooking);
      });
    });
  });

  describe('Points endpoints', () => {
    describe('getMyPointsBalance', () => {
      it('should fetch points balance', async () => {
        const mockBalance = { id: '1', userId: '1', balance: 1000 };
        mockFetch.mockReturnValue(mockResponse(mockBalance));

        const result = await api.getMyPointsBalance('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/points/balance'),
          expect.any(Object)
        );
        expect(result).toEqual(mockBalance);
      });
    });

    describe('transferPoints', () => {
      it('should transfer points', async () => {
        mockFetch.mockReturnValue(mockResponse({}));

        await api.transferPoints({ toUserId: '2', amount: 100 }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/points/transfer'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ toUserId: '2', amount: 100 }),
          })
        );
      });
    });

    describe('adjustPoints', () => {
      it('should adjust points for admin', async () => {
        const mockBalance = { id: '1', userId: '2', balance: 500 };
        mockFetch.mockReturnValue(mockResponse(mockBalance));

        const result = await api.adjustPoints('2', { amount: 100, reason: 'Bonus' }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/points/adjust/2'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockBalance);
      });
    });
  });

  describe('Cart endpoints', () => {
    describe('getCart', () => {
      it('should fetch cart', async () => {
        const mockCart = { id: '1', items: [], totalPoints: 0, itemCount: 0 };
        mockFetch.mockReturnValue(mockResponse(mockCart));

        const result = await api.getCart('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/cart'),
          expect.any(Object)
        );
        expect(result).toEqual(mockCart);
      });
    });

    describe('addToCart', () => {
      it('should add item to cart', async () => {
        const mockCart = { id: '1', items: [{ id: '1' }], totalPoints: 100, itemCount: 1 };
        mockFetch.mockReturnValue(mockResponse(mockCart));

        const result = await api.addToCart({ storeItemId: '1', quantity: 1 }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/cart/items'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockCart);
      });
    });

    describe('checkout', () => {
      it('should checkout cart', async () => {
        const mockOrder = { id: '1', totalPoints: 100, status: 'COMPLETED' };
        mockFetch.mockReturnValue(mockResponse(mockOrder));

        const result = await api.checkout('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/cart/checkout'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockOrder);
      });
    });
  });

  describe('Posts endpoints', () => {
    describe('getPosts', () => {
      it('should fetch posts with pagination', async () => {
        const mockResponse = { posts: [], nextCursor: null, hasMore: false };
        (global.fetch as jest.Mock).mockReturnValue({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const result = await api.getPosts('token', 'cursor123', 10);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts?cursor=cursor123&limit=10'),
          expect.any(Object)
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('likePost', () => {
      it('should like a post', async () => {
        mockFetch.mockReturnValue(mockResponse({}));

        await api.likePost('post-1', 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/post-1/like'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    describe('createComment', () => {
      it('should create a comment', async () => {
        const mockComment = { id: '1', content: 'Test comment' };
        mockFetch.mockReturnValue(mockResponse(mockComment));

        const result = await api.createComment('post-1', { content: 'Test comment' }, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/posts/post-1/comments'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockComment);
      });
    });
  });

  describe('Events endpoints', () => {
    describe('getEvents', () => {
      it('should fetch events with filters', async () => {
        const mockEvents = [{ id: '1', name: 'Event 1' }];
        mockFetch.mockReturnValue(mockResponse(mockEvents));

        const result = await api.getEvents('token', { status: 'ACTIVE' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/events?status=ACTIVE'),
          expect.any(Object)
        );
        expect(result).toEqual(mockEvents);
      });
    });

    describe('eventCheckin', () => {
      it('should process event checkin', async () => {
        const mockResult = { success: true, checkinId: '1', pointsAwarded: 100 };
        mockFetch.mockReturnValue(mockResponse(mockResult));

        const result = await api.eventCheckin('qr-payload', 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/events/checkin'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ qrPayload: 'qr-payload' }),
          })
        );
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('Upload endpoints', () => {
    describe('uploadImage', () => {
      it('should upload image with FormData', async () => {
        const mockResult = { url: 'http://example.com/image.jpg', publicId: '123' };
        mockFetch.mockReturnValue(mockResponse(mockResult));

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const result = await api.uploadImage(file, 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/upload'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer token',
            }),
            body: expect.any(FormData),
          })
        );
        expect(result).toEqual(mockResult);
      });

      it('should throw on upload failure', async () => {
        mockFetch.mockReturnValue({
          ok: false,
          status: 500,
        });

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        await expect(api.uploadImage(file, 'token')).rejects.toThrow('Failed to upload image');
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error with message from response', async () => {
      mockFetch.mockReturnValue(mockErrorResponse('Custom error message', 400));

      await expect(api.getMe('token')).rejects.toThrow('Custom error message');
    });

    it('should throw generic error when response has no message', async () => {
      mockFetch.mockReturnValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('JSON parse error')),
      });

      await expect(api.getMe('token')).rejects.toThrow('An error occurred');
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockReturnValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      const result = await api.logout('token');

      expect(result).toEqual({});
    });
  });

  describe('Kyosk endpoints', () => {
    describe('getKyosks', () => {
      it('should fetch all kyosks', async () => {
        const mockKyosks = [{ id: '1', name: 'Kyosk 1', status: 'ACTIVE' }];
        mockFetch.mockReturnValue(mockResponse(mockKyosks));

        const result = await api.getKyosks('token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/kyosk'),
          expect.any(Object)
        );
        expect(result).toEqual(mockKyosks);
      });
    });

    describe('payKyoskOrder', () => {
      it('should process kyosk payment', async () => {
        const mockResult = { success: true, orderId: '1', totalPoints: 50 };
        mockFetch.mockReturnValue(mockResponse(mockResult));

        const result = await api.payKyoskOrder('qr-payload', 'token');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/kyosk/pay'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ qrPayload: 'qr-payload' }),
          })
        );
        expect(result).toEqual(mockResult);
      });
    });
  });

  describe('Jukebox endpoints', () => {
    describe('searchJukeboxTracks', () => {
      it('should search tracks', async () => {
        const mockTracks = [{ id: '1', name: 'Track 1', artistName: 'Artist 1' }];
        mockFetch.mockReturnValue(mockResponse(mockTracks));

        const result = await api.searchJukeboxTracks('test query', 'token', 5);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/jukebox/search?q=test+query&limit=5'),
          expect.any(Object)
        );
        expect(result).toEqual(mockTracks);
      });
    });

    describe('queueJukeboxTrack', () => {
      it('should queue a track', async () => {
        const mockQueueItem = { id: '1', trackId: 'spotify:track:123', status: 'PENDING' };
        mockFetch.mockReturnValue(mockResponse(mockQueueItem));

        const result = await api.queueJukeboxTrack(
          { trackId: 'spotify:track:123', trackName: 'Test', artistName: 'Artist', durationMs: 180000 },
          'token'
        );

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/jukebox/queue'),
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(result).toEqual(mockQueueItem);
      });
    });
  });
});
