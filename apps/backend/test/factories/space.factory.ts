let spaceCounter = 0;

export const createMockSpace = (overrides: Partial<{
  id: string;
  name: string;
  value: number;
  photos: string[];
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) => {
  spaceCounter++;
  return {
    id: `space-${spaceCounter}`,
    name: `Test Space ${spaceCounter}`,
    value: 100.0,
    photos: ['https://example.com/photo1.jpg'],
    description: `Description for space ${spaceCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const resetSpaceCounter = () => {
  spaceCounter = 0;
};
