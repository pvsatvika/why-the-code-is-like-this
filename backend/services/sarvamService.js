import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

/**
 * Sanitizes and truncates graph evidence context to prevent empty string payloads,
 * invalid types, or token context overflows.
 * 
 * @param {Array<Object>} graphContext 
 * @returns {string} Cleaned, bounded context string
 */
function sanitizeGraphContext(graphContext) {
  if (!graphContext || !Array.isArray(graphContext) || graphContext.length === 0) {
    return 'No matching Neo4j decision graph evidence found for this query.';
  }

  const cleanItems = graphContext.map((item, index) => {
    let summary = `[Evidence #${index + 1}]\n`;
    if (item.codeEntity) summary += `Code File: ${item.codeEntity}\n`;
    if (item.commit) {
      summary += `Commit: ${item.commit.sha ? item.commit.sha.substring(0, 7) : 'N/A'} by ${item.commit.author || 'Unknown'}\n`;
      summary += `Commit Message: ${item.commit.message || ''}\n`;
    }
    if (item.pullRequest) {
      summary += `Pull Request #${item.pullRequest.number}: "${item.pullRequest.title || ''}"\n`;
      if (item.pullRequest.body) {
        summary += `PR Rationale: ${(item.pullRequest.body || '').substring(0, 200)}...\n`;
      }
    }
    if (item.discussions && item.discussions.length > 0) {
      summary += `Review Comments:\n`;
      item.discussions.forEach((d) => {
        summary += `  - @${d.user || 'user'}: "${(d.body || '').substring(0, 150)}"\n`;
      });
    }
    return summary;
  });

  const fullText = cleanItems.join('\n---\n');

  // Truncate to maximum 3500 characters to prevent token payload validation errors
  if (fullText.length > 3500) {
    return fullText.substring(0, 3500) + '\n...[Evidence Context Truncated]';
  }
  return fullText;
}

/**
 * Generates an architectural explanation using Sarvam AI chat completions.
 * 
 * @param {string} question - Developer question
 * @param {Array<Object>} graphContext - Evidence context from Neo4j
 * @returns {Promise<string>} Markdown explanation with citations
 */
export async function generateAnswerWithEvidence(question, graphContext) {
  const apiKey = process.env.SARVAM_API_KEY;

  const sanitizedContext = sanitizeGraphContext(graphContext);
  const cleanQuestion = (question || '').trim() || 'Why was this code modified?';

  const systemPrompt = `You are a Senior Software Architect specializing in developer intent analysis and code forensics.
Answer the developer's question about "Why the code is like this" based strictly on the provided Graph Evidence (commits, PRs, author names, dates, discussions).

Rules:
1. Base your answer strictly on the provided Graph Evidence.
2. Format output using clean Markdown with headings and bullet points.
3. Cite specific commits [Commit SHA], PR numbers [PR #Num], and discussion quotes.
4. Explain developer intent, rationale, and trade-offs clearly.`;

  const userPrompt = `Developer Question: "${cleanQuestion}"

Graph Evidence Context:
${sanitizedContext}

Provide a clear, evidence-backed architectural answer with markdown citations.`;

  // Check API key configuration
  if (!apiKey || apiKey === 'your_sarvam_api_key') {
    console.warn('[Sarvam Service] SARVAM_API_KEY is not configured or using default placeholder. Returning local GraphRAG synthesis.');
    return generateFallbackAnswer(cleanQuestion, graphContext);
  }

  try {
    console.log('[Sarvam Service] Sending sanitized payload to Sarvam AI completions API...');

    const payload = {
      model: 'sarvam-2b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    };

    const response = await axios.post(
      SARVAM_API_URL,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 25000,
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;
    if (!answer || typeof answer !== 'string') {
      throw new Error('Sarvam API returned unexpected or empty choices payload.');
    }

    console.log('[Sarvam Service] Sarvam AI response received successfully.');
    return answer;
  } catch (err) {
    console.error('[Sarvam Service] ❌ Sarvam AI API Error:');
    if (err.response) {
      console.error(`Status Code: ${err.response.status}`);
      console.error(`Response Data:`, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(`Error Message: ${err.message}`);
    }

    return generateFallbackAnswer(cleanQuestion, graphContext, err.response?.data?.message || err.message);
  }
}

/**
 * Synthesizes graph evidence directly if Sarvam API call returns error or key is unconfigured.
 */
function generateFallbackAnswer(question, graphContext, errorDetail = null) {
  let output = `### 🔍 Code Decision Synthesis & Evidence Analysis\n\n`;
  if (errorDetail) {
    output += `> ⚠️ *Note: Sarvam AI API request notice (${errorDetail}). Synthesizing GraphRAG evidence directly below:*\n\n`;
  } else {
    output += `> 💡 *Note: Operating in local GraphRAG synthesis mode.*\n\n`;
  }

  output += `**Question:** "${question}"\n\n`;

  if (!graphContext || graphContext.length === 0) {
    output += `No matching decision graph evidence was found for this query in Neo4j.\n`;
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
