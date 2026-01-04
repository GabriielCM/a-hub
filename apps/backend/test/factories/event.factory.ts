import { EventStatus } from '@prisma/client';

let eventCounter = 0;

export const createMockEvent = (overrides: Partial<{
  id: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  totalPoints: number;
  status: EventStatus;
  allowMultipleCheckins: boolean;
  maxCheckinsPerUser: number | null;
  checkinIntervalSeconds: number | null;
  qrRotationSeconds: number;
  qrSecret: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  eventCounter++;
  const startAt = new Date();
  const endAt = new Date();
  endAt.setHours(endAt.getHours() + 2);

  return {
    id: `event-${eventCounter}`,
    name: `Test Event ${eventCounter}`,
    description: `Description for event ${eventCounter}`,
    startAt,
    endAt,
    totalPoints: 100,
    status: EventStatus.ACTIVE,
    allowMultipleCheckins: false,
    maxCheckinsPerUser: null,
    checkinIntervalSeconds: null,
    qrRotationSeconds: 30,
    qrSecret: `secret-${eventCounter}`,
    createdById: `admin-${eventCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createMockEventWithMultipleCheckins = (overrides: Partial<ReturnType<typeof createMockEvent>> = {}) => {
  return createMockEvent({
    allowMultipleCheckins: true,
    maxCheckinsPerUser: 3,
    checkinIntervalSeconds: 60,
    ...overrides,
  });
};

export const createMockQRToken = (overrides: Partial<{
  id: string;
  eventId: string;
  sequence: number;
  payload: string;
  expiresAt: Date;
  createdAt: Date;
}> = {}) => {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + 30);

  return {
    id: `qr-token-${eventCounter}`,
    eventId: `event-${eventCounter}`,
    sequence: 1,
    payload: JSON.stringify({ eventId: `event-${eventCounter}`, seq: 1, exp: expiresAt.getTime() }),
    expiresAt,
    createdAt: new Date(),
    ...overrides,
  };
};

export const createMockCheckin = (overrides: Partial<{
  id: string;
  eventId: string;
  userId: string;
  qrTokenId: string;
  checkinNumber: number;
  pointsAwarded: number;
  createdAt: Date;
}> = {}) => {
  return {
    id: `checkin-${eventCounter}`,
    eventId: `event-${eventCounter}`,
    userId: `user-${eventCounter}`,
    qrTokenId: `qr-token-${eventCounter}`,
    checkinNumber: 1,
    pointsAwarded: 100,
    createdAt: new Date(),
    ...overrides,
  };
};

export const resetEventCounter = () => {
  eventCounter = 0;
};
