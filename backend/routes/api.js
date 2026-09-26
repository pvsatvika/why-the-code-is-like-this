import express from 'express';
import { fetchRepoData } from '../services/githubService.js';
import { buildDecisionGraph, querySubgraph, verifyConnection } from '../services/graphService.js';
import { generateAnswerWithEvidence } from '../services/sarvamService.js';

const router = express.Router();

/**
 * GET /api/health
 * Reports backend status and reachability of external services (GitHub token, Neo4j DB, Sarvam key).
 */
router.get('/health', async (req, res) => {
  const githubConfigured = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN !== 'your_github_token');
  const sarvamConfigured = Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY !== 'your_sarvam_api_key');
  const neo4jHealth = await verifyConnection();

  const isFullyHealthy = neo4jHealth.connected;

  res.status(isFullyHealthy ? 200 : 503).json({
    status: isFullyHealthy ? 'ok' : 'degraded',
    message: isFullyHealthy ? 'Server and Neo4j database are operational' : 'Neo4j connection unverified or unavailable',
    services: {
      github: { configured: githubConfigured },
      neo4j: neo4jHealth,
      sarvam: { configured: sarvamConfigured },
    },
  });
});

/**
 * POST /api/ingest
 * Ingests repository history from GitHub and constructs Neo4j Decision Graph (Phase 3).
 * Input body: { repository: "owner/repo" } or { owner: "...", repo: "..." }
 */
router.post('/ingest', async (req, res) => {
  let { repository, owner, repo } = req.body;

  if (repository && typeof repository === 'string' && repository.includes('/')) {
    const parts = repository.split('/');
    owner = parts[0].trim();
    repo = parts[1].trim();
  }

  if (!owner || !repo) {
    return res.status(400).json({
      status: 'error',
      errorType: 'INVALID_INPUT',
      message: "Please specify a valid repository in format 'owner/repository' or provide both 'owner' and 'repo'.",
    });
  }

  try {
    console.log(`[API Route] Triggering Phase 3 repository ingestion for: ${owner}/${repo}`);

    // Step 1: Deep fetch GitHub history
    const repoData = await fetchRepoData(owner, repo);

    // Step 2: Build Phase 3 Decision Graph in Neo4j
    await buildDecisionGraph(repoData);

    return res.json({
      status: 'success',
      message: `Repository ${owner}/${repo} successfully ingested into Neo4j decision graph.`,
      repository: `${owner}/${repo}`,
      stats: {
        commits: repoData.commits?.length || 0,
        pullRequests: repoData.pullRequests?.length || 0,
        issues: repoData.issues?.length || 0,
      },
    });
  } catch (error) {
    const statusCode = error.status || 500;
    console.error(`[API Route] Ingestion error [${statusCode}]:`, error.message);

    let errorType = 'INGESTION_FAILED';
    if (statusCode === 404) errorType = 'REPO_NOT_FOUND';
    else if (statusCode === 401) errorType = 'GITHUB_UNAUTHORIZED';
    else if (statusCode === 403) errorType = 'GITHUB_RATE_LIMIT';

    return res.status(statusCode).json({
      status: 'error',
      errorType,
      message: error.message || 'Failed to ingest repository history.',
    });
  }
});

/**
 * POST /api/query
 * Executes Multi-hop GraphRAG query: fetches repository-scoped evidence from Neo4j and synthesizes explanation via Sarvam AI.
 * Input body: { question: string, repository?: string }
 */
router.post('/query', async (req, res) => {
  const { question, repository } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      status: 'error',
      errorType: 'INVALID_INPUT',
      message: "Please provide a valid non-empty 'question' string.",
    });
  }

  try {
    console.log(`[API Route] Processing Phase 3 GraphRAG query for repo "${repository || 'AUTO'}": "${question}"`);

    // Step 1: Multi-hop graph retrieval from Neo4j strictly scoped to target repository
    const { evidence, structuredContext } = await querySubgraph(question, repository);

    // Step 2: Generate Sarvam AI explanation structured into 7 sections
    const { answer, confidence } = await generateAnswerWithEvidence(question, evidence, structuredContext);

    return res.json({
      answer,
      confidence,
      evidence,
    });
  } catch (error) {
    console.error(`[API Route] GraphRAG Query error:`, error.message);
    return res.status(500).json({
      status: 'error',
      errorType: 'QUERY_FAILED',
      message: error.message || 'Failed to process GraphRAG query.',
    });
  }
});

export default router;
