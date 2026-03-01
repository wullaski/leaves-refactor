import type { ParsedCommand, Direction, CommandAction } from '../types/game';

const DIRECTION_MAP: Record<string, Direction> = {
  'north': 'north',
  'n': 'north',
  'south': 'south',
  's': 'south',
  'east': 'east',
  'e': 'east',
  'west': 'west',
  'w': 'west',
  'up': 'up',
  'u': 'up',
  'down': 'down',
  'd': 'down',
};

const MOVEMENT_VERBS = ['go', 'move', 'walk', 'run', 'head'];
const TAKE_VERBS = ['take', 'get', 'grab', 'pickup'];
const DROP_VERBS = ['drop'];
const EXAMINE_VERBS = ['examine', 'inspect', 'look at', 'x'];
const INVENTORY_VERBS = ['inventory', 'inv', 'i'];

export function parseCommand(input: string): ParsedCommand {
  const raw = input;
  const normalized = input.trim().toLowerCase();
  
  if (!normalized) {
    return { action: 'unknown', raw };
  }

  const parts = normalized.split(/\s+/);
  const firstWord = parts[0];
  const secondWord = parts[1];
  const restWords = parts.slice(1).join(' ');

  // Check for direct direction command
  if (DIRECTION_MAP[firstWord] && !secondWord) {
    return {
      action: 'move',
      direction: DIRECTION_MAP[firstWord],
      raw,
    };
  }

  // Check for "go/move direction"
  if (MOVEMENT_VERBS.includes(firstWord) && secondWord && DIRECTION_MAP[secondWord]) {
    return {
      action: 'move',
      direction: DIRECTION_MAP[secondWord],
      raw,
    };
  }

  // Check for look command
  if (firstWord === 'look' && !secondWord) {
    return { action: 'look', raw };
  }

  // Check for inventory
  if (INVENTORY_VERBS.includes(firstWord)) {
    return { action: 'inventory', raw };
  }

  // Check for examine (can be with or without target)
  if (EXAMINE_VERBS.includes(firstWord)) {
    return {
      action: 'examine',
      target: restWords || undefined,
      raw,
    };
  }

  // Check for take
  if (TAKE_VERBS.includes(firstWord) && restWords) {
    // Check for "take X from Y" pattern
    const fromMatch = restWords.match(/^(.+?)\s+from\s+(.+)$/);
    if (fromMatch) {
      return {
        action: 'take',
        target: fromMatch[1],
        container: fromMatch[2],
        raw,
      };
    }
    
    return {
      action: 'take',
      target: restWords,
      raw,
    };
  }

  // Check for "put X in Y" pattern
  if (firstWord === 'put' && restWords) {
    const inMatch = restWords.match(/^(.+?)\s+in(?:to|side)?\s+(.+)$/);
    if (inMatch) {
      return {
        action: 'put',
        target: inMatch[1],
        container: inMatch[2],
        raw,
      };
    }
    // If just "put X" without destination, return unknown
    return {
      action: 'unknown',
      raw,
    };
  }

  // Check for drop
  if (DROP_VERBS.includes(firstWord) && restWords) {
    return {
      action: 'drop',
      target: restWords,
      raw,
    };
  }

  // Check for lock
  if (firstWord === 'lock' && restWords) {
    return {
      action: 'lock',
      target: restWords,
      raw,
    };
  }

  // Check for unlock
  if (firstWord === 'unlock' && restWords) {
    return {
      action: 'unlock',
      target: restWords,
      raw,
    };
  }

  // Check for help
  if (firstWord === 'help') {
    return { action: 'help', raw };
  }

  // Unknown command
  return { action: 'unknown', raw };
}
