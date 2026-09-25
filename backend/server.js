import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchRepoData } from './services/githubParser.js';
import { buildDecisionGraph, verifyConnection } from './services/graphService.js';
import queryRouter from './routes/queryRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "Server running" });
});

// Mount GraphRAG query route (/api/query)
app.use('/api', queryRouter);

/**
 * POST /api/ingest
 * Extracts commit history, modified files, pull requests, and PR discussion comments for a GitHub repo,
 * and constructs a decision graph in Neo4j.
 * Body: { owner: string, repo: string }
 */
app.post('/api/ingest', async (req, res) => {
  const { owner, repo } = req.body;

  if (!owner || !repo) {
    return res.status(400).json({
      status: "error",
      message: "Please provide both 'owner' and 'repo' in the request body.",
    });
  }

  try {
    console.log(`[Ingest Endpoint] Step 1: Extracting repository data for ${owner}/${repo}...`);
    const repoData = await fetchRepoData(owner, repo);

    console.log(`[Ingest Endpoint] Step 2: Building Neo4j Decision Graph for ${owner}/${repo}...`);
    let graphStatus = 'built';
    try {
      await buildDecisionGraph(repoData);
    } catch (graphErr) {
      console.warn(`[Ingest Endpoint] Graph build warning: ${graphErr.message}`);
      graphStatus = `warning: ${graphErr.message}`;
    }

    return res.json({
      status: "success",
      graphStatus,
      data: repoData,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    console.error(`[Ingest Endpoint] Ingestion process failed for ${owner}/${repo}: [${statusCode}] ${error.message}`);
    return res.status(statusCode).json({
      status: "error",
      message: error.message || "An unexpected error occurred during ingestion.",
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await verifyConnection();
});
