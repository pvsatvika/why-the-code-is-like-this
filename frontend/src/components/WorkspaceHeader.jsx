import React from 'react';

export default function WorkspaceHeader({ repository, stats }) {
  if (!repository) return null;

  return (
    <div className="bg-[#0e1627] border border-[#1a2940] rounded-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00afc4]" />
        <span className="text-[#56647a]">ACTIVE REPOSITORY:</span>
        <span className="font-bold text-[#00afc4]">{repository}</span>
      </div>

      <div className="flex items-center gap-3 text-[#7f8ca3] text-[11px]">
        {stats?.commits !== undefined && (
          <span><strong className="text-[#e8edf7]">{stats.commits}</strong> COMMITS</span>
        )}
        {stats?.pullRequests !== undefined && (
          <span><strong className="text-[#e8edf7]">{stats.pullRequests}</strong> PRS</span>
        )}
        {stats?.issues !== undefined && (
          <span><strong className="text-[#e8edf7]">{stats.issues}</strong> ISSUES</span>
        )}
        <span className="text-[#18b889]">NEO4J READY</span>
      </div>
    </div>
  );
}
