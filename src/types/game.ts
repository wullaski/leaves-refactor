export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

export interface Room {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>; // direction -> roomId
  items: string[]; // item IDs
}

export interface Item {
  id: string;
  name: string;
  description: string;
  takeable: boolean;
  size: number; // How much space the item takes up
  isContainer: boolean; // Whether this item can hold other items
  capacity?: number; // If container, how much it can hold (optional, defaults to infinite)
  containedItems: string[]; // Item IDs inside this container
  isLocked: boolean; // Whether this item is currently locked
  keyId?: string; // ID of the key that locks/unlocks this item (optional, if present the item is lockable)
  hiddenBy?: string; // Optional. If present, item is hidden. ID of the item or room that hides this item. If item ID, found by examining that item. If room ID, found by examining in that room.
}

export interface Player {
  id: string;
  name: string;
  currentRoomId: string;
  inventory: string[]; // item IDs
  knownItems: string[]; // item IDs the player is aware of
}

export interface World {
  id: string;
  name: string;
  rooms: Record<string, Room>;
  items: Record<string, Item>;
  players: Record<string, Player>;
  createdBy: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  newRoomId?: string;
}

export type CommandAction = 'move' | 'look' | 'inventory' | 'take' | 'drop' | 'examine' | 'put' | 'lock' | 'unlock' | 'help' | 'unknown';

export interface ParsedCommand {
  action: CommandAction;
  direction?: Direction;
  target?: string;
  container?: string; // For "put X in Y" commands
  raw: string;
}
