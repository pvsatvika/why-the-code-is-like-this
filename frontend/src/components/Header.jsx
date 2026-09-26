import React from 'react';
import LogoMark from './LogoMark';

export default function Header({ repository, health, healthLoading, backendUnavailable, onReset }) {
  const isNeo4jConnected = health?.services?.neo4j?.connected;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="border-b border-[#1f2430] bg-[#08090d]/90 backdrop-blur-md px-6 sm:px-10 py-4 sticky top-0 z-50">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-6">
        
        {/* BRAND IDENTITY */}
        <div className="group flex items-center gap-3.5 cursor-pointer">
          <div className="block sm:hidden">
            <LogoMark size={28} />
          </div>
          <div className="hidden sm:block">
            <LogoMark size={32} />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#f8fafc] font-sans flex items-center gap-2">
              WHY THE CODE IS LIKE THIS
            </h1>
            <p className="text-xs text-[#9ca3af] font-sans">
              Understand the decisions behind the code.
            </p>
          </div>

          {repository && (
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#1f2430] font-mono text-xs text-[#9ca3af]">
              <span className="text-[10px] uppercase text-[#6b7280]">Target:</span>
              <span className="font-bold text-[#06b6d4]">{repository}</span>
            </div>
          )}
        </div>

        {/* SIMPLE TEXT NAVIGATION & COMPACT CTA */}
        <div className="flex items-center gap-6 text-xs font-mono">
          
          <nav className="hidden md:flex items-center gap-6 text-[#9ca3af]">
            <button
              onClick={() => scrollToSection('repository-section')}
              className="hover:text-[#f8fafc] transition-colors duration-150 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('workflow-section')}
              className="hover:text-[#f8fafc] transition-colors duration-150 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('query-section')}
              className="hover:text-[#f8fafc] transition-colors duration-150 cursor-pointer font-sans text-xs uppercase tracking-wider font-semibold"
            >
              History
            </button>
          </nav>

          {/* STATUS PILLS */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="bg-[#12141d] border border-[#1f2430] px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isNeo4jConnected ? 'bg-[#06b6d4]' : 'bg-[#ef4444]'}`} />
              <span className="text-[#9ca3af]">Graph Engine:</span>
              <span className="text-[#f8fafc] font-semibold">{isNeo4jConnected ? 'Ready' : 'Offline'}</span>
            </div>
          </div>

          {/* COMPACT CTA: ASK WHY */}
          <button
            onClick={() => scrollToSection('query-section')}
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#f8fafc] font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer shadow-md shadow-[#8b5cf6]/20 hover:-translate-y-0.5"
          >
            ASK WHY
          </button>

          {onReset && (
            <button
              onClick={onReset}
              className="bg-[#12141d] hover:bg-[#1f2430] text-[#9ca3af] hover:text-[#f8fafc] border border-[#1f2430] font-mono text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
