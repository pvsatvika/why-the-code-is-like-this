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
 * Ingests repository history from GitHub and constructs Neo4j Decision Graph.
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
    console.log(`[API Route] Triggering repository ingestion for: ${owner}/${repo}`);

    // Step 1: Fetch GitHub history
    const repoData = await fetchRepoData(owner, repo);

    // Step 2: Store decision graph in Neo4j
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
 * Executes GraphRAG query: fetches evidence from Neo4j and synthesizes explanation via Sarvam.
 * Input body: { question: string, repository?: string }
 */
router.post('/query', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      status: 'error',
      errorType: 'INVALID_INPUT',
      message: "Please provide a valid non-empty 'question' string.",
    });
  }

  try {
    console.log(`[API Route] Processing query: "${question}"`);

    // Step 1: Retrieve evidence from Neo4j
    const evidence = await querySubgraph(question);

    // Step 2: Generate answer with Sarvam AI
    const answer = await generateAnswerWithEvidence(question, evidence);

    return res.json({
      answer,
      evidence,
    });
  } catch (error) {
    console.error(`[API Route] Query error:`, error.message);
    return res.status(500).json({
      status: 'error',
      errorType: 'QUERY_FAILED',
      message: error.message || 'Failed to process GraphRAG query.',
    });
  }
});

export default router;
