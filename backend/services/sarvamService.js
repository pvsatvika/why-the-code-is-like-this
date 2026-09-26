import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Generates an architectural explanation using Sarvam AI (sarvam-105b-conversations).
 * Instructs Sarvam to structure the answer into 7 plain-English sections
 * strictly based on the provided repository-scoped GraphRAG evidence.
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
  const repoName = structuredContext.repository || 'this repository';
  const hasEvidence = evidence && Array.isArray(evidence) && evidence.length > 0;
  const confidence = hasEvidence ? 'supported' : 'insufficient_evidence';

  // Format evidence list for prompt context
  let evidenceContext = '';
  if (!hasEvidence) {
    evidenceContext = `No matching historical evidence (commits, PRs, issues, or review discussions) was found in the graph database for ${repoName}.`;
  } else {
    evidenceContext = evidence
      .map((item, idx) => `[Evidence #${idx + 1} - ${item.type.toUpperCase()}]\nTitle/Reason: ${item.reason}\nAuthor: ${item.author} | Date: ${item.date} | URL: ${item.url}`)
      .join('\n\n');
  }

  const systemPrompt = `You are a Senior Software Archaeology Expert explaining code history for the repository "${repoName}".
Your job is to answer why code was changed in plain English, avoiding raw graph or database jargon.

CRITICAL RULES:
1. Base your response STRICTLY on the supplied Evidence for "${repoName}".
2. Never reference or invent facts from any other project (e.g. Express, React, Next.js, Tailwind, FastAPI).
3. If the evidence does NOT contain enough information to answer why the change was made, explicitly state:
"I couldn't find enough historical evidence in this repository to determine why this change was made."
4. Format your output using EXACTLY these 7 section headers:

1. WHAT HAPPENED?
<plain-English explanation of the code change>

2. WHAT PROBLEM WAS BEING SOLVED?
<simple explanation of the problem>

3. WHY WAS IT CHANGED?
<historical reasoning supported ONLY by the repository evidence, or state clearly if unsupported>

4. WHAT CHANGED?
<explain old behavior vs new behavior in simple terms>

5. EVIDENCE
<specific commit, PR, issue, or discussion title from the evidence>

6. WHO MADE THE CHANGE?
<contributor name/handle if present in evidence, otherwise "Not specified in repository records">

7. SOURCE
<exact GitHub source URL(s) from the evidence>`;

  const userPrompt = `Repository: "${repoName}"
Developer Question: "${cleanQuestion}"

Repository Graph Evidence Collected:
${evidenceContext}

Synthesize a clear plain-English explanation following the 7 sections specified above.`;

  if (!isConfigured) {
    console.warn('[Sarvam Service] SARVAM_API_KEY is missing or placeholder. Generating direct GraphRAG synthesis.');
    const answer = generateFallbackAnswer(cleanQuestion, evidence, confidence, null, repoName);
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
      max_tokens: 750,
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
    const answer = generateFallbackAnswer(cleanQuestion, evidence, confidence, err.response?.data?.message || err.message, repoName);
    return { answer, confidence };
  }
}

/**
 * Direct evidence synthesizer formatted into 7 sections.
 */
function generateFallbackAnswer(question, evidence, confidence, errorNotice = null, repoName = 'this repository') {
  let output = '';

  if (errorNotice) {
    output += `> ⚠️ *Notice: Sarvam AI service notice (${errorNotice}). Synthesizing repository evidence directly below:*\n\n`;
  }

  if (confidence === 'insufficient_evidence' || !evidence || evidence.length === 0) {
    output += `1. WHAT HAPPENED?\nI couldn't find enough historical evidence in ${repoName} to determine what specific change was made for this query.\n\n`;
    output += `2. WHAT PROBLEM WAS BEING SOLVED?\nNo recorded issue or pull request description in ${repoName} describes this problem.\n\n`;
    output += `3. WHY WAS IT CHANGED?\nI couldn't find enough historical evidence in this repository to determine why this change was made.\n\n`;
    output += `4. WHAT CHANGED?\nBehavioral change details are not documented in the repository graph.\n\n`;
    output += `5. EVIDENCE\nNo matching commit, PR, or issue record found in ${repoName}.\n\n`;
    output += `6. WHO MADE THE CHANGE?\nNot specified in repository records.\n\n`;
    output += `7. SOURCE\nN/A`;
    return output;
  }

  const topEvidence = evidence[0];
  const authors = [...new Set(evidence.map((e) => e.author).filter((a) => a && a !== 'Unknown'))];
  const sources = evidence.map((e) => e.url).filter((u) => u && u !== '#');

  output += `1. WHAT HAPPENED?\n${topEvidence.title}. ${topEvidence.reason}\n\n`;
  output += `2. WHAT PROBLEM WAS BEING SOLVED?\nAddressing functionality, updates, or issues in ${repoName}:\n`;
  evidence.slice(0, 3).forEach((item) => {
    output += `- ${item.reason}\n`;
  });
  output += `\n`;

  output += `3. WHY WAS IT CHANGED?\nAccording to ${repoName} repository records, this change was merged to implement:\n`;
  evidence.slice(0, 3).forEach((item) => {
    output += `- ${item.title}\n`;
  });
  output += `\n`;

  output += `4. WHAT CHANGED?\nUpdated behavior recorded in ${topEvidence.type.toUpperCase()}: ${topEvidence.title}.\n\n`;

  output += `5. EVIDENCE\n`;
  evidence.forEach((item) => {
    output += `- [${item.type.toUpperCase()}] ${item.title} (by @${item.author} on ${item.date})\n`;
  });
  output += `\n`;

  output += `6. WHO MADE THE CHANGE?\n`;
  if (authors.length > 0) {
    output += authors.map((a) => `@${a}`).join(', ') + '\n\n';
  } else {
    output += `Not specified in repository records.\n\n`;
  }

  output += `7. SOURCE\n`;
  if (sources.length > 0) {
    sources.forEach((src) => {
      output += `- ${src}\n`;
    });
  } else {
    output += `N/A`;
  }

  return output;
}
