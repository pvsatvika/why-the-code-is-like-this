import React, { useState, useEffect } from 'react';

export default function RepositoryInput({
  repository,
  setRepository,
  handleIngest,
  ingestLoading,
  ingestSuccess,
  ingestError,
  backendUnavailable
}) {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    { key: 'CONNECT', label: '01 CONNECT' },
    { key: 'FETCH', label: '02 FETCH' },
    { key: 'PARSE', label: '03 PARSE' },
    { key: 'INDEX', label: '04 INDEX' },
    { key: 'BUILD GRAPH', label: '05 BUILD GRAPH' },
    { key: 'READY', label: '06 READY' }
  ];

  useEffect(() => {
    let timer;
    if (ingestLoading) {
      setActiveStage(1);
      timer = setInterval(() => {
        setActiveStage(prev => (prev < 4 ? prev + 1 : prev));
      }, 700);
    } else if (ingestSuccess) {
      setActiveStage(5);
    } else {
      setActiveStage(0);
    }
    return () => clearInterval(timer);
  }, [ingestLoading, ingestSuccess]);

  const presetRepos = [
    { label: 'expressjs/express' },
    { label: 'facebook/react' },
    { label: 'vercel/next.js' }
  ];

  return (
    <div className="py-8 space-y-6 border-b border-[#1f2430]" id="repository-section">
      
      {/* HEADING & SUPPORTING TEXT */}
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#f8fafc] tracking-tight">
          Start with a repository.
        </h2>
        <p className="text-base text-[#9ca3af] font-sans">
          Connect a public GitHub repository and reconstruct the history behind its code.
        </p>
      </div>

      {/* LARGE HORIZONTAL INTERACTION BAR */}
      <form onSubmit={handleIngest} className="flex flex-col sm:flex-row items-stretch gap-4">
        <div className="relative flex-1">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-base font-mono text-[#6b7280]">
            github.com/
          </span>
          <input
            type="text"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="owner/repository"
            disabled={ingestLoading || backendUnavailable}
            className="w-full bg-[#0d0e14] border border-[#1f2430] rounded-xl pl-36 pr-6 py-5 text-base font-mono text-[#f8fafc] placeholder-[#6b7280] focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all duration-200 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={ingestLoading || !repository.trim() || backendUnavailable}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-[#f8fafc] font-mono text-sm font-bold px-9 py-5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-[#8b5cf6]/25 whitespace-nowrap hover:-translate-y-0.5"
        >
          {ingestLoading ? 'INGESTING GRAPH...' : 'ANALYZE REPOSITORY'}
        </button>
      </form>

      {/* PRESET REPOSITORIES AS SIMPLE SELECTABLE LINKS */}
      <div className="flex flex-wrap items-center gap-4 text-sm font-sans pt-1">
        <span className="text-[#6b7280]">Selectable repositories:</span>
        {presetRepos.map((preset, idx) => (
          <React.Fragment key={preset.label}>
            <button
              type="button"
              onClick={() => setRepository(preset.label)}
              className={`font-mono text-sm transition-all duration-150 cursor-pointer ${
                repository === preset.label
                  ? 'text-[#06b6d4] font-bold border-b-2 border-[#06b6d4] pb-0.5'
                  : 'text-[#9ca3af] hover:text-[#f8fafc] border-b border-transparent hover:border-[#9ca3af] pb-0.5'
              }`}
            >
              {preset.label}
            </button>
            {idx < presetRepos.length - 1 && <span className="text-[#1f2430]">·</span>}
          </React.Fragment>
        ))}
      </div>

      {/* INGESTION STAGES PIPELINE */}
      {(ingestLoading || ingestSuccess) && (
        <div className="pt-4 border-t border-[#1f2430] space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-[#9ca3af]">PIPELINE PROGRESS</span>
            <span className="text-[#06b6d4] font-bold">{stages[activeStage]?.key}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono text-xs">
            {stages.map((stg, idx) => {
              const isCompleted = idx < activeStage || (idx === activeStage && ingestSuccess);
              const isActive = idx === activeStage && ingestLoading;

              return (
                <div
                  key={stg.key}
                  className={`px-3 py-2 rounded-lg border text-center transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#06b6d4]/15 border-[#06b6d4] text-[#06b6d4] font-bold'
                      : isActive
                      ? 'bg-[#8b5cf6]/25 border-[#8b5cf6] text-white font-bold animate-pulse'
                      : 'bg-[#0d0e14] border-[#1f2430] text-[#6b7280]'
                  }`}
                >
                  {stg.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ERROR DISPLAY */}
      {ingestError && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/40 text-xs font-mono text-[#ef4444] rounded-xl">
          {ingestError}
        </div>
      )}

    </div>
  );
}
