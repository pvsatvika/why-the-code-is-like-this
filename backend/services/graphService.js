import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

export async function verifyConnection() {
  try {
    const d = getDriver();
    const serverInfo = await d.getServerInfo();
    console.log(`[Neo4j Service] Connected to server: ${serverInfo.address}`);
    return { connected: true, error: null };
  } catch (err) {
    console.warn(`[Neo4j Service] Connection check failed: ${err.message}`);
    return { connected: false, error: err.message };
  }
}

/**
 * Safely converts Neo4j Integers / BigInt / Objects into clean JS primitives.
 */
function safeValue(val, defaultVal = '') {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string' || typeof val === 'boolean') return val;
  if (typeof val === 'number') return val;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'object') {
    if (typeof val.toNumber === 'function') return val.toNumber();
    if (val.low !== undefined) return val.low;
    if (typeof val.toString === 'function') return val.toString();
  }
  return String(val);
}

/**
 * Extracts Decision text signals with provenance.
 */
function extractDecisionSignal(text, sourceType, sourceId, sourceUrl, author, date) {
  if (!text || typeof text !== 'string') return null;

  const decisionRegex = /\b(because|reason|chose|decided|instead|due to|workaround|breaking change|migration|deprecated|performance|compatibility|security|refactor|update|redesign|implement|support)\b/i;
  if (!decisionRegex.test(text)) return null;

  const cleanText = text.trim().substring(0, 300);
  const hash = Math.abs(cleanText.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  
  return {
    id: `dec_${sourceType}_${sourceId}_${hash}`,
    text: cleanText,
    sourceType,
    sourceId: String(sourceId),
    sourceUrl: sourceUrl || '#',
    author: author || 'Unknown',
    date: date || '',
    confidence: 'supported',
  };
}

/**
 * Extracts Incident text signals with provenance.
 */
function extractIncidentSignal(text, sourceType, sourceId, sourceUrl, author, date) {
  if (!text || typeof text !== 'string') return null;

  const incidentRegex = /\b(bug|fix|regression|crash|vulnerability|failure|panic|memory leak|outage|issue|error|prevent|solve)\b/i;
  if (!incidentRegex.test(text)) return null;

  const cleanText = text.trim().substring(0, 300);
  const hash = Math.abs(cleanText.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));

  return {
    id: `inc_${sourceType}_${sourceId}_${hash}`,
    text: cleanText,
    sourceType,
    sourceId: String(sourceId),
    sourceUrl: sourceUrl || '#',
    author: author || 'Unknown',
    date: date || '',
    confidence: 'supported',
  };
}

/**
 * Clears old graph nodes specifically for the target repository to enable clean re-ingestion.
 */
export async function clearRepositoryGraph(owner, repo) {
  const d = getDriver();
  const session = d.session();
  const repoId = `${owner}/${repo}`;
  try {
    console.log(`[Neo4j Service] Clearing previous graph data for ${repoId}...`);
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (r:Repository { id: $repoId })
        OPTIONAL MATCH (r)-[:HAS_COMMIT]->(c:Commit)
        OPTIONAL MATCH (r)-[:HAS_PULL_REQUEST]->(pr:PullRequest)
        OPTIONAL MATCH (r)-[:HAS_ISSUE]->(i:Issue)
        OPTIONAL MATCH (c)-[:SUPPORTS]->(dec1:Decision)
        OPTIONAL MATCH (pr)-[:IMPLEMENTS]->(dec2:Decision)
        OPTIONAL MATCH (i)-[:DESCRIBES]->(inc:Incident)
        OPTIONAL MATCH (pr)-[:HAS_DISCUSSION]->(d:Discussion)
        DETACH DELETE r, c, pr, i, dec1, dec2, inc, d
        `,
        { repoId }
      )
    );
  } catch (err) {
    console.warn(`[Neo4j Service] Repository clear warning:`, err.message);
  } finally {
    await session.close();
  }
}

/**
 * Builds Phase 3.5 Decision Graph in Neo4j with complete node & relationship connectivity.
 * Nodes: Repository, Commit, PullRequest, Issue, Developer, File, CodeEntity, Discussion, Decision, Incident
 */
export async function buildDecisionGraph(repoData) {
  const { metadata, commits = [], pullRequests = [], issues = [] } = repoData;
  const { owner, repo, url: repoUrl } = metadata;
  const repoId = `${owner}/${repo}`;

  console.log(`[Neo4j Service] Constructing connected Decision Graph for ${repoId}...`);

  // Clear target repository graph first for idempotent re-ingestion
  await clearRepositoryGraph(owner, repo);

  const d = getDriver();
  const session = d.session();

  try {
    // 1. Repository Node
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (r:Repository { id: $repoId })
        SET r.name = $repo,
            r.owner = $owner,
            r.url = $repoUrl
        `,
        { repoId, repo, owner, repoUrl }
      )
    );

    // 2. Commits, Developers, Files, Decisions, Incidents
    for (const commit of commits) {
      const { sha, message, author, date, url: commitUrl, files = [] } = commit;

      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (r:Repository { id: $repoId })
          MERGE (c:Commit { sha: $sha })
          SET c.message = $message,
              c.date = $date,
              c.url = $commitUrl
          MERGE (r)-[:HAS_COMMIT]->(c)

          MERGE (dev:Developer { username: $author })
          MERGE (dev)-[:AUTHORED]->(c)
          `,
          { repoId, sha, message, date: date || '', commitUrl: commitUrl || '', author }
        )
      );

      // Create Canonical File & CodeEntity Nodes
      for (const file of files) {
        const fileId = `${repoId}/${file.filename}`;
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (c:Commit { sha: $sha })
            MERGE (f:File { id: $fileId })
            SET f:CodeEntity,
                f.filename = $filename
            MERGE (c)-[:MODIFIES]->(f)
            `,
            { sha, fileId, filename: file.filename }
          )
        );
      }

      // Commit Decision Signal
      const decSignal = extractDecisionSignal(message, 'commit', sha, commitUrl, author, date);
      if (decSignal) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (c:Commit { sha: $sha })
            MERGE (dec:Decision { id: $id })
            SET dec.text = $text,
                dec.sourceType = $sourceType,
                dec.sourceId = $sourceId,
                dec.sourceUrl = $sourceUrl,
                dec.author = $author,
                dec.date = $date,
                dec.confidence = $confidence
            MERGE (c)-[:SUPPORTS]->(dec)
            MERGE (dec)-[:IMPLEMENTED_BY]->(c)
            `,
            { sha, ...decSignal }
          )
        );

        for (const file of files) {
          const fileId = `${repoId}/${file.filename}`;
          await session.executeWrite((tx) =>
            tx.run(
              `
              MATCH (dec:Decision { id: $id })
              MATCH (f:File { id: $fileId })
              MERGE (dec)-[:AFFECTS]->(f)
              `,
              { id: decSignal.id, fileId }
            )
          );
        }
      }

      // Commit Incident Signal
      const incSignal = extractIncidentSignal(message, 'commit', sha, commitUrl, author, date);
      if (incSignal) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (c:Commit { sha: $sha })
            MERGE (inc:Incident { id: $id })
            SET inc.text = $text,
                inc.sourceType = $sourceType,
                inc.sourceId = $sourceId,
                inc.sourceUrl = $sourceUrl,
                inc.author = $author,
                inc.date = $date,
                inc.confidence = $confidence
            MERGE (c)-[:ADDRESSES]->(inc)
            MERGE (inc)-[:ADDRESSED_BY]->(c)
            `,
            { sha, ...incSignal }
          )
        );
      }
    }

    // 3. Pull Requests, Developers, PR Commits, Discussions, Decisions
    for (const pr of pullRequests) {
      const prId = `${repoId}#${pr.number}`;

      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (r:Repository { id: $repoId })
          MERGE (pr:PullRequest { id: $prId })
          SET pr.number = $number,
              pr.title = $title,
              pr.body = $body,
              pr.merged_at = $mergedAt,
              pr.url = $prUrl
          MERGE (r)-[:HAS_PULL_REQUEST]->(pr)

          MERGE (dev:Developer { username: $author })
          MERGE (dev)-[:AUTHORED]->(pr)
          `,
          {
            repoId,
            prId,
            number: neo4j.int(pr.number),
            title: pr.title,
            body: pr.body,
            mergedAt: pr.merged_at || '',
            prUrl: pr.url || '',
            author: pr.author,
          }
        )
      );

      // Link PR-associated commits reliably: MERGE Commit node if it does not exist yet
      for (const prCommitSha of pr.pr_commits || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { id: $prId })
            MERGE (c:Commit { sha: $sha })
            MERGE (c)-[:RELATED_TO]->(pr)
            `,
            { prId, sha: prCommitSha }
          )
        );
      }

      // Check PR Title/Body for Decision Signals
      const prDecSignal = extractDecisionSignal(`${pr.title}\n${pr.body}`, 'pull_request', pr.number, pr.url, pr.author, pr.merged_at);
      if (prDecSignal) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { id: $prId })
            MERGE (dec:Decision { id: $id })
            SET dec.text = $text,
                dec.sourceType = $sourceType,
                dec.sourceId = $sourceId,
                dec.sourceUrl = $sourceUrl,
                dec.author = $author,
                dec.date = $date,
                dec.confidence = $confidence
            MERGE (pr)-[:IMPLEMENTS]->(dec)
            MERGE (dec)-[:MADE_IN]->(pr)
            `,
            { prId, ...prDecSignal }
          )
        );
      }

      // Check PR for Incident Signal
      const prIncSignal = extractIncidentSignal(`${pr.title}\n${pr.body}`, 'pull_request', pr.number, pr.url, pr.author, pr.merged_at);
      if (prIncSignal) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { id: $prId })
            MERGE (inc:Incident { id: $id })
            SET inc.text = $text,
                inc.sourceType = $sourceType,
                inc.sourceId = $sourceId,
                inc.sourceUrl = $sourceUrl,
                inc.author = $author,
                inc.date = $date,
                inc.confidence = $confidence
            MERGE (pr)-[:ADDRESSES]->(inc)
            MERGE (inc)-[:ADDRESSED_BY]->(pr)
            `,
            { prId, ...prIncSignal }
          )
        );
      }

      // Process Discussions (Comments & Code Review Comments)
      for (const comment of pr.comments || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { id: $prId })
            MERGE (d:Discussion { id: $commentId })
            SET d.user = $user,
                d.body = $body,
                d.type = $type,
                d.date = $date
            MERGE (pr)-[:HAS_DISCUSSION]->(d)

            MERGE (dev:Developer { username: $user })
            MERGE (dev)-[:PARTICIPATED_IN]->(d)
            MERGE (d)-[:INVOLVES]->(dev)
            `,
            {
              prId,
              commentId: String(comment.id),
              user: comment.user,
              body: comment.body,
              type: comment.type,
              date: comment.date || '',
            }
          )
        );

        if (comment.path) {
          const fileId = `${repoId}/${comment.path}`;
          await session.executeWrite((tx) =>
            tx.run(
              `
              MATCH (pr:PullRequest { id: $prId })
              MATCH (d:Discussion { id: $commentId })
              MERGE (f:File { id: $fileId })
              SET f:CodeEntity,
                  f.filename = $path
              MERGE (pr)-[:DISCUSSES]->(f)
              MERGE (d)-[:ABOUT]->(f)
              `,
              { prId, commentId: String(comment.id), fileId, path: comment.path }
            )
          );
        }

        // Discussion Decision Signal
        const discDecSignal = extractDecisionSignal(comment.body, 'discussion', comment.id, pr.url, comment.user, comment.date);
        if (discDecSignal) {
          await session.executeWrite((tx) =>
            tx.run(
              `
              MATCH (d:Discussion { id: $commentId })
              MERGE (dec:Decision { id: $id })
              SET dec.text = $text,
                  dec.sourceType = $sourceType,
                  dec.sourceId = $sourceId,
                  dec.sourceUrl = $sourceUrl,
                  dec.author = $author,
                  dec.date = $date,
                  dec.confidence = $confidence
              MERGE (d)-[:SUPPORTS]->(dec)
              MERGE (dec)-[:SUPPORTED_BY]->(d)
              `,
              { commentId: String(comment.id), ...discDecSignal }
            )
          );
        }
      }
    }

    // 4. Issues & Incidents
    for (const issue of issues) {
      const issueId = `${repoId}#${issue.number}`;

      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (r:Repository { id: $repoId })
          MERGE (i:Issue { id: $issueId })
          SET i.number = $number,
              i.title = $title,
              i.body = $body,
              i.state = $state,
              i.url = $issueUrl
          MERGE (r)-[:HAS_ISSUE]->(i)

          MERGE (dev:Developer { username: $author })
          MERGE (dev)-[:CREATED]->(i)
          `,
          {
            repoId,
            issueId,
            number: neo4j.int(issue.number),
            title: issue.title,
            body: issue.body,
            state: issue.state,
            issueUrl: issue.url || '',
            author: issue.author,
          }
        )
      );

      // Link Issue to PR if PR references issue number
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (i:Issue { id: $issueId })
          MATCH (pr:PullRequest)
          WHERE pr.body CONTAINS ('#' + toString($number))
             OR pr.title CONTAINS ('#' + toString($number))
          MERGE (i)-[:RELATED_TO]->(pr)
          MERGE (pr)-[:ADDRESSES]->(i)
          `,
          { issueId, number: neo4j.int(issue.number) }
        )
      );

      // Create Incident node if Issue describes bug/incident
      const issueIncSignal = extractIncidentSignal(`${issue.title}\n${issue.body}`, 'issue', issue.number, issue.url, issue.author, issue.created_at);
      if (issueIncSignal) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (i:Issue { id: $issueId })
            MERGE (inc:Incident { id: $id })
            SET inc.text = $text,
                inc.sourceType = $sourceType,
                inc.sourceId = $sourceId,
                inc.sourceUrl = $sourceUrl,
                inc.author = $author,
                inc.date = $date,
                inc.confidence = $confidence
            MERGE (i)-[:DESCRIBES]->(inc)
            `,
            { issueId, ...issueIncSignal }
          )
        );
      }
    }

    console.log(`[Neo4j Service] Decision Graph built successfully for ${repoId}.`);
    return { success: true, repository: repoId };
  } catch (err) {
    console.error(`[Neo4j Service] Decision graph build error:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Multi-hop GraphRAG Search Engine with Evidence Ranking & Relationship Traversal.
 * 
 * @param {string} question - Natural language developer question
 * @returns {Promise<{ evidence: Array<Object>, structuredContext: Object }>}
 */
export async function querySubgraph(question) {
  if (!question || typeof question !== 'string') {
    return { evidence: [], structuredContext: {} };
  }

  const words = question
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['why', 'what', 'how', 'when', 'where', 'was', 'were', 'the', 'this', 'that', 'with', 'from', 'does', 'have', 'been'].includes(w));

  const keyword = words[0] || question.trim();
  console.log(`[Neo4j Service] Multi-hop GraphRAG query for keyword: "${keyword}"...`);

  const d = getDriver();
  const session = d.session();

  try {
    const cypher = `
      // 1. Decisions matching keyword
      MATCH (dec:Decision)
      WHERE toLower(dec.text) CONTAINS toLower($keyword)
      OPTIONAL MATCH (dec)-[:MADE_IN]->(pr:PullRequest)
      OPTIONAL MATCH (dec)-[:IMPLEMENTED_BY]->(c:Commit)
      RETURN 'decision' AS type,
             dec.id AS id,
             ('Architectural Decision: ' + dec.text) AS title,
             dec.author AS author,
             dec.date AS date,
             coalesce(dec.sourceUrl, pr.url, c.url, '#') AS url,
             ('Decision (' + dec.sourceType + '): ' + dec.text) AS reason,
             1 AS rank

      UNION

      // 2. Incidents matching keyword
      MATCH (inc:Incident)
      WHERE toLower(inc.text) CONTAINS toLower($keyword)
      OPTIONAL MATCH (i:Issue)-[:DESCRIBES]->(inc)
      OPTIONAL MATCH (inc)-[:ADDRESSED_BY]->(c:Commit)
      RETURN 'incident' AS type,
             inc.id AS id,
             ('Incident / Problem: ' + inc.text) AS title,
             inc.author AS author,
             inc.date AS date,
             coalesce(inc.sourceUrl, i.url, c.url, '#') AS url,
             ('Incident (' + inc.sourceType + '): ' + inc.text) AS reason,
             2 AS rank

      UNION

      // 3. Pull Requests matching keyword or connected file
      MATCH (pr:PullRequest)
      WHERE toLower(pr.title) CONTAINS toLower($keyword)
         OR toLower(pr.body) CONTAINS toLower($keyword)
         OR EXISTS {
           MATCH (pr)-[:DISCUSSES]->(f:File)
           WHERE toLower(f.filename) CONTAINS toLower($keyword)
         }
      OPTIONAL MATCH (dev:Developer)-[:AUTHORED]->(pr)
      RETURN 'pull_request' AS type,
             pr.id AS id,
             ('PR #' + toString(pr.number) + ': ' + pr.title) AS title,
             dev.username AS author,
             pr.merged_at AS date,
             pr.url AS url,
             ('Pull Request #' + toString(pr.number) + ': ' + pr.title + ' - ' + substring(pr.body, 0, 180)) AS reason,
             3 AS rank

      UNION

      // 4. Issues matching keyword
      MATCH (i:Issue)
      WHERE toLower(i.title) CONTAINS toLower($keyword)
         OR toLower(i.body) CONTAINS toLower($keyword)
      OPTIONAL MATCH (dev:Developer)-[:CREATED]->(i)
      RETURN 'issue' AS type,
             i.id AS id,
             ('Issue #' + toString(i.number) + ': ' + i.title) AS title,
             dev.username AS author,
             i.state AS date,
             i.url AS url,
             ('Issue #' + toString(i.number) + ' (' + i.state + '): ' + i.title + ' - ' + substring(i.body, 0, 180)) AS reason,
             4 AS rank

      UNION

      // 5. Commits matching keyword or modified file
      MATCH (c:Commit)
      WHERE toLower(c.message) CONTAINS toLower($keyword)
         OR EXISTS {
           MATCH (c)-[:MODIFIES]->(f:File)
           WHERE toLower(f.filename) CONTAINS toLower($keyword)
         }
      OPTIONAL MATCH (dev:Developer)-[:AUTHORED]->(c)
      RETURN 'commit' AS type,
             c.sha AS id,
             ('Commit ' + substring(c.sha, 0, 7) + ': ' + c.message) AS title,
             dev.username AS author,
             c.date AS date,
             c.url AS url,
             ('Commit ' + substring(c.sha, 0, 7) + ': ' + c.message) AS reason,
             5 AS rank

      UNION

      // 6. Discussions matching keyword
      MATCH (d:Discussion)
      WHERE toLower(d.body) CONTAINS toLower($keyword)
      OPTIONAL MATCH (pr:PullRequest)-[:HAS_DISCUSSION]->(d)
      RETURN 'discussion' AS type,
             d.id AS id,
             ('Discussion by @' + d.user) AS title,
             d.user AS author,
             d.date AS date,
             coalesce(pr.url, '#') AS url,
             ('Review Comment by @' + d.user + ': ' + substring(d.body, 0, 200)) AS reason,
             6 AS rank
    `;

    const result = await session.executeRead((tx) => tx.run(cypher, { keyword }));

    const rawEvidence = result.records.map((record) => ({
      type: safeValue(record.get('type'), 'evidence'),
      id: safeValue(record.get('id'), 'N/A'),
      title: safeValue(record.get('title'), 'Historical Evidence'),
      author: safeValue(record.get('author'), 'Unknown'),
      date: safeValue(record.get('date'), 'N/A'),
      url: safeValue(record.get('url'), '#'),
      reason: safeValue(record.get('reason'), ''),
      rank: Number(safeValue(record.get('rank'), 99)) || 99,
    }));

    // Sort evidence by rank priority
    const evidence = rawEvidence.sort((a, b) => a.rank - b.rank);

    // Group into structured context object
    const structuredContext = {
      question,
      keyword,
      decisions: evidence.filter((e) => e.type === 'decision'),
      incidents: evidence.filter((e) => e.type === 'incident'),
      pullRequests: evidence.filter((e) => e.type === 'pull_request'),
      issues: evidence.filter((e) => e.type === 'issue'),
      commits: evidence.filter((e) => e.type === 'commit'),
      discussions: evidence.filter((e) => e.type === 'discussion'),
    };

    console.log(`[Neo4j Service] Multi-hop search returned ${evidence.length} evidence records.`);
    return { evidence, structuredContext };
  } catch (err) {
    console.error(`[Neo4j Service] GraphRAG query error:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}
