'use client';

import { useState, useRef, useEffect } from 'react';
import { parseCommand } from '@/utils/commandParser';
import { sampleWorld } from '@/data/sampleWorld';
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
} from '@/utils/gameActions';
import type { World } from '@/types/game';

export default function Home() {
  const playerId = 'player1';
  
  // Initialize world state
  const [world, setWorld] = useState<World>(() => 
    initializePlayerInWorld(sampleWorld, playerId)
  );
  
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Show initial room description on mount
  useEffect(() => {
    const [, initialRoom] = look(world, playerId);
    setOutput([
      'Welcome to Leaves - A Text Adventure',
      '---',
      '',
      initialRoom.message,
      '',
    ]);
  }, []);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const command = parseCommand(input);
    const newOutput = [...output, `> ${input}`];

    let newWorld = world;
    let result;

    // Handle different command actions using pure functions
    switch (command.action) {
      case 'move':
        [newWorld, result] = movePlayer(world, playerId, command.direction!);
        newOutput.push(result.message);
        break;
      case 'look':
        [newWorld, result] = look(world, playerId);
        newOutput.push(result.message);
        break;
      case 'inventory':
        [newWorld, result] = getInventory(world, playerId);
        newOutput.push(result.message);
        break;
      case 'examine':
        [newWorld, result] = examineItem(world, playerId, command.target);
        newOutput.push(result.message);
        break;
      case 'take':
        if (command.container) {
          // Take from container
          [newWorld, result] = takeItemFromContainer(world, playerId, command.target!, command.container);
        } else {
          // Take from room
          [newWorld, result] = takeItem(world, playerId, command.target!);
        }
        newOutput.push(result.message);
        break;
      case 'drop':
        [newWorld, result] = dropItem(world, playerId, command.target!);
        newOutput.push(result.message);
        break;
      case 'put':
        [newWorld, result] = putItemInContainer(world, playerId, command.target!, command.container!);
        newOutput.push(result.message);
        break;
      case 'open':
        [newWorld, result] = openContainer(world, playerId, command.target!);
        newOutput.push(result.message);
        break;
      case 'lock':
        [newWorld, result] = lockItem(world, playerId, command.target!);
        newOutput.push(result.message);
        break;
      case 'unlock':
        [newWorld, result] = unlockItem(world, playerId, command.target!);
        newOutput.push(result.message);
        break;
      case 'help':
        newOutput.push(
          'Available commands:',
          '  Movement: north/n, south/s, east/e, west/w, up/u, down/d',
          '  Actions: look, inventory/i, take [item], drop [item]',
          '  Examine: examine/search, examine/search [item] - search area or inspect specific item',
          '  Containers: open/look in [container], put [item] in [container], take [item] from [container]',
          '  Locking: lock [item], unlock [item]',
          '  Other: help'
        );
        break;
      default:
        // Check if it's an incomplete "put" command
        if (input.trim().toLowerCase().startsWith('put ')) {
          newOutput.push("Put what where? Try: put [item] in [container]");
        } else {
          newOutput.push("I don't understand that command. Type 'help' for available commands.");
        }
    }

    newOutput.push('');
    setWorld(newWorld);
    setOutput(newOutput);
    setInput('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-4xl flex flex-col h-[600px] border border-green-500 rounded-lg overflow-hidden">
        {/* Output area */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-green-400 bg-black">
          {output.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
          <div ref={outputEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t border-green-500 p-4 bg-black">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm">&gt;</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-green-400 font-mono text-sm outline-none"
              placeholder="Enter command..."
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  );
}
