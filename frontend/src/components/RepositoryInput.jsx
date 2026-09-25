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
    <div className="bg-[#0b1120] border border-[#1a2940] rounded-xs p-5 space-y-4">
      
      {/* HEADER & PRESETS ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1a2940] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#00afc4] font-bold">01.</span>
            <span className="text-[#e8edf7] font-bold uppercase tracking-wide">
              connect & ingest repository
            </span>
          </div>
          <p className="text-[11px] text-[#7f8ca3] font-sans mt-0.5">
            Connect a repository to reconstruct the historical context behind the code.
          </p>
        </div>

        {/* PRESET CHIPS */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {presetRepos.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setRepository(preset.label)}
              className={`px-2.5 py-1 text-[11px] rounded-xs border transition-colors duration-150 cursor-pointer ${
                repository === preset.label
                  ? 'bg-[#00afc4]/15 text-[#00afc4] border-[#00afc4] font-semibold'
                  : 'bg-[#0e1627] text-[#7f8ca3] border-[#1a2940] hover:text-[#e8edf7] hover:border-[#263b59]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleIngest} className="flex flex-col sm:flex-row items-stretch gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#56647a]">
            github.com/
          </span>
          <input
            type="text"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            placeholder="owner/repository"
            disabled={ingestLoading || backendUnavailable}
            className="w-full bg-[#080d18] border border-[#1a2940] rounded-xs pl-28 pr-4 py-2 text-xs font-mono text-[#e8edf7] placeholder-[#56647a] focus:outline-none focus:border-[#00afc4] transition-colors duration-150 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={ingestLoading || !repository.trim() || backendUnavailable}
          className="bg-[#6754f5] hover:bg-[#5241db] disabled:opacity-50 text-[#ffffff] font-mono text-xs font-semibold px-5 py-2 rounded-xs transition-colors duration-150 whitespace-nowrap cursor-pointer"
        >
          {ingestLoading ? 'INGESTING...' : 'ANALYZE REPOSITORY'}
        </button>
      </form>

      {/* INGESTION STAGES BAR */}
      {(ingestLoading || ingestSuccess) && (
        <div className="pt-2 border-t border-[#1a2940] space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-[#56647a]">GRAPH INGESTION PIPELINE</span>
            <span className="text-[#00afc4] font-semibold">{stages[activeStage]?.key}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1 font-mono text-[10px]">
            {stages.map((stg, idx) => {
              const isCompleted = idx < activeStage || (idx === activeStage && ingestSuccess);
              const isActive = idx === activeStage && ingestLoading;

              return (
                <div
                  key={stg.key}
                  className={`px-2 py-1 rounded-xs border text-center transition-all duration-150 ${
                    isCompleted
                      ? 'bg-[#0f6e58]/30 border-[#18b889] text-[#18b889] font-bold'
                      : isActive
                      ? 'bg-[#00afc4]/20 border-[#00afc4] text-[#00afc4] font-bold'
                      : 'bg-[#080d18] border-[#1a2940] text-[#56647a]'
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
        <div className="p-3 bg-[#a97863]/10 border border-[#a97863]/40 text-xs font-mono text-[#a97863] rounded-xs">
          {ingestError}
        </div>
      )}

    </div>
  );
}
