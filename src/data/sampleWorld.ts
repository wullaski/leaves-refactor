import type { World } from '../types/game';

export const sampleWorld: World = {
  id: 'starter-world',
  name: 'The Beginning',
  createdBy: 'system',
  rooms: {
    'entrance': {
      id: 'entrance',
      name: 'Entrance Hall',
      description: 'You stand in a dimly lit entrance hall. Stone walls surround you, and a wooden door leads north.',
      exits: {
        north: 'garden',
      },
      items: ['key', 'chest'],
    },
    'garden': {
      id: 'garden',
      name: 'Garden',
      description: 'A small garden with overgrown plants. Sunlight filters through the leaves above. The entrance is to the south.',
      exits: {
        south: 'entrance',
      },
      items: ['backpack'],
    },
  },
  items: {
    'key': {
      id: 'key',
      name: 'rusty key',
      description: 'An old, rusty key. It looks like it might open something.',
      takeable: true,
      size: 1,
      isContainer: false,
      containedItems: [],
      isLockable: false,
      isLocked: false,
    },
    'chest': {
      id: 'chest',
      name: 'wooden chest',
      description: 'A small wooden chest with a rusty lock. It looks old and worn.',
      takeable: false,
      size: 5,
      isContainer: true,
      capacity: 10,
      containedItems: ['flower'],
      isLockable: true,
      isLocked: true,
      keyId: 'key',
    },
    'flower': {
      id: 'flower',
      name: 'blue flower',
      description: 'A beautiful blue flower with delicate petals.',
      takeable: true,
      size: 1,
      isContainer: false,
      containedItems: [],
      isLockable: false,
      isLocked: false,
    },
    'backpack': {
      id: 'backpack',
      name: 'leather backpack',
      description: 'A sturdy leather backpack with plenty of room for storage.',
      takeable: true,
      size: 3,
      isContainer: true,
      capacity: 10,
      containedItems: [],
      isLockable: false,
      isLocked: false,
    },
  },
  players: {
    'player1': {
      id: 'player1',
      name: 'Adventurer',
      currentRoomId: 'entrance',
      inventory: [],
    },
  },
};
