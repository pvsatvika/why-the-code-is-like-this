import express from 'express';
import { querySubgraph } from '../services/graphService.js';
import { generateAnswerWithEvidence } from '../services/sarvamService.js';

const router = express.Router();

/**
 * POST /api/query
 * GraphRAG query endpoint:
 * 1. Queries Neo4j database using keyword to retrieve subgraph evidence (commits, PRs, discussions, code entities).
 * 2. Passes graph context and question to Sarvam AI.
 * 3. Returns answer and retrieved graph evidence context.
 * 
 * Body: { question: string, keyword: string }
 */
router.post('/query', async (req, res) => {
  const { question, keyword } = req.body;

  if (!question) {
    return res.status(400).json({
      status: 'error',
      message: "Please provide a 'question' in the request body.",
    });
  }

  // Derive search keyword from explicit parameter or extract target terms from question
  const searchKeyword = keyword || question.split(' ').filter((w) => w.length > 3)[0] || question;

  try {
    console.log(`[Query Route] Received query: "${question}" | Keyword: "${searchKeyword}"`);

    // Step 1: Retrieve connected subgraph nodes from Neo4j
    const graphContext = await querySubgraph(searchKeyword);

    // Step 2: Generate evidence-based answer via Sarvam AI
    const answer = await generateAnswerWithEvidence(question, graphContext);

    // Step 3: Return answer & evidence context
    return res.json({
      status: 'success',
      answer,
      evidence: graphContext,
    });
  } catch (error) {
    console.error(`[Query Route] Error processing query:`, error.message);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process GraphRAG query.',
    });
  }
});

export default router;
