import { BookingStatus } from '@prisma/client';
import { createMockUser } from './user.factory';
import { createMockSpace } from './space.factory';

let bookingCounter = 0;

export const createMockBooking = (overrides: Partial<{
  id: string;
  date: Date;
  userId: string;
  spaceId: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: ReturnType<typeof createMockUser>;
  space?: ReturnType<typeof createMockSpace>;
}> = {}) => {
  bookingCounter++;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    id: `booking-${bookingCounter}`,
    date: tomorrow,
    userId: `user-${bookingCounter}`,
    spaceId: `space-${bookingCounter}`,
    status: BookingStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockBookingWithRelations = (overrides: Partial<ReturnType<typeof createMockBooking>> = {}) => {
  const user = createMockUser({ id: overrides.userId });
  const space = createMockSpace({ id: overrides.spaceId });

  return {
    ...createMockBooking(overrides),
    user,
    space,
  };
};

export const resetBookingCounter = () => {
  bookingCounter = 0;
};
