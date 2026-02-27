import type { World, Room, Direction, CommandResult } from '../types/game';

export class GameEngine {
  private world: World;
  private playerId: string;

  constructor(world: World, playerId: string) {
    this.world = world;
    this.playerId = playerId;
  }

  getCurrentRoom(): Room {
    const player = this.world.players[this.playerId];
    return this.world.rooms[player.currentRoomId];
  }

  move(direction: Direction): CommandResult {
    const currentRoom = this.getCurrentRoom();
    const nextRoomId = currentRoom.exits[direction];

    if (!nextRoomId) {
      return {
        success: false,
        message: `You can't go that way.`,
      };
    }

    const nextRoom = this.world.rooms[nextRoomId];
    
    // Update player's location
    this.world.players[this.playerId].currentRoomId = nextRoomId;

    return {
      success: true,
      message: this.describeRoom(nextRoom),
      newRoomId: nextRoomId,
    };
  }

  look(): CommandResult {
    const room = this.getCurrentRoom();
    return {
      success: true,
      message: this.describeRoom(room),
    };
  }

  private describeRoom(room: Room): string {
    const parts: string[] = [];
    
    // Room name and description
    parts.push(`${room.name}`);
    parts.push(room.description);
    
    // Available exits
    const exits = Object.keys(room.exits);
    if (exits.length > 0) {
      parts.push(`\nExits: ${exits.join(', ')}`);
    } else {
      parts.push('\nNo obvious exits.');
    }

    // Items in room (if any)
    if (room.items.length > 0) {
      const itemNames = room.items
        .map(itemId => this.world.items[itemId]?.name)
        .filter(Boolean);
      if (itemNames.length > 0) {
        parts.push(`\nYou see: ${itemNames.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  getWorld(): World {
    return this.world;
  }

  private findItemByName(name: string): string | null {
    const normalizedName = name.toLowerCase().trim();
    
    // Search through all items
    for (const [itemId, item] of Object.entries(this.world.items)) {
      if (item.name.toLowerCase() === normalizedName || itemId === normalizedName) {
        return itemId;
      }
    }
    
    return null;
  }

  takeItem(itemIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];

    // Check if item is in the room
    if (!room.items.includes(itemId)) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const item = this.world.items[itemId];

    if (!item.takeable) {
      return {
        success: false,
        message: `You can't take the ${item.name}.`,
      };
    }

    // Remove from room and add to inventory
    room.items = room.items.filter(id => id !== itemId);
    player.inventory.push(itemId);

    return {
      success: true,
      message: `You take the ${item.name}.`,
    };
  }

  dropItem(itemIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't have that.`,
      };
    }

    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];

    // Check if item is in inventory
    if (!player.inventory.includes(itemId)) {
      return {
        success: false,
        message: `You don't have that.`,
      };
    }

    const item = this.world.items[itemId];

    // Remove from inventory and add to room
    player.inventory = player.inventory.filter(id => id !== itemId);
    room.items.push(itemId);

    return {
      success: true,
      message: `You drop the ${item.name}.`,
    };
  }

  getInventory(): CommandResult {
    const player = this.world.players[this.playerId];

    if (player.inventory.length === 0) {
      return {
        success: true,
        message: 'Your inventory is empty.',
      };
    }

    const itemNames = player.inventory
      .map(itemId => this.world.items[itemId]?.name)
      .filter(Boolean);

    return {
      success: true,
      message: `You are carrying:\n  ${itemNames.join('\n  ')}`,
    };
  }

  examineItem(itemIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];

    // Check if item is in room or inventory
    const isInRoom = room.items.includes(itemId);
    const isInInventory = player.inventory.includes(itemId);

    if (!isInRoom && !isInInventory) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const item = this.world.items[itemId];
    let message = item.description;

    // Show locked status if lockable
    if (item.isLockable) {
      message += item.isLocked ? '\n\n(locked)' : '\n\n(unlocked)';
    }

    // If it's a container, show contents (only if unlocked)
    if (item.isContainer && !item.isLocked && item.containedItems.length > 0) {
      const contentNames = item.containedItems
        .map(id => this.world.items[id]?.name)
        .filter(Boolean);
      message += `\n\nContains:\n  ${contentNames.join('\n  ')}`;
    } else if (item.isContainer && !item.isLocked) {
      message += '\n\n(empty)';
    } else if (item.isContainer && item.isLocked) {
      message += '\n\nYou cannot see inside while it is locked.';
    }

    return {
      success: true,
      message,
    };
  }

  putItemInContainer(itemIdOrName: string, containerIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    const containerId = this.findItemByName(containerIdOrName);

    if (!itemId || !containerId) {
      return {
        success: false,
        message: `You don't have those items.`,
      };
    }

    // Can't put item in itself
    if (itemId === containerId) {
      return {
        success: false,
        message: `You can't put something inside itself.`,
      };
    }

    const player = this.world.players[this.playerId];
    const item = this.world.items[itemId];
    const container = this.world.items[containerId];
    const room = this.getCurrentRoom();

    // item must be in inventory
    if (!player.inventory.includes(itemId)) {
      return {
        success: false,
        message: `You don't have the ${item.name}.`,
      };
    }
    
    // container must be in room or inventory
    if (!room.items.includes(containerId) && !player.inventory.includes(containerId)) {
      return {
        success: false,
        message: `You don't see the ${container.name} here.`,
      };
    }

    // Container must be a container
    if (!container.isContainer) {
      return {
        success: false,
        message: `The ${container.name} is not a container.`,
      };
    }

    // Check if container is locked
    if (container.isLocked) {
      return {
        success: false,
        message: `The ${container.name} is locked.`,
      };
    }

    // Check capacity
    if (container.capacity !== undefined) {
      const currentSize = container.containedItems.reduce(
        (sum, id) => sum + (this.world.items[id]?.size || 0),
        0
      );
      if (currentSize + item.size > container.capacity) {
        return {
          success: false,
          message: `There's not enough room in the ${container.name}.`,
        };
      }
    }

    // Transfer item
    player.inventory = player.inventory.filter(id => id !== itemId);
    container.containedItems.push(itemId);

    return {
      success: true,
      message: `You put the ${item.name} in the ${container.name}.`,
    };
  }

  takeItemFromContainer(itemIdOrName: string, containerIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    const containerId = this.findItemByName(containerIdOrName);

    if (!itemId || !containerId) {
      return {
        success: false,
        message: `You don't see that.`,
      };
    }

    const player = this.world.players[this.playerId];
    const item = this.world.items[itemId];
    const container = this.world.items[containerId];

    // container must be in room or inventory
    const room = this.getCurrentRoom();
    if (!room.items.includes(containerId) && !player.inventory.includes(containerId)) {
      return {
        success: false,
        message: `You don't see the ${container.name} here.`,
      };
    }

    // Check if container is locked
    if (container.isLocked) {
      return {
        success: false,
        message: `The ${container.name} is locked.`,
      };
    }

    // Item must be in container
    if (!container.containedItems.includes(itemId)) {
      return {
        success: false,
        message: `The ${item.name} is not in the ${container.name}.`,
      };
    }

    // Transfer item
    container.containedItems = container.containedItems.filter(id => id !== itemId);
    player.inventory.push(itemId);

    return {
      success: true,
      message: `You take the ${item.name} from the ${container.name}.`,
    };
  }

  lockItem(itemIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];
    const item = this.world.items[itemId];

    // Check if item is accessible
    const isInRoom = room.items.includes(itemId);
    const isInInventory = player.inventory.includes(itemId);

    if (!isInRoom && !isInInventory) {
      return {
        success: false,
        message: `You don't see the ${item.name} here.`,
      };
    }

    // Check if item is lockable
    if (!item.isLockable) {
      return {
        success: false,
        message: `The ${item.name} can't be locked.`,
      };
    }

    // Check if already locked
    if (item.isLocked) {
      return {
        success: false,
        message: `The ${item.name} is already locked.`,
      };
    }

    // Check if player has the key
    if (item.keyId && !player.inventory.includes(item.keyId)) {
      return {
        success: false,
        message: `You don't have the item to lock the ${item.name}.`,
      };
    }

    // Lock the item
    item.isLocked = true;

    return {
      success: true,
      message: `You lock the ${item.name}.`,
    };
  }

  unlockItem(itemIdOrName: string): CommandResult {
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];
    const item = this.world.items[itemId];

    // Check if item is accessible
    const isInRoom = room.items.includes(itemId);
    const isInInventory = player.inventory.includes(itemId);

    if (!isInRoom && !isInInventory) {
      return {
        success: false,
        message: `You don't see the ${item.name} here.`,
      };
    }

    // Check if item is lockable
    if (!item.isLockable) {
      return {
        success: false,
        message: `The ${item.name} can't be locked or unlocked.`,
      };
    }

    // Check if already unlocked
    if (!item.isLocked) {
      return {
        success: false,
        message: `The ${item.name} is already unlocked.`,
      };
    }

    // Check if player has the key
    if (item.keyId && !player.inventory.includes(item.keyId)) {
      return {
        success: false,
        message: `You don't have the item to unlock the ${item.name}.`,
      };
    }

    // Unlock the item
    item.isLocked = false;

    return {
      success: true,
      message: `You unlock the ${item.name}.`,
    };
  }
}
