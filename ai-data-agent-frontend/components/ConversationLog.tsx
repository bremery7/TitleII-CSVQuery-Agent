'use client';

import { useEffect, useRef } from 'react';

interface ConversationLogProps {
  conversation: string[];
}

export default function ConversationLog({ conversation }: ConversationLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [conversation]);

  return (
    <div className="mb-8 mt-8">
      <h2 className="text-xl font-medium text-white mb-4">Agent Conversation Log</h2>
      <div
        ref={logRef}
        className="bg-[#1f2640] border border-[#3d4571] rounded-lg p-4 h-[350px] overflow-y-auto"
      >
        {conversation.length === 0 ? (
          <p className="text-gray-500">Agent is ready. Enter a query above to start the conversation.</p>
        ) : (
          <div className="space-y-2">
            {conversation.map((line, idx) => {
              let className = 'p-2 rounded';
              
              if (line.startsWith('USER:')) {
                className += ' bg-blue-500/10 border-l-3 border-blue-500 text-blue-400';
              } else if (line.includes('SQL:') || line.includes('Generated SQL:')) {
                className += ' bg-yellow-500/10 border-l-3 border-yellow-500 text-yellow-400 font-mono text-sm';
              } else if (line.includes('ERROR:')) {
                className += ' bg-red-500/10 border-l-3 border-red-500 text-red-400';
              } else if (line.startsWith('AGENT:')) {
                className += ' bg-green-500/10 border-l-3 border-green-500 text-green-400';
              } else {
                className += ' text-gray-300';
              }
              
              return (
                <div key={idx} className={className}>
                  {line}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}