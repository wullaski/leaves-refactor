import type { World, Room, Direction, CommandResult, Player, Item } from '../types/game';

// ========== Helper Functions (Pure) ==========

function getCurrentRoom(world: World, playerId: string): Room {
  const player = world.players[playerId];
  return world.rooms[player.currentRoomId];
}

function findItemByName(world: World, name: string): string | null {
  const normalizedName = name.toLowerCase().trim();
  
  for (const [itemId, item] of Object.entries(world.items)) {
    if (item.name.toLowerCase() === normalizedName || itemId === normalizedName) {
      return itemId;
    }
  }
  
  return null;
}

function findContainerWithItem(
  world: World,
  itemId: string,
  room: Room,
  player: Player
): string | null {
  // Check all items in the room
  for (const containerId of room.items) {
    const container = world.items[containerId];
    if (container.isContainer && 
        player.knownItems.includes(containerId) && 
        container.containedItems.includes(itemId) &&
        player.knownItems.includes(itemId)) {
      return containerId;
    }
  }
  
  // Check all items in player's inventory
  for (const containerId of player.inventory) {
    const container = world.items[containerId];
    if (container.isContainer && 
        player.knownItems.includes(containerId) && 
        container.containedItems.includes(itemId) &&
        player.knownItems.includes(itemId)) {
      return containerId;
    }
  }
  
  return null;
}

function describeRoom(world: World, room: Room, playerId: string): string {
  const player = world.players[playerId];
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
      .map(itemId => world.items[itemId]?.name)
      .filter(Boolean);
    if (knownItemsInRoom.length > 0) {
      parts.push(`\nYou see: ${knownItemsInRoom.join(', ')}`);
    }
  }

  return parts.join('\n');
}

// ========== State Transformation Functions ==========

/**
 * Discovers visible items in the current room and adds them to player's known items
 */
function discoverVisibleItems(world: World, playerId: string): World {
  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];
  
  // Find all visible items in the room (items that aren't hidden)
  const newKnownItems = room.items.filter(itemId => {
    const item = world.items[itemId];
    return !item.hiddenBy && !player.knownItems.includes(itemId);
  });
  
  if (newKnownItems.length === 0) {
    return world; // No changes
  }
  
  // Return new world with updated player
  return {
    ...world,
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        knownItems: [...player.knownItems, ...newKnownItems]
      }
    }
  };
}

// ========== Action Functions (Pure) ==========

export function movePlayer(
  world: World,
  playerId: string,
  direction: Direction
): [World, CommandResult] {
  const currentRoom = getCurrentRoom(world, playerId);
  const nextRoomId = currentRoom.exits[direction];

  if (!nextRoomId) {
    return [world, {
      success: false,
      message: `You can't go that way.`,
    }];
  }

  const nextRoom = world.rooms[nextRoomId];
  
  // Update player's location
  const updatedWorld = {
    ...world,
    players: {
      ...world.players,
      [playerId]: {
        ...world.players[playerId],
        currentRoomId: nextRoomId
      }
    }
  };
  
  // Discover visible items in the new room
  const finalWorld = discoverVisibleItems(updatedWorld, playerId);

  return [finalWorld, {
    success: true,
    message: describeRoom(finalWorld, nextRoom, playerId),
    newRoomId: nextRoomId,
  }];
}

export function look(world: World, playerId: string): [World, CommandResult] {
  const room = getCurrentRoom(world, playerId);
  return [world, {
    success: true,
    message: describeRoom(world, room, playerId),
  }];
}

export function getInventory(world: World, playerId: string): [World, CommandResult] {
  const player = world.players[playerId];

  if (player.inventory.length === 0) {
    return [world, {
      success: true,
      message: 'Your inventory is empty.',
    }];
  }

  const itemNames = player.inventory
    .map(itemId => world.items[itemId]?.name)
    .filter(Boolean);

  return [world, {
    success: true,
    message: `You are carrying:\n  ${itemNames.join('\n  ')}`,
  }];
}

export function takeItem(
  world: World,
  playerId: string,
  itemIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  
  if (!itemId) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];

  // Check if item is in the room
  if (!room.items.includes(itemId)) {
    // Check if item is in a known container in the room
    const containerWithItem = findContainerWithItem(world, itemId, room, player);
    if (containerWithItem) {
      const item = world.items[itemId];
      const container = world.items[containerWithItem];
      return [world, {
        success: false,
        message: `You don't see the ${item.name} here. (It's in the ${container.name} - try: take ${item.name} from ${container.name})`,
      }];
    }
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  // Check if player knows about this item
  if (!player.knownItems.includes(itemId)) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const item = world.items[itemId];

  if (!item.takeable) {
    return [world, {
      success: false,
      message: `You can't take the ${item.name}.`,
    }];
  }

  // Create new world with item transferred
  const updatedWorld: World = {
    ...world,
    rooms: {
      ...world.rooms,
      [room.id]: {
        ...room,
        items: room.items.filter(id => id !== itemId)
      }
    },
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        inventory: [...player.inventory, itemId],
        knownItems: player.knownItems.includes(itemId) 
          ? player.knownItems 
          : [...player.knownItems, itemId]
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You take the ${item.name}.`,
  }];
}

export function dropItem(
  world: World,
  playerId: string,
  itemIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  
  if (!itemId) {
    return [world, {
      success: false,
      message: `You don't have that.`,
    }];
  }

  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];

  // Check if item is in inventory
  if (!player.inventory.includes(itemId)) {
    return [world, {
      success: false,
      message: `You don't have that.`,
    }];
  }

  const item = world.items[itemId];

  // Create new world with item transferred
  const updatedWorld: World = {
    ...world,
    rooms: {
      ...world.rooms,
      [room.id]: {
        ...room,
        items: [...room.items, itemId]
      }
    },
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        inventory: player.inventory.filter(id => id !== itemId)
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You drop the ${item.name}.`,
  }];
}

export function examineItem(
  world: World,
  playerId: string,
  itemIdOrName?: string
): [World, CommandResult] {
  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];

  // If no target specified, search the room for hidden items
  if (!itemIdOrName) {
    const currentRoomId = room.id;
    
    // Reveal hidden items that are hidden by THIS room
    const newItems = room.items.filter(itemId => {
      const item = world.items[itemId];
      return item.hiddenBy === currentRoomId && !player.knownItems.includes(itemId);
    });
    
    if (newItems.length === 0) {
      return [world, {
        success: true,
        message: 'You examine the area carefully but find nothing new.',
      }];
    }
    
    // Add discovered items to known items
    const updatedWorld: World = {
      ...world,
      players: {
        ...world.players,
        [playerId]: {
          ...player,
          knownItems: [...player.knownItems, ...newItems]
        }
      }
    };
    
    const itemNames = newItems
      .map(itemId => world.items[itemId]?.name)
      .filter(Boolean);
    
    return [updatedWorld, {
      success: true,
      message: `You examine the area and discover: ${itemNames.join(', ')}`,
    }];
  }

  // Target specified - examine specific item
  const itemId = findItemByName(world, itemIdOrName);
  
  if (!itemId) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  // Check if item is in room or inventory
  const isInRoom = room.items.includes(itemId);
  const isInInventory = player.inventory.includes(itemId);

  if (!isInRoom && !isInInventory) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  // Player must know about the item to examine it specifically
  if (!player.knownItems.includes(itemId)) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const item = world.items[itemId];
  let message = item.description;

  // Collect new known items
  const newKnownItems: string[] = [];

  // Find all items hidden by this item that are still in the room
  const allHiddenItems = room.items.filter(hiddenItemId => {
    const hiddenItem = world.items[hiddenItemId];
    return hiddenItem && hiddenItem.hiddenBy === itemId;
  });
  
  if (allHiddenItems.length > 0) {
    // Separate into newly discovered and already known
    const newlyDiscovered = allHiddenItems.filter(id => !player.knownItems.includes(id));
    const alreadyKnown = allHiddenItems.filter(id => player.knownItems.includes(id));
    
    // Add newly discovered items to known items
    if (newlyDiscovered.length > 0) {
      newKnownItems.push(...newlyDiscovered);
      
      const discoveredNames = newlyDiscovered
        .map(hiddenId => world.items[hiddenId]?.name)
        .filter(Boolean);
      
      // Use custom discovery message if provided, otherwise use default
      const discoveryText = item.discoveryMessage 
        ? `${item.discoveryMessage} ${discoveredNames.join(', ')}`
        : `Behind the ${item.name}, you find: ${discoveredNames.join(', ')}`;
      
      message += `\n\n${discoveryText}`;
    }
    
    // Mention already known items that are still there
    if (alreadyKnown.length > 0) {
      const knownNames = alreadyKnown
        .map(hiddenId => world.items[hiddenId]?.name)
        .filter(Boolean);
      
      message += `\n\nBehind the ${item.name} is: ${knownNames.join(', ')}`;
    }
  }

  // Update world if we discovered new items
  const updatedWorld = newKnownItems.length > 0 ? {
    ...world,
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        knownItems: [...player.knownItems, ...newKnownItems]
      }
    }
  } : world;

  return [updatedWorld, {
    success: true,
    message,
  }];
}

export function putItemInContainer(
  world: World,
  playerId: string,
  itemIdOrName: string,
  containerIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  const containerId = findItemByName(world, containerIdOrName);

  if (!itemId || !containerId) {
    return [world, {
      success: false,
      message: `You don't have those items.`,
    }];
  }

  // Can't put item in itself
  if (itemId === containerId) {
    return [world, {
      success: false,
      message: `You can't put something inside itself.`,
    }];
  }

  const player = world.players[playerId];
  const item = world.items[itemId];
  const container = world.items[containerId];
  const room = getCurrentRoom(world, playerId);

  // item must be in inventory
  if (!player.inventory.includes(itemId)) {
    // Don't reveal the item's name if the player doesn't know about it
    if (!player.knownItems.includes(itemId)) {
      return [world, {
        success: false,
        message: `You don't have that.`,
      }];
    }
    return [world, {
      success: false,
      message: `You don't have the ${item.name}.`,
    }];
  }
  
  // container must be in room or inventory
  if (!room.items.includes(containerId) && !player.inventory.includes(containerId)) {
    return [world, {
      success: false,
      message: `You don't see the ${container.name} here.`,
    }];
  }

  // Container must be a container
  if (!container.isContainer) {
    return [world, {
      success: false,
      message: `The ${container.name} is not a container.`,
    }];
  }

  // Check if container is locked
  if (container.isLocked) {
    return [world, {
      success: false,
      message: `The ${container.name} is locked.`,
    }];
  }

  // Check capacity
  if (container.capacity !== undefined) {
    const currentSize = container.containedItems.reduce(
      (sum, id) => sum + (world.items[id]?.size || 0),
      0
    );
    if (currentSize + item.size > container.capacity) {
      return [world, {
        success: false,
        message: `There's not enough room in the ${container.name}.`,
      }];
    }
  }

  // Transfer item
  const updatedWorld: World = {
    ...world,
    items: {
      ...world.items,
      [containerId]: {
        ...container,
        containedItems: [...container.containedItems, itemId]
      }
    },
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        inventory: player.inventory.filter(id => id !== itemId)
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You put the ${item.name} in the ${container.name}.`,
  }];
}

export function takeItemFromContainer(
  world: World,
  playerId: string,
  itemIdOrName: string,
  containerIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  const containerId = findItemByName(world, containerIdOrName);

  if (!itemId || !containerId) {
    return [world, {
      success: false,
      message: `You don't see that.`,
    }];
  }

  const player = world.players[playerId];
  const item = world.items[itemId];
  const container = world.items[containerId];

  // container must be in room or inventory
  const room = getCurrentRoom(world, playerId);
  if (!room.items.includes(containerId) && !player.inventory.includes(containerId)) {
    return [world, {
      success: false,
      message: `You don't see the ${container.name} here.`,
    }];
  }

  // Check if container is locked
  if (container.isLocked) {
    return [world, {
      success: false,
      message: `The ${container.name} is locked.`,
    }];
  }

  // Item must be in container
  if (!container.containedItems.includes(itemId)) {
    // Don't reveal the item's name if the player doesn't know about it
    if (!player.knownItems.includes(itemId)) {
      return [world, {
        success: false,
        message: `You don't see that in the ${container.name}.`,
      }];
    }
    return [world, {
      success: false,
      message: `The ${item.name} is not in the ${container.name}.`,
    }];
  }

  // Player must know about the item (discovered by examining the container)
  if (!player.knownItems.includes(itemId)) {
    return [world, {
      success: false,
      message: `You don't know about that item. Try examining the ${container.name} first.`,
    }];
  }

  // Transfer item
  const updatedWorld: World = {
    ...world,
    items: {
      ...world.items,
      [containerId]: {
        ...container,
        containedItems: container.containedItems.filter(id => id !== itemId)
      }
    },
    players: {
      ...world.players,
      [playerId]: {
        ...player,
        inventory: [...player.inventory, itemId]
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You take the ${item.name} from the ${container.name}.`,
  }];
}

export function openContainer(
  world: World,
  playerId: string,
  containerIdOrName: string
): [World, CommandResult] {
  const containerId = findItemByName(world, containerIdOrName);
  
  if (!containerId) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];
  const container = world.items[containerId];

  // Check if container is accessible
  const isInRoom = room.items.includes(containerId);
  const isInInventory = player.inventory.includes(containerId);

  if (!isInRoom && !isInInventory) {
    return [world, {
      success: false,
      message: `You don't see the ${container.name} here.`,
    }];
  }

  // Must be a container
  if (!container.isContainer) {
    return [world, {
      success: false,
      message: `You can't open the ${container.name}.`,
    }];
  }

  // Check if locked
  if (container.isLocked) {
    return [world, {
      success: false,
      message: `The ${container.name} is locked.`,
    }];
  }

  // Container is unlocked - reveal contents
  const newKnownItems = container.containedItems.filter(
    contentId => !player.knownItems.includes(contentId)
  );

  let updatedWorld = world;
  if (newKnownItems.length > 0) {
    updatedWorld = {
      ...world,
      players: {
        ...world.players,
        [playerId]: {
          ...player,
          knownItems: [...player.knownItems, ...newKnownItems]
        }
      }
    };
  }

  let message = `You open the ${container.name}.`;

  if (container.containedItems.length > 0) {
    const contentNames = container.containedItems
      .map(id => world.items[id]?.name)
      .filter(Boolean);
    message += `\n\nInside you see:\n  ${contentNames.join('\n  ')}`;
  } else {
    message += '\n\nIt is empty.';
  }

  return [updatedWorld, {
    success: true,
    message,
  }];
}

export function lockItem(
  world: World,
  playerId: string,
  itemIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  
  if (!itemId) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];
  const item = world.items[itemId];

  // Check if item is accessible
  const isInRoom = room.items.includes(itemId);
  const isInInventory = player.inventory.includes(itemId);

  if (!isInRoom && !isInInventory) {
    return [world, {
      success: false,
      message: `You don't see the ${item.name} here.`,
    }];
  }

  // Check if item is lockable (has a keyId)
  if (!item.keyId) {
    return [world, {
      success: false,
      message: `The ${item.name} can't be locked.`,
    }];
  }

  // Check if already locked
  if (item.isLocked) {
    return [world, {
      success: false,
      message: `The ${item.name} is already locked.`,
    }];
  }

  // Check if player has the key
  if (item.keyId && !player.inventory.includes(item.keyId)) {
    return [world, {
      success: false,
      message: `You don't have the item to lock the ${item.name}.`,
    }];
  }

  // Lock the item
  const updatedWorld: World = {
    ...world,
    items: {
      ...world.items,
      [itemId]: {
        ...item,
        isLocked: true
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You lock the ${item.name}.`,
  }];
}

export function unlockItem(
  world: World,
  playerId: string,
  itemIdOrName: string
): [World, CommandResult] {
  const itemId = findItemByName(world, itemIdOrName);
  
  if (!itemId) {
    return [world, {
      success: false,
      message: `You don't see that here.`,
    }];
  }

  const room = getCurrentRoom(world, playerId);
  const player = world.players[playerId];
  const item = world.items[itemId];

  // Check if item is accessible
  const isInRoom = room.items.includes(itemId);
  const isInInventory = player.inventory.includes(itemId);

  if (!isInRoom && !isInInventory) {
    return [world, {
      success: false,
      message: `You don't see the ${item.name} here.`,
    }];
  }

  // Check if item is lockable (has a keyId)
  if (!item.keyId) {
    return [world, {
      success: false,
      message: `The ${item.name} can't be locked or unlocked.`,
    }];
  }

  // Check if already unlocked
  if (!item.isLocked) {
    return [world, {
      success: false,
      message: `The ${item.name} is already unlocked.`,
    }];
  }

  // Check if player has the key
  if (item.keyId && !player.inventory.includes(item.keyId)) {
    return [world, {
      success: false,
      message: `You don't have the item to unlock the ${item.name}.`,
    }];
  }

  // Unlock the item
  const updatedWorld: World = {
    ...world,
    items: {
      ...world.items,
      [itemId]: {
        ...item,
        isLocked: false
      }
    }
  };

  return [updatedWorld, {
    success: true,
    message: `You unlock the ${item.name}.`,
  }];
}

// ========== Initialization Function ==========

/**
 * Initialize world state for a player by discovering visible items in starting room
 */
export function initializePlayerInWorld(world: World, playerId: string): World {
  return discoverVisibleItems(world, playerId);
}
