import express from 'express';
import { fetchRepoData } from '../services/githubService.js';
import { buildDecisionGraph, querySubgraph } from '../services/graphService.js';
import { generateAnswerWithEvidence } from '../services/sarvamService.js';

const router = express.Router();

/**
 * POST /api/ingest
 * Dynamically ingests any target public GitHub repository (owner, repo).
 */
router.post('/ingest', async (req, res) => {
  const { owner, repo } = req.body;

  if (!owner || !repo) {
    return res.status(400).json({
      status: 'error',
      message: "Please specify both 'owner' and 'repo' in request body.",
    });
  }

  try {
    console.log(`[API Route] Triggering fast multi-repo ingestion for: ${owner}/${repo}`);
    const repoData = await fetchRepoData(owner, repo);

    let graphStatus = 'built';
    try {
      await buildDecisionGraph(repoData);
    } catch (graphErr) {
      console.warn(`[API Route] Graph build warning for ${owner}/${repo}:`, graphErr.message);
      graphStatus = `warning: ${graphErr.message}`;
    }

    return res.json({
      status: 'success',
      graphStatus,
      data: repoData,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    console.error(`[API Route] Ingestion error for ${owner}/${repo}:`, error.message);
    return res.status(statusCode).json({
      status: 'error',
      message: error.message || 'Failed to ingest repository.',
    });
  }
});

/**
 * POST /api/query
 * Queries the decision graph & Sarvam AI for evidence-backed answers.
 */
router.post('/query', async (req, res) => {
  const { question, keyword } = req.body;

  if (!question) {
    return res.status(400).json({
      status: 'error',
      message: "Please provide a 'question' in the request body.",
    });
  }

  const searchKeyword = keyword || question.split(' ').filter((w) => w.length > 3)[0] || question;

  try {
    const graphContext = await querySubgraph(searchKeyword);
    const answer = await generateAnswerWithEvidence(question, graphContext);

    return res.json({
      status: 'success',
      answer,
      evidence: graphContext,
    });
  } catch (error) {
    console.error(`[API Route] Query processing error:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to execute query.',
    });
  }
});

export default router;
