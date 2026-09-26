import React, { useState } from 'react';

export default function EmptyState({ onSelectPreset }) {
  const [hoveredStep, setHoveredStep] = useState(null);

  const workflowSteps = [
    {
      num: '01',
      title: 'CONNECT',
      desc: 'Ingest GitHub git commits, PR discussions, and issue logs into Neo4j graph nodes.'
    },
    {
      num: '02',
      title: 'ASK',
      desc: 'Ask natural language questions about refactors, workarounds, or architectural trade-offs.'
    },
    {
      num: '03',
      title: 'TRACE',
      desc: 'Traverse graph relationships linking files to commits, reviewers, and rationale.'
    },
    {
      num: '04',
      title: 'UNDERSTAND',
      desc: 'Synthesize verified historical explanations grounded in empirical repository evidence.'
    }
  ];

  return (
    <div className="py-12 md:py-16 space-y-16" id="workflow-section">
      
      {/* 1. HERO SECTION - UNCARDED WIDE COMPOSITION */}
      <div className="space-y-6 max-w-4xl">
        
        {/* TAG BADGE */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#8b5cf6] font-mono text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
          Developer Code Archaeology Engine
        </div>

        {/* HERO GIANT HEADLINE */}
        <h1 className="text-5xl sm:text-7xl lg:text-[80px] font-extrabold text-[#f8fafc] tracking-tight leading-[1.05]">
          WHY THE CODE<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f8fafc] via-[#f8fafc] to-[#06b6d4]">
            IS LIKE THIS
          </span>
        </h1>

        {/* SUBTITLE */}
        <p className="text-xl sm:text-2xl font-bold text-[#06b6d4] font-mono">
          Understand the decisions behind the code.
        </p>

        {/* SUPPORTING COPY */}
        <p className="text-lg sm:text-xl text-[#9ca3af] font-sans leading-relaxed max-w-3xl">
          Understand why code changed by connecting commits, pull requests, discussions, issues, and repository history.
        </p>

        {/* HERO CTA BUTTON */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => onSelectPreset && onSelectPreset('expressjs/express')}
            className="inline-flex items-center gap-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#f8fafc] font-mono text-sm font-bold px-8 py-4 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-[#8b5cf6]/25 hover:-translate-y-0.5"
          >
            <span>Explore expressjs/express</span>
            <span>→</span>
          </button>
        </div>

      </div>

      {/* 2. PRODUCT WORKFLOW JOURNEY */}
      <div className="space-y-6 pt-6 border-t border-[#1f2430]">
        
        <div className="text-xs font-mono text-[#6b7280] uppercase tracking-wider">
          HOW IT WORKS · PRODUCT WORKFLOW
        </div>

        <div className="relative">
          {/* THIN CONNECTING LINE ACROSS DESKTOP */}
          <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-[#1f2430] -translate-y-1/2 z-0 hidden lg:block" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {workflowSteps.map((step, idx) => {
              const isHovered = hoveredStep === idx;

              return (
                <div
                  key={step.num}
                  onMouseEnter={() => setHoveredStep(idx)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`p-6 rounded-2xl border transition-all duration-200 cursor-default ${
                    isHovered
                      ? 'bg-[#12141d] border-[#06b6d4] shadow-lg shadow-[#06b6d4]/10 -translate-y-1'
                      : 'bg-[#12141d]/60 border-[#1f2430]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold mb-3">
                    <span className={isHovered ? 'text-[#06b6d4]' : 'text-[#8b5cf6]'}>
                      {step.num}
                    </span>
                    <span className="text-xs text-[#6b7280]">
                      STEP 0{idx + 1}
                    </span>
                  </div>

                  <h3 className={`text-xl font-extrabold font-sans tracking-tight ${isHovered ? 'text-[#f8fafc]' : 'text-[#e2e8f0]'}`}>
                    {step.title}
                  </h3>

                  <p className="text-xs text-[#9ca3af] font-sans mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
