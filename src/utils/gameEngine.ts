import type { World, Room, Direction, CommandResult, Player } from '../types/game';

export class GameEngine {
  private world: World;
  private playerId: string;

  constructor(world: World, playerId: string) {
    this.world = world;
    this.playerId = playerId;
    
    // Discover visible items in starting room
    this.discoverVisibleItemsInCurrentRoom();
  }

  private discoverVisibleItemsInCurrentRoom(): void {
    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];
    
    // Add all visible items in the room to knownItems (items that aren't hidden)
    room.items.forEach(itemId => {
      const item = this.world.items[itemId];
      // Add if not hidden and not already known
      if (!item.hiddenBy && !player.knownItems.includes(itemId)) {
        player.knownItems.push(itemId);
      }
    });
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
    
    // Discover visible items in the new room
    this.discoverVisibleItemsInCurrentRoom();

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
    const player = this.world.players[this.playerId];
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

    // Items in room (only show known items)
    if (room.items.length > 0) {
      const knownItemsInRoom = room.items
        .filter(itemId => player.knownItems.includes(itemId))
        .map(itemId => this.world.items[itemId]?.name)
        .filter(Boolean);
      if (knownItemsInRoom.length > 0) {
        parts.push(`\nYou see: ${knownItemsInRoom.join(', ')}`);
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

  private findContainerWithItem(itemId: string, room: Room, player: Player): string | null {
    // Check all items in the room
    for (const containerId of room.items) {
      const container = this.world.items[containerId];
      // Only check containers the player knows about
      if (container.isContainer && 
          player.knownItems.includes(containerId) && 
          container.containedItems.includes(itemId) &&
          player.knownItems.includes(itemId)) {
        return containerId;
      }
    }
    
    // Check all items in player's inventory
    for (const containerId of player.inventory) {
      const container = this.world.items[containerId];
      // Only check containers the player knows about
      if (container.isContainer && 
          player.knownItems.includes(containerId) && 
          container.containedItems.includes(itemId) &&
          player.knownItems.includes(itemId)) {
        return containerId;
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
      // Check if item is in a known container in the room
      const containerWithItem = this.findContainerWithItem(itemId, room, player);
      if (containerWithItem) {
        const item = this.world.items[itemId];
        const container = this.world.items[containerWithItem];
        return {
          success: false,
          message: `You don't see the ${item.name} here. (It's in the ${container.name} - try: take ${item.name} from ${container.name})`,
        };
      }
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    // Check if player knows about this item
    if (!player.knownItems.includes(itemId)) {
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

    // Ensure item is in knownItems (should already be, but just in case)
    if (!player.knownItems.includes(itemId)) {
      player.knownItems.push(itemId);
    }

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

  examineItem(itemIdOrName?: string): CommandResult {
    const room = this.getCurrentRoom();
    const player = this.world.players[this.playerId];

    // If no target specified, search the room for hidden items
    if (!itemIdOrName) {
      const currentRoomId = room.id;
      
      // Reveal hidden items that are hidden by THIS room
      const newItems = room.items.filter(itemId => {
        const item = this.world.items[itemId];
        return item.hiddenBy === currentRoomId && !player.knownItems.includes(itemId);
      });
      
      if (newItems.length === 0) {
        return {
          success: true,
          message: 'You examine the area carefully but find nothing new.',
        };
      }
      
      // Add discovered items to known items
      newItems.forEach(itemId => player.knownItems.push(itemId));
      
      const itemNames = newItems
        .map(itemId => this.world.items[itemId]?.name)
        .filter(Boolean);
      
      return {
        success: true,
        message: `You examine the area and discover: ${itemNames.join(', ')}`,
      };
    }

    // Target specified - examine specific item
    const itemId = this.findItemByName(itemIdOrName);
    
    if (!itemId) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    // Check if item is in room or inventory
    const isInRoom = room.items.includes(itemId);
    const isInInventory = player.inventory.includes(itemId);

    if (!isInRoom && !isInInventory) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    // Player must know about the item to examine it specifically
    if (!player.knownItems.includes(itemId)) {
      return {
        success: false,
        message: `You don't see that here.`,
      };
    }

    const item = this.world.items[itemId];
    let message = item.description;

    // Show locked status if lockable (has a keyId)
    if (item.keyId) {
      if (item.isLocked) {
        message += `\n\nThe ${item.name} is locked.`;
      } else {
        message += `\n\nThe ${item.name} is unlocked.`;
      }
    }

    // If it's a container, show contents (only if unlocked)
    if (item.isContainer && !item.isLocked && item.containedItems.length > 0) {
      // Add container contents to known items when examining
      item.containedItems.forEach(contentId => {
        if (!player.knownItems.includes(contentId)) {
          player.knownItems.push(contentId);
        }
      });
      
      const contentNames = item.containedItems
        .map(id => this.world.items[id]?.name)
        .filter(Boolean);
      message += `\n\nInside you see:\n  ${contentNames.join('\n  ')}`;
    } else if (item.isContainer && !item.isLocked) {
      message += '\n\nIt is empty.';
    }

    // Reveal items hidden by this item
    const hiddenItems = room.items.filter(hiddenItemId => {
      const hiddenItem = this.world.items[hiddenItemId];
      return hiddenItem && hiddenItem.hiddenBy === itemId && !player.knownItems.includes(hiddenItemId);
    });
    
    if (hiddenItems.length > 0) {
      // Add discovered items to known items
      hiddenItems.forEach(hiddenId => player.knownItems.push(hiddenId));
      
      const discoveredNames = hiddenItems
        .map(hiddenId => this.world.items[hiddenId]?.name)
        .filter(Boolean);
      
      message += `\n\nBut you discover: ${discoveredNames.join(', ')}`;
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

    // Player must know about the item (discovered by examining the container)
    if (!player.knownItems.includes(itemId)) {
      return {
        success: false,
        message: `You don't know about that item. Try examining the ${container.name} first.`,
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

    // Check if item is lockable (has a keyId)
    if (!item.keyId) {
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

    // Check if item is lockable (has a keyId)
    if (!item.keyId) {
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

    let message = `You unlock the ${item.name}.`;

    // If it's a container, reveal contents
    if (item.isContainer && item.containedItems.length > 0) {
      // Add container contents to known items
      item.containedItems.forEach(contentId => {
        if (!player.knownItems.includes(contentId)) {
          player.knownItems.push(contentId);
        }
      });
      
      const contentNames = item.containedItems
        .map(id => this.world.items[id]?.name)
        .filter(Boolean);
      message += `\n\nInside you see:\n  ${contentNames.join('\n  ')}`;
    } else if (item.isContainer) {
      message += '\n\nIt is empty.';
    }

    return {
      success: true,
      message,
    };
  }
}
