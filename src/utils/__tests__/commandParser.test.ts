import { describe, it, expect } from 'vitest';
import { parseCommand } from '../commandParser';

describe('commandParser', () => {
  describe('movement commands', () => {
    it('should parse "go north"', () => {
      const result = parseCommand('go north');
      expect(result.action).toBe('move');
      expect(result.direction).toBe('north');
    });

    it('should parse "north" shorthand', () => {
      const result = parseCommand('north');
      expect(result.action).toBe('move');
      expect(result.direction).toBe('north');
    });

    it('should parse "n" abbreviation', () => {
      const result = parseCommand('n');
      expect(result.action).toBe('move');
      expect(result.direction).toBe('north');
    });

    it('should handle all directions', () => {
      const directions = ['north', 'south', 'east', 'west', 'up', 'down'];
      directions.forEach(dir => {
        const result = parseCommand(`go ${dir}`);
        expect(result.action).toBe('move');
        expect(result.direction).toBe(dir);
      });
    });
  });

  describe('observation commands', () => {
    it('should parse "look"', () => {
      const result = parseCommand('look');
      expect(result.action).toBe('look');
    });

    it('should parse "examine" without target', () => {
      const result = parseCommand('examine');
      expect(result.action).toBe('examine');
      expect(result.target).toBeUndefined();
    });

    it('should parse "examine sword"', () => {
      const result = parseCommand('examine sword');
      expect(result.action).toBe('examine');
      expect(result.target).toBe('sword');
    });

    it('should parse "search" without target', () => {
      const result = parseCommand('search');
      expect(result.action).toBe('examine');
      expect(result.target).toBeUndefined();
    });

    it('should parse "search room"', () => {
      const result = parseCommand('search room');
      expect(result.action).toBe('examine');
      expect(result.target).toBe('room');
    });

    it('should parse "inventory"', () => {
      const result = parseCommand('inventory');
      expect(result.action).toBe('inventory');
    });

    it('should parse "i" for inventory', () => {
      const result = parseCommand('i');
      expect(result.action).toBe('inventory');
    });
  });

  describe('item commands', () => {
    it('should parse "take sword"', () => {
      const result = parseCommand('take sword');
      expect(result.action).toBe('take');
      expect(result.target).toBe('sword');
    });

    it('should parse "drop sword"', () => {
      const result = parseCommand('drop sword');
      expect(result.action).toBe('drop');
      expect(result.target).toBe('sword');
    });

    it('should parse "get sword" as take', () => {
      const result = parseCommand('get sword');
      expect(result.action).toBe('take');
      expect(result.target).toBe('sword');
    });
  });

  describe('container commands', () => {
    it('should parse "put sword in backpack"', () => {
      const result = parseCommand('put sword in backpack');
      expect(result.action).toBe('put');
      expect(result.target).toBe('sword');
      expect(result.container).toBe('backpack');
    });

    it('should parse "put sword into backpack"', () => {
      const result = parseCommand('put sword into backpack');
      expect(result.action).toBe('put');
      expect(result.target).toBe('sword');
      expect(result.container).toBe('backpack');
    });

    it('should parse "put sword inside backpack"', () => {
      const result = parseCommand('put sword inside backpack');
      expect(result.action).toBe('put');
      expect(result.target).toBe('sword');
      expect(result.container).toBe('backpack');
    });

    it('should parse "put sword" as unknown', () => {
      const result = parseCommand('put sword');
      expect(result.action).toBe('unknown');
    });

    it('should parse "take sword from backpack"', () => {
      const result = parseCommand('take sword from backpack');
      expect(result.action).toBe('take');
      expect(result.target).toBe('sword');
      expect(result.container).toBe('backpack');
    });

    it('should parse "open chest"', () => {
      const result = parseCommand('open chest');
      expect(result.action).toBe('open');
      expect(result.target).toBe('chest');
    });

    it('should parse "look in chest" as open', () => {
      const result = parseCommand('look in chest');
      expect(result.action).toBe('open');
      expect(result.target).toBe('chest');
    });

    it('should parse "look in bag" as open', () => {
      const result = parseCommand('look in bag');
      expect(result.action).toBe('open');
      expect(result.target).toBe('bag');
    });
  });

  describe('locking commands', () => {
    it('should parse "lock chest"', () => {
      const result = parseCommand('lock chest');
      expect(result.action).toBe('lock');
      expect(result.target).toBe('chest');
    });

    it('should parse "unlock chest"', () => {
      const result = parseCommand('unlock chest');
      expect(result.action).toBe('unlock');
      expect(result.target).toBe('chest');
    });
  });

  describe('help command', () => {
    it('should parse "help"', () => {
      const result = parseCommand('help');
      expect(result.action).toBe('help');
    });
  });

  describe('unknown commands', () => {
    it('should handle unknown command', () => {
      const result = parseCommand('dance');
      expect(result.action).toBe('unknown');
    });

    it('should handle empty input', () => {
      const result = parseCommand('');
      expect(result.action).toBe('unknown');
    });
  });

  describe('normalization', () => {
    it('should trim whitespace', () => {
      const result = parseCommand('  go north  ');
      expect(result.action).toBe('move');
      expect(result.direction).toBe('north');
    });

    it('should handle mixed case', () => {
      const result = parseCommand('GO NORTH');
      expect(result.action).toBe('move');
      expect(result.direction).toBe('north');
    });
  });
});
