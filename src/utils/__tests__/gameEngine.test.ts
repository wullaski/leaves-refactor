import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializePlayerInWorld,
  look,
  movePlayer,
  getInventory,
  examineItem,
  takeItem,
  dropItem,
  takeItemFromContainer,
  putItemInContainer,
  openContainer,
  lockItem,
  unlockItem
} from '../gameActions';
import type { World } from '../../types/game';

describe('GameEngine (Functional)', () => {
  let testWorld: World;
  const playerId = 'player1';

  beforeEach(() => {
    // Create a simple test world
    testWorld = {
      id: 'test-world',
      name: 'Test World',
      createdBy: 'test',
      rooms: {
        'room1': {
          id: 'room1',
          name: 'Room One',
          description: 'The first room.',
          exits: { north: 'room2' },
          items: ['sword', 'chest', 'key', 'coin'],
        },
        'room2': {
          id: 'room2',
          name: 'Room Two',
          description: 'The second room.',
          exits: { south: 'room1' },
          items: [],
        },
      },
      items: {
        'sword': {
          id: 'sword',
          name: 'iron sword',
          description: 'A sharp iron sword.',
          takeable: true,
          size: 2,
          isContainer: false,
          containedItems: [],
          isLocked: false,
        },
        'statue': {
          id: 'statue',
          name: 'stone statue',
          description: 'A heavy stone statue.',
          takeable: false,
          size: 50,
          isContainer: false,
          containedItems: [],
          isLocked: false,
        },
        'bag': {
          id: 'bag',
          name: 'small bag',
          description: 'A small cloth bag.',
          takeable: true,
          size: 2,
          isContainer: true,
          capacity: 5,
          containedItems: [],
          isLocked: false,
        },
        'coin': {
          id: 'coin',
          name: 'gold coin',
          description: 'A shiny gold coin.',
          takeable: true,
          size: 1,
          isContainer: false,
          containedItems: [],
          isLocked: false,
        },
        'chest': {
          id: 'chest',
          name: 'locked chest',
          description: 'A sturdy chest with a lock.',
          takeable: false,
          size: 10,
          isContainer: true,
          capacity: 20,
          containedItems: [],
          isLocked: true,
          keyId: 'key',
        },
        'key': {
          id: 'key',
          name: 'brass key',
          description: 'A small brass key.',
          takeable: true,
          size: 1,
          isContainer: false,
          containedItems: [],
          isLocked: false,
        },
      },
      players: {
        'player1': {
          id: 'player1',
          name: 'Test Player',
          currentRoomId: 'room1',
          inventory: [],
          knownItems: ['sword', 'bag', 'coin', 'chest', 'key'], // Start knowing about all items for tests
        },
      },
    };
  });

  describe('movement', () => {
    it('should move player to valid exit', () => {
      let [newWorld, result] = movePlayer(testWorld, playerId, 'north');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Room Two');
      expect(newWorld.players[playerId].currentRoomId).toBe('room2');
    });

    it('should not move to invalid exit', () => {
      let [newWorld, result] = movePlayer(testWorld, playerId, 'east');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't go that way");
      expect(newWorld.players[playerId].currentRoomId).toBe('room1'); // Still in room1
    });

    it('should describe new room after movement', () => {
      let [newWorld, result] = movePlayer(testWorld, playerId, 'north');
      
      expect(result.message).toContain('Room Two');
      expect(result.message).toContain('The second room');
    });
  });

  describe('look', () => {
    it('should describe current room', () => {
      let [newWorld, result] = look(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Room One');
      expect(result.message).toContain('The first room');
    });

    it('should list available exits', () => {
      let [newWorld, result] = look(testWorld, playerId);
      
      expect(result.message).toContain('north');
    });
  });

  describe('getCurrentRoom', () => {
    it('should return the current room', () => {
      const room = testWorld.rooms[testWorld.players[playerId].currentRoomId];
      
      expect(room.id).toBe('room1');
      expect(room.name).toBe('Room One');
    });
  });

  describe('inventory', () => {
    it('should show empty inventory', () => {
      let [newWorld, result] = getInventory(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('empty');
    });

    it('should take an item from the room', () => {
      let [newWorld, result] = takeItem(testWorld, playerId, 'sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('iron sword');
      
      // Item should be in inventory
      expect(newWorld.players[playerId].inventory).toContain('sword');
      
      // Item should be removed from room
      const room = newWorld.rooms[newWorld.players[playerId].currentRoomId];
      expect(room.items).not.toContain('sword');
    });

    it('should not take non-existent item', () => {
      let [newWorld, result] = takeItem(testWorld, playerId, 'gold');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should show items in inventory', () => {
      let [newWorld, result] = takeItem(testWorld, playerId, 'sword');
      [newWorld, result] = getInventory(newWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('iron sword');
    });

    it('should drop an item from inventory', () => {
      let [newWorld, result] = takeItem(testWorld, playerId, 'sword');
      [newWorld, result] = dropItem(newWorld, playerId, 'sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('drop');
      
      // Item should be removed from inventory
      expect(newWorld.players[playerId].inventory).not.toContain('sword');
      
      // Item should be in room
      const room = newWorld.rooms[newWorld.players[playerId].currentRoomId];
      expect(room.items).toContain('sword');
    });

    it('should not drop item not in inventory', () => {
      let [newWorld, result] = dropItem(testWorld, playerId, 'sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });
  });

  describe('examine', () => {
    it('should examine item in room', () => {
      let [newWorld, result] = examineItem(testWorld, playerId, 'sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('A sharp iron sword');
    });

    it('should examine item in inventory', () => {
      let [newWorld, result] = takeItem(testWorld, playerId, 'sword');
      [newWorld, result] = examineItem(newWorld, playerId, 'sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('A sharp iron sword');
    });

    it('should not examine unknown item', () => {
      // Add a hidden item that player doesn't know about
      testWorld.rooms['room1'].items.push('secretitem');
      testWorld.items['secretitem'] = {
        id: 'secretitem',
        name: 'secret scroll',
        description: 'A mysterious scroll.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1',
      };
      
      let [newWorld, result] = examineItem(testWorld, playerId, 'secret scroll');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should not examine non-existent item', () => {
      let [newWorld, result] = examineItem(testWorld, playerId, 'gold');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });
  });

  describe('containers', () => {
    beforeEach(() => {
      // Add bag and coin to the room for testing
      testWorld.rooms['room1'].items.push('bag', 'coin');
    });

    it('should put item into container when both items are in inventory', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('put');
      
      // Coin should be in bag's containedItems
      expect(world.items['bag'].containedItems).toContain('coin');
      
      // Coin should be removed from player inventory
      expect(world.players[playerId].inventory).not.toContain('coin');
    });

    it('should not put item in container if item not in inventory', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });

    it('should put item into container when container is in room', () => {
      let [world, result] = takeItem(testWorld, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('put');
      
      // Coin should be in bag's containedItems
      expect(world.items['bag'].containedItems).toContain('coin');
      
      // Coin should be removed from player inventory
      expect(world.players[playerId].inventory).not.toContain('coin');
    });

    it('should not put item in non-container', () => {
      let [world, result] = takeItem(testWorld, playerId, 'sword');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("not a container");
    });

    it('should not exceed container capacity', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag'); // capacity 5, size 2
      [world, result] = takeItem(world, playerId, 'sword'); // size 2
      [world, result] = putItemInContainer(world, playerId, 'sword', 'bag');
      
      expect(result.success).toBe(true);
      
      // Try to add another larger sword (would exceed capacity: 2 + 4 = 6 > 5)
      world.rooms['room1'].items.push('sword2');
      world.items['sword2'] = {
        id: 'sword2',
        name: 'steel sword',
        description: 'Another sword.',
        takeable: true,
        size: 4,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      world.players[playerId].knownItems.push('sword2');
      
      [world, result] = takeItem(world, playerId, 'sword2');
      [world, result] = putItemInContainer(world, playerId, 'sword2', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("not enough room");
    });

    it('should show container contents when opened', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      [world, result] = openContainer(world, playerId, 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Inside you see:');
      expect(result.message).toContain('gold coin');
    });

    it('should take item from container', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      [world, result] = takeItemFromContainer(world, playerId, 'coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('take');
      
      // Coin should be back in inventory
      expect(world.players[playerId].inventory).toContain('coin');
      
      // Coin should not be in bag
      expect(world.items['bag'].containedItems).not.toContain('coin');
    });

    it('should not take unknown item from container without opening', () => {
      // Add a new item that's inside the chest but player doesn't know about
      testWorld.items['gem'] = {
        id: 'gem',
        name: 'red gem',
        description: 'A shiny red gem.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      testWorld.items['chest'].containedItems.push('gem');
      testWorld.items['chest'].isLocked = false; // Unlock for this test
      
      // Try to take gem without opening chest first
      let [world, result] = takeItemFromContainer(testWorld, playerId, 'gem', 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't know");
      expect(result.message).toContain("examining");
    });

    it('should reveal container contents when opened', () => {
      // Setup: chest with gem inside, unlocked
      testWorld.items['gem'] = {
        id: 'gem',
        name: 'red gem',
        description: 'A shiny red gem.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      testWorld.items['chest'].containedItems.push('gem');
      testWorld.items['chest'].isLocked = false;
      
      expect(testWorld.players[playerId].knownItems).not.toContain('gem');
      
      // Open chest - should reveal gem
      let [world, openResult] = openContainer(testWorld, playerId, 'chest');
      expect(openResult.success).toBe(true);
      expect(openResult.message).toContain('red gem');
      expect(world.players[playerId].knownItems).toContain('gem');
      
      // Now should be able to take it
      let takeResult;
      [world, takeResult] = takeItemFromContainer(world, playerId, 'gem', 'chest');
      expect(takeResult.success).toBe(true);
    });

    it('should not put container inside itself', () => {
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = putItemInContainer(world, playerId, 'bag', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't put");
    });

    it('should not take item from container not in room or inventory', () => {
      // Put coin in bag and take both
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      // Drop bag in room, then move to another room
      [world, result] = dropItem(world, playerId, 'bag');
      [world, result] = movePlayer(world, playerId, 'north');
      
      // Try to take coin from bag that's in the other room
      [world, result] = takeItemFromContainer(world, playerId, 'coin', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should suggest correct syntax when trying to take item from container without "from"', () => {
      // Setup: put coin in bag
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      // Examine bag so we know about the coin
      [world, result] = examineItem(world, playerId, 'bag');
      
      // Drop bag in room so it's not in inventory
      [world, result] = dropItem(world, playerId, 'bag');
      
      // Try to take coin without "from bag"
      [world, result] = takeItem(world, playerId, 'coin');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("gold coin");
      expect(result.message).toContain("small bag");
      expect(result.message).toContain("try: take");
      expect(result.message).toContain("from");
    });

    it('should suggest correct syntax when trying to take item from container in inventory', () => {
      // Setup: put coin in bag, keep bag in inventory
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      
      // Examine bag so we know about the coin
      [world, result] = examineItem(world, playerId, 'bag');
      
      // Try to take coin without "from bag" (bag is in inventory)
      [world, result] = takeItem(world, playerId, 'coin');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("gold coin");
      expect(result.message).toContain("small bag");
      expect(result.message).toContain("try: take");
      expect(result.message).toContain("from");
    });
  });

  describe('locking', () => {
    it('should unlock a locked container with the correct key', () => {
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('unlock');
      expect(world.items['chest'].isLocked).toBe(false);
    });

    it('should not reveal container contents when unlocking', () => {
      // Create a new hidden item for this test
      testWorld.items['hiddenitem'] = {
        id: 'hiddenitem',
        name: 'hidden item',
        description: 'A hidden item.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      // Add the hidden item to the chest (not in room, not in knownItems)
      testWorld.items['chest'].containedItems.push('hiddenitem');
      
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('unlock');
      expect(result.message).not.toContain('Inside you see:');
      expect(result.message).not.toContain('hidden item');
      // Hidden item should NOT be known yet (need to open)
      expect(world.players[playerId].knownItems).not.toContain('hiddenitem');
    });

    it('should reveal container contents when opening after unlocking', () => {
      // Add an item to the chest
      testWorld.items['chest'].containedItems.push('coin');
      
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      [world, result] = openContainer(world, playerId, 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Inside you see:');
      expect(result.message).toContain('gold coin');
      // Coin should now be known
      expect(world.players[playerId].knownItems).toContain('coin');
    });

    it('should allow taking items from container after unlocking and opening', () => {
      // Add an item to the chest
      testWorld.items['chest'].containedItems.push('coin');
      
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      [world, result] = openContainer(world, playerId, 'chest');
      
      // Should be able to take the item now
      [world, result] = takeItemFromContainer(world, playerId, 'coin', 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('take');
      expect(world.players[playerId].inventory).toContain('coin');
    });

    it('should not unlock without the correct key', () => {
      let [world, result] = unlockItem(testWorld, playerId, 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });

    it('should not unlock an item that is not lockable', () => {
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't be locked");
    });

    it('should not unlock an already unlocked item', () => {
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      [world, result] = unlockItem(world, playerId, 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already unlocked');
    });

    it('should lock an unlocked container with the correct key', () => {
      let [world, result] = takeItem(testWorld, playerId, 'key');
      [world, result] = unlockItem(world, playerId, 'chest');
      [world, result] = lockItem(world, playerId, 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('lock');
      expect(world.items['chest'].isLocked).toBe(true);
    });

    it('should not lock an already locked item', () => {
      let [world, result] = lockItem(testWorld, playerId, 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already locked');
    });

    it('should not access locked container contents', () => {
      testWorld.items['chest'].containedItems.push('coin');
      
      let [world, result] = takeItemFromContainer(testWorld, playerId, 'coin', 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });

    it('should not put items in locked container', () => {
      let [world, result] = takeItem(testWorld, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });

    it('should show locked status when trying to open', () => {
      let [world, result] = openContainer(testWorld, playerId, 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });
  });

  describe('open command', () => {
    it('should open an unlocked container', () => {
      // Add bag to room so we can take it
      testWorld.rooms['room1'].items.push('bag');
      
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = takeItem(world, playerId, 'coin');
      [world, result] = putItemInContainer(world, playerId, 'coin', 'bag');
      [world, result] = openContainer(world, playerId, 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('open');
      expect(result.message).toContain('Inside you see:');
      expect(result.message).toContain('gold coin');
    });

    it('should show empty message when opening empty container', () => {
      // Add bag to room so we can take it
      testWorld.rooms['room1'].items.push('bag');
      
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      [world, result] = openContainer(world, playerId, 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('open');
      expect(result.message).toContain('empty');
    });

    it('should not open a locked container', () => {
      let [world, result] = openContainer(testWorld, playerId, 'chest');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('locked');
    });

    it('should not open non-container items', () => {
      let [world, result] = openContainer(testWorld, playerId, 'sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't open");
    });

    it('should not open non-existent item', () => {
      let [world, result] = openContainer(testWorld, playerId, 'nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should reveal unknown items when opening container', () => {
      // Add bag to room so we can take it
      testWorld.rooms['room1'].items.push('bag');
      
      // Add an item to bag that player doesn't know about
      testWorld.items['gem'] = {
        id: 'gem',
        name: 'shiny gem',
        description: 'A shiny gem.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      testWorld.items['bag'].containedItems.push('gem');
      
      let [world, result] = takeItem(testWorld, playerId, 'bag');
      expect(world.players[playerId].knownItems).not.toContain('gem');
      
      [world, result] = openContainer(world, playerId, 'bag');
      
      expect(result.success).toBe(true);
      expect(world.players[playerId].knownItems).toContain('gem');
      expect(result.message).toContain('shiny gem');
    });
  });

  describe('hidden items', () => {
    it('should only show known items when looking', () => {
      // Add a hidden item to the room
      testWorld.rooms['room1'].items.push('hiddenitem');
      testWorld.items['hiddenitem'] = {
        id: 'hiddenitem',
        name: 'secret note',
        description: 'A hidden note.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1',
      };
      // Player doesn't know about it yet
      
      let [world, result] = look(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).not.toContain('secret note');
      expect(result.message).toContain('iron sword'); // Known item
    });

    it('should discover hidden items when examining without target', () => {
      // Add a hidden item to the room
      testWorld.rooms['room1'].items.push('hiddenitem');
      testWorld.items['hiddenitem'] = {
        id: 'hiddenitem',
        name: 'secret note',
        description: 'A hidden note.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1',
      };
      
      let [world, result] = examineItem(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('secret note');
      expect(world.players[playerId].knownItems).toContain('hiddenitem');
    });

    it('should discover items hidden by other items when examining', () => {
      // Add a hidden item to the room
      testWorld.rooms['room1'].items.push('hiddenkey');
      testWorld.items['hiddenkey'] = {
        id: 'hiddenkey',
        name: 'hidden key',
        description: 'A key that was hidden.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'chest',
      };
      
      let [world, result] = examineItem(testWorld, playerId, 'chest');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('hidden key');
      expect(world.players[playerId].knownItems).toContain('hiddenkey');
    });

    it('should not take unknown items', () => {
      // Add a hidden item to the room
      testWorld.rooms['room1'].items.push('hiddenitem');
      testWorld.items['hiddenitem'] = {
        id: 'hiddenitem',
        name: 'secret note',
        description: 'A hidden note.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1',
      };
      
      let [world, result] = takeItem(testWorld, playerId, 'secret note');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should add taken items to known items', () => {
      // Remove sword from known items
      testWorld.players[playerId].knownItems = testWorld.players[playerId].knownItems.filter(id => id !== 'sword');
      // Manually add it back to known for this test
      testWorld.players[playerId].knownItems.push('sword');
      
      let [world, result] = takeItem(testWorld, playerId, 'sword');
      
      expect(result.success).toBe(true);
      expect(world.players[playerId].knownItems).toContain('sword');
    });

    it('should NOT discover items hidden by other items when examining area', () => {
      // Add a hidden item to the room
      testWorld.rooms['room1'].items.push('hiddenkey2');
      testWorld.items['hiddenkey2'] = {
        id: 'hiddenkey2',
        name: 'silver key',
        description: 'A key that is hidden behind the chest.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'chest',
      };
      
      // Examine the area (without target)
      let [world, result] = examineItem(testWorld, playerId);
      
      // Should not find the key because it's hidden by the chest
      expect(result.success).toBe(true);
      expect(result.message).not.toContain('silver key');
      expect(world.players[playerId].knownItems).not.toContain('hiddenkey2');
    });

    it('should say nothing new found if no hidden items', () => {
      // All items in room1 should be known
      let [world, result] = examineItem(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('nothing new');
    });

    it('should automatically discover visible items in starting room', () => {
      // Create a fresh world with no known items
      const freshWorld = JSON.parse(JSON.stringify(testWorld));
      freshWorld.players[playerId].knownItems = [];
      
      // Initialize player in world
      const initializedWorld = initializePlayerInWorld(freshWorld, playerId);
      
      // Player should know about visible items in room1 (sword, chest, key, coin)
      expect(initializedWorld.players[playerId].knownItems).toContain('sword');
      expect(initializedWorld.players[playerId].knownItems).toContain('chest');
      expect(initializedWorld.players[playerId].knownItems).toContain('key');
      expect(initializedWorld.players[playerId].knownItems).toContain('coin');
      expect(initializedWorld.players[playerId].knownItems.length).toBe(4);
    });

    it('should automatically discover visible items when moving to new room', () => {
      // Add an item to room2
      testWorld.rooms['room2'].items.push('newitem');
      testWorld.items['newitem'] = {
        id: 'newitem',
        name: 'shiny coin',
        description: 'A shiny gold coin.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
      };
      
      expect(testWorld.players[playerId].knownItems).not.toContain('newitem');
      
      // Move to room2
      let [world, result] = movePlayer(testWorld, playerId, 'north');
      
      // Should now know about newitem
      expect(world.players[playerId].knownItems).toContain('newitem');
    });

    it('should NOT auto-discover hidden items when entering room', () => {
      // Create a fresh world with a hidden item
      const freshWorld = JSON.parse(JSON.stringify(testWorld));
      freshWorld.players[playerId].knownItems = [];
      freshWorld.rooms['room1'].items.push('hiddengem');
      freshWorld.items['hiddengem'] = {
        id: 'hiddengem',
        name: 'hidden gem',
        description: 'A hidden gem.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1',
      };
      
      const initializedWorld = initializePlayerInWorld(freshWorld, playerId);
      
      // Should not know about hidden gem
      expect(initializedWorld.players[playerId].knownItems).not.toContain('hiddengem');
    });

    it('should discover items hidden by room when examining area', () => {
      // Add an item hidden by the room itself
      testWorld.rooms['room1'].items.push('secretpassage');
      testWorld.items['secretpassage'] = {
        id: 'secretpassage',
        name: 'secret passage',
        description: 'A hidden passage behind loose stones.',
        takeable: false,
        size: 10,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room1', // Hidden by the room itself
      };
      
      // Examine the area - should find the passage
      let [world, result] = examineItem(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('secret passage');
      expect(world.players[playerId].knownItems).toContain('secretpassage');
    });

    it('should NOT discover items hidden by room when in different room', () => {
      // Add an item hidden by room2
      testWorld.rooms['room1'].items.push('specialitem');
      testWorld.items['specialitem'] = {
        id: 'specialitem',
        name: 'special item',
        description: 'An item hidden by room2.',
        takeable: true,
        size: 1,
        isContainer: false,
        containedItems: [],
        isLocked: false,
        hiddenBy: 'room2', // Hidden by room2, but we're in room1
      };
      
      // Examine the area in room1 - should NOT find the item (it's hidden by room2)
      let [world, result] = examineItem(testWorld, playerId);
      
      expect(result.success).toBe(true);
      expect(result.message).not.toContain('special item');
      expect(world.players[playerId].knownItems).not.toContain('specialitem');
    });
  });
});
