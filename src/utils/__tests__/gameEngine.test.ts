import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine';
import type { World } from '../../types/game';

describe('GameEngine', () => {
  let testWorld: World;
  let engine: GameEngine;

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
          items: ['sword'],
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
        },
        'statue': {
          id: 'statue',
          name: 'stone statue',
          description: 'A heavy stone statue.',
          takeable: false,
          size: 50,
          isContainer: false,
          containedItems: [],
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
        },
        'coin': {
          id: 'coin',
          name: 'gold coin',
          description: 'A shiny gold coin.',
          takeable: true,
          size: 1,
          isContainer: false,
          containedItems: [],
        },
      },
      players: {
        'player1': {
          id: 'player1',
          name: 'Test Player',
          currentRoomId: 'room1',
          inventory: [],
        },
      },
    };

    engine = new GameEngine(testWorld, 'player1');
  });

  describe('movement', () => {
    it('should move player to valid exit', () => {
      const result = engine.move('north');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Room Two');
      expect(engine.getCurrentRoom().id).toBe('room2');
    });

    it('should not move to invalid exit', () => {
      const result = engine.move('east');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't go that way");
      expect(engine.getCurrentRoom().id).toBe('room1'); // Still in room1
    });

    it('should describe new room after movement', () => {
      const result = engine.move('north');
      
      expect(result.message).toContain('Room Two');
      expect(result.message).toContain('The second room');
    });
  });

  describe('look', () => {
    it('should describe current room', () => {
      const result = engine.look();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Room One');
      expect(result.message).toContain('The first room');
    });

    it('should list available exits', () => {
      const result = engine.look();
      
      expect(result.message).toContain('north');
    });
  });

  describe('getCurrentRoom', () => {
    it('should return the current room', () => {
      const room = engine.getCurrentRoom();
      
      expect(room.id).toBe('room1');
      expect(room.name).toBe('Room One');
    });
  });

  describe('inventory', () => {
    it('should show empty inventory', () => {
      const result = engine.getInventory();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('empty');
    });

    it('should take an item from the room', () => {
      const result = engine.takeItem('sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('iron sword');
      
      // Item should be in inventory
      const player = engine.getWorld().players['player1'];
      expect(player.inventory).toContain('sword');
      
      // Item should be removed from room
      const room = engine.getCurrentRoom();
      expect(room.items).not.toContain('sword');
    });

    it('should not take non-existent item', () => {
      const result = engine.takeItem('gold');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });

    it('should show items in inventory', () => {
      engine.takeItem('sword');
      const result = engine.getInventory();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('iron sword');
    });

    it('should drop an item from inventory', () => {
      engine.takeItem('sword');
      const result = engine.dropItem('sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('drop');
      
      // Item should be removed from inventory
      const player = engine.getWorld().players['player1'];
      expect(player.inventory).not.toContain('sword');
      
      // Item should be in room
      const room = engine.getCurrentRoom();
      expect(room.items).toContain('sword');
    });

    it('should not drop item not in inventory', () => {
      const result = engine.dropItem('sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });
  });

  describe('examine', () => {
    it('should examine item in room', () => {
      const result = engine.examineItem('sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('A sharp iron sword');
    });

    it('should examine item in inventory', () => {
      engine.takeItem('sword');
      const result = engine.examineItem('sword');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('A sharp iron sword');
    });

    it('should not examine non-existent item', () => {
      const result = engine.examineItem('gold');
      
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
      engine.takeItem('bag');
      engine.takeItem('coin');
      
      const result = engine.putItemInContainer('coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('put');
      
      // Coin should be in bag's containedItems
      const bag = testWorld.items['bag'];
      expect(bag.containedItems).toContain('coin');
      
      // Coin should be removed from player inventory
      const player = testWorld.players['player1'];
      expect(player.inventory).not.toContain('coin');
    });

    it('should not put item in container if item not in inventory', () => {
      engine.takeItem('bag');
      
      const result = engine.putItemInContainer('coin', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't have");
    });

    it('should put item into container when container is in room', () => {
      engine.takeItem('coin');
      
      const result = engine.putItemInContainer('coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('put');
      
      // Coin should be in bag's containedItems
      const bag = testWorld.items['bag'];
      expect(bag.containedItems).toContain('coin');
      
      // Coin should be removed from player inventory
      const player = testWorld.players['player1'];
      expect(player.inventory).not.toContain('coin');
    });

    it('should not put item in non-container', () => {
      engine.takeItem('sword');
      engine.takeItem('coin');
      
      const result = engine.putItemInContainer('coin', 'sword');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("not a container");
    });

    it('should not exceed container capacity', () => {
      engine.takeItem('bag'); // capacity 5, size 2
      engine.takeItem('sword'); // size 2
      
      const result = engine.putItemInContainer('sword', 'bag');
      
      expect(result.success).toBe(true);
      
      // Try to add another larger sword (would exceed capacity: 2 + 4 = 6 > 5)
      testWorld.rooms['room1'].items.push('sword2');
      testWorld.items['sword2'] = {
        id: 'sword2',
        name: 'steel sword',
        description: 'Another sword.',
        takeable: true,
        size: 4,
        isContainer: false,
        containedItems: [],
      };
      
      engine.takeItem('sword2');
      const result2 = engine.putItemInContainer('sword2', 'bag');
      
      expect(result2.success).toBe(false);
      expect(result2.message).toContain("not enough room");
    });

    it('should show container contents when examined', () => {
      engine.takeItem('bag');
      engine.takeItem('coin');
      engine.putItemInContainer('coin', 'bag');
      
      const result = engine.examineItem('bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Contains:');
      expect(result.message).toContain('gold coin');
    });

    it('should take item from container', () => {
      engine.takeItem('bag');
      engine.takeItem('coin');
      engine.putItemInContainer('coin', 'bag');
      
      const result = engine.takeItemFromContainer('coin', 'bag');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('take');
      
      // Coin should be back in inventory
      const player = testWorld.players['player1'];
      expect(player.inventory).toContain('coin');
      
      // Coin should not be in bag
      const bag = testWorld.items['bag'];
      expect(bag.containedItems).not.toContain('coin');
    });

    it('should not put container inside itself', () => {
      engine.takeItem('bag');
      
      const result = engine.putItemInContainer('bag', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("can't put");
    });

    it('should not take item from container not in room or inventory', () => {
      // Put coin in bag and take both
      engine.takeItem('bag');
      engine.takeItem('coin');
      engine.putItemInContainer('coin', 'bag');
      
      // Drop bag in room, then move to another room
      engine.dropItem('bag');
      engine.move('north');
      
      // Try to take coin from bag that's in the other room
      const result = engine.takeItemFromContainer('coin', 'bag');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain("don't see");
    });
  });
});
