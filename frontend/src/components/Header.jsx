import React from 'react';

export default function Header({ repository, health, healthLoading, backendUnavailable, onReset }) {
  const isNeo4jConnected = health?.services?.neo4j?.connected;

  return (
    <header className="border-b border-[#1a2940] bg-[#0b1120] px-4 md:px-6 py-3">
      <div className="max-w-[1180px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* BRAND IDENTITY */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-xs bg-[#00afc4] flex items-center justify-center font-mono font-bold text-[10px] text-[#070b16] shrink-0">
            ?
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#e8edf7] font-mono">
              WHY THE CODE IS LIKE THIS
            </h1>
            <p className="text-[11px] text-[#7f8ca3] font-sans">
              Understand the decisions behind the code.
            </p>
          </div>

          {repository && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#1a2940] font-mono text-xs text-[#7f8ca3]">
              <span className="text-[10px] uppercase text-[#56647a]">Repo:</span>
              <span className="font-semibold text-[#00afc4]">{repository}</span>
            </div>
          )}
        </div>

        {/* SYSTEM STATUS & CONTROLS */}
        <div className="flex items-center gap-3 text-xs font-mono">
          
          <div className="flex items-center gap-3 text-[11px]">
            <div className="bg-[#0e1627] border border-[#1a2940] px-2.5 py-1 rounded-xs flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isNeo4jConnected ? 'bg-[#00afc4]' : 'bg-[#a97863]'}`} />
              <span className="text-[#56647a]">Neo4j:</span>
              <span className="text-[#e8edf7] font-semibold">{isNeo4jConnected ? 'Graph' : 'Offline'}</span>
            </div>

            <div className="hidden sm:flex bg-[#0e1627] border border-[#1a2940] px-2.5 py-1 rounded-xs items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18b889]" />
              <span className="text-[#56647a]">Sarvam:</span>
              <span className="text-[#e8edf7] font-semibold">Active</span>
            </div>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="bg-[#6754f5]/20 hover:bg-[#6754f5]/30 text-[#6754f5] border border-[#6754f5]/40 font-mono text-xs font-medium px-3 py-1 rounded-xs transition-colors duration-150 cursor-pointer"
            >
              New Query
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
