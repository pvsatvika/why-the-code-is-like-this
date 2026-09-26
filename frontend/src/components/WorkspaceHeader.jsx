import React from 'react';

export default function WorkspaceHeader({ repository, stats }) {
  if (!repository) return null;

  return (
    <div className="bg-[#12141d] border border-[#1f2430] rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shadow-md">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]" />
        <span className="text-[#9ca3af]">ACTIVE REPOSITORY CONTEXT:</span>
        <span className="font-bold text-white text-sm">{repository}</span>
      </div>

      <div className="flex items-center gap-5 text-[#9ca3af]">
        {stats?.commits !== undefined && (
          <span><strong className="text-white text-xs">{stats.commits}</strong> COMMITS</span>
        )}
        {stats?.pullRequests !== undefined && (
          <span><strong className="text-white text-xs">{stats.pullRequests}</strong> PRS</span>
        )}
        {stats?.issues !== undefined && (
          <span><strong className="text-white text-xs">{stats.issues}</strong> ISSUES</span>
        )}
        <span className="text-[#06b6d4] font-bold bg-[#06b6d4]/10 border border-[#06b6d4]/30 px-2.5 py-1 rounded-md">
          NEO4J GRAPH READY
        </span>
      </div>
    </div>
  );
}
