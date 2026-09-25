import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Generates an architectural explanation using Sarvam AI (sarvam-105b-conversations).
 * Instructs Sarvam to structure the answer into WHY, EVIDENCE, HISTORY, and PEOPLE sections
 * strictly based on the provided GraphRAG evidence.
 * 
 * @param {string} question - Developer question
 * @param {Array<Object>} evidence - Evidence list from graphService.querySubgraph
 * @param {Object} [structuredContext] - Structured graph context object
 * @returns {Promise<{ answer: string, confidence: string }>}
 */
export async function generateAnswerWithEvidence(question, evidence, structuredContext = {}) {
  const apiKey = process.env.SARVAM_API_KEY;
  const isConfigured = apiKey && apiKey !== 'your_sarvam_api_key';

  const cleanQuestion = (question || '').trim();
  const hasEvidence = evidence && Array.isArray(evidence) && evidence.length > 0;
  const confidence = hasEvidence ? 'supported' : 'insufficient_evidence';

  // Format evidence list for prompt context
  let evidenceContext = '';
  if (!hasEvidence) {
    evidenceContext = 'No matching historical evidence (commits, PRs, issues, or review discussions) was found in the graph database for this query.';
  } else {
    evidenceContext = evidence
      .map((item, idx) => `[Evidence #${idx + 1} - ${item.type.toUpperCase()}]\nTitle/Reason: ${item.reason}\nAuthor: ${item.author} | Date: ${item.date} | URL: ${item.url}`)
      .join('\n\n');
  }

  const systemPrompt = `You are a Senior Software Architecture and Code Archaeology expert.
Your job is to answer the developer's question about "Why the code is like this" strictly based on the provided Repository Graph Evidence.

Rules:
1. Base your explanation ONLY on the supplied Repository Graph Evidence.
2. Never invent, assume, or pretend unsupported historical facts are known.
3. If the evidence is insufficient or missing, explicitly state that evidence is insufficient.
4. Clearly distinguish documented facts from inferred reasoning.

You MUST format your response using EXACTLY these 4 section headings:

WHY
<concise explanation of why the code is like this based on evidence>

EVIDENCE
<what historical evidence supports it, citing PRs, commits, issues>

HISTORY
<relevant PR/commit/issue timeline>

PEOPLE
<relevant developer(s) and authors, if available>`;

  const userPrompt = `Developer Question: "${cleanQuestion}"

Repository Graph Evidence Collected:
${evidenceContext}

Explain the likely rationale, intent, or decision behind this code structure based strictly on the evidence above.`;

  if (!isConfigured) {
    console.warn('[Sarvam Service] SARVAM_API_KEY is missing or placeholder. Generating direct GraphRAG synthesis.');
    const answer = generateFallbackAnswer(cleanQuestion, evidence, confidence);
    return { answer, confidence };
  }

  try {
    console.log('[Sarvam Service] Querying Sarvam AI completions API (sarvam-105b-conversations)...');

    const payload = {
      model: 'sarvam-105b-conversations',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 650,
      temperature: 0.2,
    };

    const response = await axios.post(
      SARVAM_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
        },
        timeout: 25000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (!answer || typeof answer !== 'string') {
      throw new Error('Sarvam API returned an empty or invalid response format.');
    }

    console.log('[Sarvam Service] Sarvam AI answer generated successfully.');
    return { answer, confidence };
  } catch (err) {
    console.error('[Sarvam Service] Sarvam API Error Response:', JSON.stringify(err.response?.data || err.message));
    const answer = generateFallbackAnswer(cleanQuestion, evidence, confidence, err.response?.data?.message || err.message);
    return { answer, confidence };
  }
}

/**
 * Direct evidence synthesizer structured into WHY, EVIDENCE, HISTORY, and PEOPLE.
 */
function generateFallbackAnswer(question, evidence, confidence, errorNotice = null) {
  let output = '';

  if (errorNotice) {
    output += `> ⚠️ *Note: Sarvam AI API request notice (${errorNotice}). Synthesizing Graph Evidence directly below:*\n\n`;
  }

  if (confidence === 'insufficient_evidence') {
    output += `WHY\nInsufficient historical evidence was found in the graph database to explain why this code is structured this way.\n\n`;
    output += `EVIDENCE\nNo matching commits, pull requests, decisions, or review discussions were found in the Neo4j graph for question: "${question}".\n\n`;
    output += `HISTORY\nNo relevant timeline available for this query.\n\n`;
    output += `PEOPLE\nNo developer attribution available.`;
    return output;
  }

  output += `WHY\n`;
  output += `Based on repository history, this change was introduced to resolve architectural decisions and issues recorded in the codebase:\n`;
  evidence.slice(0, 3).forEach((item) => {
    output += `- ${item.reason}\n`;
  });
  output += `\n`;

  output += `EVIDENCE\n`;
  evidence.forEach((item, idx) => {
    output += `- **[${item.type.toUpperCase()}]** ${item.title} (by **@${item.author}** on ${item.date})\n`;
  });
  output += `\n`;

  output += `HISTORY\n`;
  evidence.forEach((item) => {
    output += `- **${item.date}**: ${item.title} (${item.url !== '#' ? item.url : 'Graph Record'})\n`;
  });
  output += `\n`;

  output += `PEOPLE\n`;
  const authors = [...new Set(evidence.map((e) => e.author).filter((a) => a && a !== 'Unknown'))];
  if (authors.length > 0) {
    authors.forEach((author) => {
      output += `- **@${author}** (Contributor/Author)\n`;
    });
  } else {
    output += `- Author attribution not explicitly specified in graph nodes.\n`;
  }

  return output;
}
