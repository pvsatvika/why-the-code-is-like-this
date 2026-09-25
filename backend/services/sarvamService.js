import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Generates an architectural explanation for why the code is structured in a specific way,
 * using Sarvam AI's chat completion API and graph evidence retrieved from Neo4j.
 * 
 * @param {string} question - Developer's question
 * @param {Array<Object>} graphContext - Evidence context retrieved from Neo4j
 * @returns {Promise<string>} Markdown explanation with citations
 */
export async function generateAnswerWithEvidence(question, graphContext) {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey || apiKey === 'your_sarvam_api_key') {
    console.warn('[Sarvam Service] SARVAM_API_KEY is not configured or using default placeholder.');
  }

  const systemPrompt = `You are a Senior Software Architect specializing in code intent analysis and software forensics. 
Your task is to answer developer questions about "Why the code is like this" based strictly on the provided Graph Evidence (commits, pull requests, author names, dates, and review discussions).

Rules:
1. Base your explanation strictly on the provided Graph Evidence. Do not invent or assume decisions not supported by the evidence.
2. Structure your response using clean, professional Markdown.
3. Include explicit citations for every claim using format:
   - [Commit <SHA_SHORT>] by <Author> on <Date>: <Message>
   - [PR #<Number>] "<Title>" by <User> (Merged: <Date>)
   - [Discussion] <User>: "<Quote/Summary>"
4. Explain the *intent*, *trade-offs*, and *rationale* behind the code modifications if present in the discussions or commit messages.
5. If the provided evidence is insufficient to fully answer the question, state clearly what is known from the evidence and what remains unverified.`;

  const formattedContext = JSON.stringify(graphContext, null, 2);

  const userPrompt = `Developer Question: "${question}"

Graph Evidence Context (Retrieved from Neo4j):
\`\`\`json
${formattedContext}
\`\`\`

Provide a comprehensive, evidence-based architectural answer explaining why the code is structured or modified this way, complete with markdown citations.`;

  try {
    console.log('[Sarvam Service] Sending request to Sarvam AI chat completion API...');

    if (!apiKey || apiKey === 'your_sarvam_api_key') {
      return generateFallbackAnswer(question, graphContext);
    }

    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'sarvam-2b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (!answer) {
      throw new Error('Sarvam API returned an empty or unexpected response format.');
    }

    console.log('[Sarvam Service] Received answer successfully from Sarvam AI.');
    return answer;
  } catch (err) {
    console.error('[Sarvam Service] Error calling Sarvam AI API:', err.response?.data || err.message);

    return generateFallbackAnswer(question, graphContext, err.message);
  }
}

/**
 * Fallback evidence synthesizer when Sarvam API key is omitted or endpoint is offline.
 */
function generateFallbackAnswer(question, graphContext, errorDetail = null) {
  let output = `### 🔍 Code Decision Synthesis & Evidence Analysis\n\n`;
  if (errorDetail) {
    output += `> ⚠️ *Note: Sarvam AI API call could not be completed (${errorDetail}). Synthesizing GraphRAG evidence directly below:*\n\n`;
  } else {
    output += `> 💡 *Note: Operating in local GraphRAG synthesis mode (SARVAM_API_KEY placeholder detected).*\n\n`;
  }

  output += `**Question:** "${question}"\n\n`;

  if (!graphContext || graphContext.length === 0) {
    output += `No matching graph evidence was found in the database for the given keyword. Please ensure the repository has been ingested.\n`;
    return output;
  }

  output += `#### 📜 Graph Evidence Summary:\n\n`;

  graphContext.forEach((item, index) => {
    if (item.codeEntity) {
      output += `##### ${index + 1}. Code Entity: \`${item.codeEntity}\`\n`;
    }
    if (item.commit) {
      const shaShort = item.commit.sha ? item.commit.sha.substring(0, 7) : 'N/A';
      output += `- **Commit**: [\`${shaShort}\`] - *${item.commit.message}* (by **${item.commit.author}** on ${item.commit.date || 'N/A'})\n`;
    }
    if (item.pullRequest) {
      output += `- **Pull Request #${item.pullRequest.number}**: "${item.pullRequest.title}" (Merged: ${item.pullRequest.merged_at || 'N/A'})\n`;
      if (item.pullRequest.body) {
        output += `  > PR Body: ${item.pullRequest.body.substring(0, 150)}...\n`;
      }
    }
    if (item.discussions && item.discussions.length > 0) {
      output += `- **Review Discussions**:\n`;
      item.discussions.forEach((d) => {
        output += `  - **${d.user}** (${d.type}): "${d.body.substring(0, 150)}..."\n`;
      });
    }
    output += `\n`;
  });

  return output;
}
