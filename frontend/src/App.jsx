import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Header from './components/Header';
import RepositoryInput from './components/RepositoryInput';
import WorkspaceHeader from './components/WorkspaceHeader';
import QuestionPanel from './components/QuestionPanel';
import AnswerPanel from './components/AnswerPanel';
import DecisionChain from './components/DecisionChain';
import EvidencePanel from './components/EvidencePanel';
import WhyThisAnswer from './components/WhyThisAnswer';
import HistoryTimeline from './components/HistoryTimeline';
import EmptyState from './components/EmptyState';

export default function App() {
  // Backend & Service Health State
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  // Ingestion State
  const [repository, setRepository] = useState('expressjs/express');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(null);
  const [ingestError, setIngestError] = useState(null);
  const [activeRepoStats, setActiveRepoStats] = useState(null);

  // Query State
  const [question, setQuestion] = useState('Why was error handling modified in router.js?');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Interactive Evidence Filter State
  const [evidenceFilter, setEvidenceFilter] = useState('all');

  // Check Health on Mount via Vite Proxy (/api/health)
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealthLoading(true);
    setBackendUnavailable(false);
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (err) {
      console.error('Health check failed:', err);
      setBackendUnavailable(true);
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  // Handle Repository Ingestion (POST /api/ingest)
  const handleIngest = async (e) => {
    e?.preventDefault();
    if (!repository.trim()) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestSuccess(null);

    try {
      const res = await axios.post('/api/ingest', { repository: repository.trim() });
      setIngestSuccess(res.data);
      if (res.data.stats) {
        setActiveRepoStats(res.data.stats);
      }
    } catch (err) {
      console.error('Ingestion error:', err);
      const status = err.response?.status;
      const data = err.response?.data;

      if (!err.response) {
        setIngestError('Backend server unavailable. Please check Node backend server connection.');
      } else if (status === 404 || data?.errorType === 'REPO_NOT_FOUND') {
        setIngestError(`Repository '${repository}' was not found on GitHub or is private.`);
      } else if (status === 401 || data?.errorType === 'GITHUB_UNAUTHORIZED') {
        setIngestError('GitHub API authentication failed. Check GITHUB_TOKEN in .env file.');
      } else if (status === 403 || data?.errorType === 'GITHUB_RATE_LIMIT') {
        setIngestError('GitHub API rate limit reached. Ensure GITHUB_TOKEN is configured in backend.');
      } else {
        setIngestError(data?.message || err.message || 'GitHub repository ingestion failed.');
      }
    } finally {
      setIngestLoading(false);
    }
  };

  // Handle Question Query (POST /api/query)
  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setEvidenceFilter('all');

    try {
      const res = await axios.post('/api/query', {
        question: question.trim(),
        repository: repository.trim()
      });
      setQueryResult(res.data);
    } catch (err) {
      console.error('Query execution error:', err);
      if (!err.response) {
        setQueryError('Backend server unavailable. Please check backend connection.');
      } else {
        setQueryError(err.response?.data?.message || err.message || 'Query execution failed.');
      }
    } finally {
      setQueryLoading(false);
    }
  };

  const handleReset = () => {
    setQueryResult(null);
    setQueryError(null);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-[#f8fafc] font-sans selection:bg-[#8b5cf6]/30 selection:text-white">
      
      {/* HEADER */}
      <Header
        repository={repository}
        health={health}
        healthLoading={healthLoading}
        backendUnavailable={backendUnavailable}
        onReset={queryResult ? handleReset : null}
      />

      {/* DESKTOP-FIRST WORKSPACE CONTAINER (MAX-WIDTH: 1360PX) */}
      <main className="max-w-[1360px] mx-auto px-6 sm:px-10 py-10 space-y-12">
        
        {/* REPOSITORY INGESTION INTERACTION */}
        <RepositoryInput
          repository={repository}
          setRepository={setRepository}
          handleIngest={handleIngest}
          ingestLoading={ingestLoading}
          ingestSuccess={ingestSuccess}
          ingestError={ingestError}
          backendUnavailable={backendUnavailable}
        />

        {/* ACTIVE REPOSITORY CONTEXT BANNER */}
        {ingestSuccess && (
          <WorkspaceHeader
            repository={ingestSuccess.repository || repository}
            stats={activeRepoStats || ingestSuccess.stats}
          />
        )}

        {/* ASK WHY QUERY COMMAND INTERFACE */}
        <QuestionPanel
          question={question}
          setQuestion={setQuestion}
          handleQuery={handleQuery}
          queryLoading={queryLoading}
          queryError={queryError}
          backendUnavailable={backendUnavailable}
        />

        {/* QUERY RESULT CANVAS OR HERO STARTING WORKFLOW */}
        {queryResult ? (
          <div className="space-y-12 pt-6 border-t border-[#1f2430]">
            
            {/* HORIZONTAL GRAPH REASONING TRAIL */}
            <DecisionChain
              question={question}
              evidence={queryResult.evidence}
              selectedType={evidenceFilter}
              onSelectType={(type) => setEvidenceFilter(type)}
            />

            {/* TWO-COLUMN RESULTS CANVAS: MAIN ANSWER (LEFT) & EVIDENCE (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* MAIN WHY ANSWER CANVAS (7 COLS ON DESKTOP) */}
              <div className="lg:col-span-7 space-y-12">
                <AnswerPanel queryResult={queryResult} />

                <WhyThisAnswer
                  evidenceCount={queryResult.evidence?.length || 0}
                  confidence={queryResult.confidence}
                />
              </div>

              {/* RETRIEVED EVIDENCE & TIMELINE (5 COLS ON DESKTOP) */}
              <div className="lg:col-span-5 space-y-12">
                <EvidencePanel
                  evidence={queryResult.evidence}
                  activeFilter={evidenceFilter}
                  setActiveFilter={(type) => setEvidenceFilter(type)}
                />

                <HistoryTimeline evidence={queryResult.evidence} />
              </div>

            </div>

          </div>
        ) : (
          /* HERO STARTING WORKFLOW */
          <EmptyState onSelectPreset={(preset) => {
            setRepository(preset);
          }} />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1f2430] py-10 text-center text-xs text-[#6b7280] font-mono">
        Why The Code Is Like This :: Neo4j GraphRAG & Sarvam AI Engine
      </footer>

    </div>
  );
}
