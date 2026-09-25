import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Generates an evidence-backed architectural answer using Sarvam AI (sarvam-2b).
 * Instructs the model to strictly base its explanation ONLY on the supplied Neo4j evidence.
 * 
 * @param {string} question - Natural language developer question
 * @param {Array<Object>} evidence - Evidence list from graphService.querySubgraph
 * @returns {Promise<string>} Answer text
 */
export async function generateAnswerWithEvidence(question, evidence) {
  const apiKey = process.env.SARVAM_API_KEY;
  const isConfigured = apiKey && apiKey !== 'your_sarvam_api_key';

  const cleanQuestion = (question || '').trim();

  // Format evidence list for prompt context
  let evidenceContext = '';
  if (!evidence || evidence.length === 0) {
    evidenceContext = 'No matching historical evidence (commits, PRs, issues, or review discussions) was found in the graph database for this query.';
  } else {
    evidenceContext = evidence
      .map((item, idx) => `[Evidence #${idx + 1} - ${item.type.toUpperCase()}]\nTitle/Reason: ${item.reason}\nAuthor: ${item.author} | Date: ${item.date} | URL: ${item.url}`)
      .join('\n\n');
  }

  const systemPrompt = `You are a Senior Software Architecture and Code Archaeology expert.
Your job is to answer the developer's question about "Why the code is like this" strictly based on the provided Repository Evidence.

Rules:
1. Base your explanation ONLY on the supplied Repository Evidence.
2. Never invent, assume, or pretend unsupported facts are known.
3. If the evidence is insufficient or missing, clearly state what is known from the evidence and what remains unknown.
4. Format your answer with clean Markdown and include explicit citations to commit SHAs, PR numbers, and author names.`;

  const userPrompt = `Developer Question: "${cleanQuestion}"

Repository Evidence Collected:
${evidenceContext}

Explain the likely rationale, intent, or decision behind this code structure based strictly on the evidence above.`;

  if (!isConfigured) {
    console.warn('[Sarvam Service] SARVAM_API_KEY is missing or default placeholder. Using direct evidence synthesis.');
    return generateFallbackAnswer(cleanQuestion, evidence);
  }

  try {
    console.log('[Sarvam Service] Querying Sarvam AI completions API (sarvam-2b)...');

    const payload = {
      model: 'sarvam-2b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
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
    return answer;
  } catch (err) {
    console.error('[Sarvam Service] Sarvam API Error Response:', JSON.stringify(err.response?.data || err.message));
    return generateFallbackAnswer(cleanQuestion, evidence, err.response?.data?.message || err.message);
  }
}

/**
 * Fallback evidence synthesizer if Sarvam API key is unconfigured or request fails.
 */
function generateFallbackAnswer(question, evidence, errorNotice = null) {
  let output = `### 🔍 Code Archaeology & Rationale Analysis\n\n`;

  if (errorNotice) {
    output += `> ⚠️ *Note: Sarvam AI API request returned a notice (${errorNotice}). Synthesizing Graph Evidence directly below:*\n\n`;
  } else {
    output += `> 💡 *Note: Operating in direct evidence synthesis mode (SARVAM_API_KEY placeholder detected).*\n\n`;
  }

  output += `**Question:** "${question}"\n\n`;

  if (!evidence || evidence.length === 0) {
    output += `No relevant repository evidence (commits, PRs, issues, or review comments) was found in the graph database matching this question. Please ensure the repository has been ingested.\n`;
    return output;
  }

  output += `#### 📜 Retrieved Historical Evidence:\n\n`;

  evidence.forEach((item, idx) => {
    output += `##### ${idx + 1}. [${item.type.toUpperCase()}] ${item.title}\n`;
    output += `- **Author**: @${item.author}\n`;
    output += `- **Date/State**: ${item.date}\n`;
    output += `- **Evidence Details**: ${item.reason}\n`;
    if (item.url && item.url !== '#') {
      output += `- **Link**: [View on GitHub](${item.url})\n`;
    }
    output += `\n`;
  });

  return output;
}
