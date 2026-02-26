'use client';

import { useState, useRef, useEffect } from 'react';
import { parseCommand } from '@/utils/commandParser';

export default function Home() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([
    'Welcome to Leaves - A Text Adventure',
    '---',
    'Type "help" for available commands',
    '',
  ]);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const command = parseCommand(input);
    const newOutput = [...output, `> ${input}`];

    // Handle different command actions
    switch (command.action) {
      case 'move':
        newOutput.push(`You move ${command.direction}.`);
        break;
      case 'look':
        newOutput.push('You look around. (Room description will go here)');
        break;
      case 'inventory':
        newOutput.push('Your inventory is empty.');
        break;
      case 'examine':
        newOutput.push(`You examine the ${command.target}.`);
        break;
      case 'take':
        newOutput.push(`You take the ${command.target}.`);
        break;
      case 'drop':
        newOutput.push(`You drop the ${command.target}.`);
        break;
      case 'help':
        newOutput.push(
          'Available commands:',
          'Movement: north/n, south/s, east/e, west/w, up/u, down/d',
          'Actions: look, inventory/i, take [item], drop [item], examine [item]',
          'Other: help'
        );
        break;
      default:
        newOutput.push("I don't understand that command. Type 'help' for available commands.");
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
