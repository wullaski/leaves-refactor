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
}

export interface Player {
  id: string;
  name: string;
  currentRoomId: string;
  inventory: string[]; // item IDs
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

export type CommandAction = 'move' | 'look' | 'inventory' | 'take' | 'drop' | 'examine' | 'put' | 'help' | 'unknown';

export interface ParsedCommand {
  action: CommandAction;
  direction?: Direction;
  target?: string;
  container?: string; // For "put X in Y" commands
  raw: string;
}
