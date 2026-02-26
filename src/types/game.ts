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

export type CommandAction = 'move' | 'look' | 'inventory' | 'take' | 'drop' | 'examine' | 'help' | 'unknown';

export interface ParsedCommand {
  action: CommandAction;
  direction?: Direction;
  target?: string;
  raw: string;
}
