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
        east: 'house',
      },
      items: ['backpack'],
    },
    'house': {
      id: 'house',
      name: 'Abandoned House',
      description: 'An old, abandoned house. The door creaks as it swings open. The entrance is to the west.',
      exits: {
        west: 'garden',
        east: 'entryway',
      },
      items: [],
    },
    'entryway': {
      id: 'entryway',
      name: 'Entryway',
      description: 'The entryway of the house. Dusty furniture is scattered around, and cobwebs hang from the ceiling. The door leads back west.',
      exits: {
        west: 'house',
        north: 'secret-room',
      },
      items: [],
    },
    'secret-room': {
      id: 'secret-room',
      name: 'Secret Room',
      description: 'A hidden room filled with ancient artifacts. The air is thick with mystery. The only exit is back south.',
      exits: {
        south: 'entryway',
        north: 'portal',
      },
      items: [],
    },
    'portal': {
      id: 'portal',
      name: 'Mysterious Portal',
      description: 'A swirling portal of light and energy. It hums with power and seems to lead to another world. The only exit is north.',
      exits: {
        north: 'garden',
      },
      items: [],
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
      isLocked: false,
      hiddenBy: 'chest', // Hidden by the chest - must examine chest to find
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
      isLocked: false,
    },
  },
  players: {
    'player1': {
      id: 'player1',
      name: 'Adventurer',
      currentRoomId: 'entrance',
      inventory: [],
      knownItems: [],
    },
  },
};
