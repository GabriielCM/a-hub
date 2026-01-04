export * from './user.factory';
export * from './space.factory';
export * from './booking.factory';
export * from './event.factory';
export * from './points.factory';
export * from './cart.factory';

import { resetUserCounter } from './user.factory';
import { resetSpaceCounter } from './space.factory';
import { resetBookingCounter } from './booking.factory';
import { resetEventCounter } from './event.factory';
import { resetPointsCounter } from './points.factory';
import { resetCartCounter } from './cart.factory';

export const resetAllCounters = () => {
  resetUserCounter();
  resetSpaceCounter();
  resetBookingCounter();
  resetEventCounter();
  resetPointsCounter();
  resetCartCounter();
};
