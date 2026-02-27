'use client';

import { useState, useRef, useEffect } from 'react';
import { parseCommand } from '@/utils/commandParser';
import { GameEngine } from '@/utils/gameEngine';
import { sampleWorld } from '@/data/sampleWorld';

export default function Home() {
  // Initialize game engine with sample world
  const [engine] = useState(() => new GameEngine(sampleWorld, 'player1'));
  
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Show initial room description on mount
  useEffect(() => {
    const initialRoom = engine.look();
    setOutput([
      'Welcome to Leaves - A Text Adventure',
      '---',
      '',
      initialRoom.message,
      '',
    ]);
  }, [engine]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const command = parseCommand(input);
    const newOutput = [...output, `> ${input}`];

    let result;

    // Handle different command actions using the game engine
    switch (command.action) {
      case 'move':
        result = engine.move(command.direction!);
        newOutput.push(result.message);
        break;
      case 'look':
        result = engine.look();
        newOutput.push(result.message);
        break;
      case 'inventory':
        result = engine.getInventory();
        newOutput.push(result.message);
        break;
      case 'examine':
        result = engine.examineItem(command.target!);
        newOutput.push(result.message);
        break;
      case 'take':
        if (command.container) {
          // Take from container
          result = engine.takeItemFromContainer(command.target!, command.container);
        } else {
          // Take from room
          result = engine.takeItem(command.target!);
        }
        newOutput.push(result.message);
        break;
      case 'drop':
        result = engine.dropItem(command.target!);
        newOutput.push(result.message);
        break;
      case 'put':
        result = engine.putItemInContainer(command.target!, command.container!);
        newOutput.push(result.message);
        break;
      case 'lock':
        result = engine.lockItem(command.target!);
        newOutput.push(result.message);
        break;
      case 'unlock':
        result = engine.unlockItem(command.target!);
        newOutput.push(result.message);
        break;
      case 'help':
        newOutput.push(
          'Available commands:',
          '  Movement: north/n, south/s, east/e, west/w, up/u, down/d',
          '  Actions: look, inventory/i, take [item], drop [item], examine [item]',
          '  Containers: put [item] in [container], take [item] from [container]',
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
