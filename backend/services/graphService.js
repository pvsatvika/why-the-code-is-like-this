import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

let driver;

/**
 * Returns singleton Neo4j driver instance.
 */
function getDriver() {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

/**
 * Verifies Neo4j database connection.
 * @returns {Promise<{ connected: boolean, error: string|null }>}
 */
export async function verifyConnection() {
  try {
    const d = getDriver();
    const serverInfo = await d.getServerInfo();
    console.log(`[Neo4j Service] Connected successfully to server: ${serverInfo.address}`);
    return { connected: true, error: null };
  } catch (err) {
    console.warn(`[Neo4j Service] Connection check failed: ${err.message}`);
    return { connected: false, error: err.message };
  }
}

/**
 * Stores repository history into Neo4j using MERGE statements for idempotency.
 * 
 * Nodes: Repository, Commit, PullRequest, Issue, Developer, File, Discussion
 * Relationships: HAS_COMMIT, HAS_PULL_REQUEST, HAS_ISSUE, MODIFIES, AUTHORED, CREATED, DISCUSSES, HAS_DISCUSSION, RELATED_TO
 * 
 * @param {Object} repoData - Output from githubService.fetchRepoData
 */
export async function buildDecisionGraph(repoData) {
  const { metadata, commits = [], pullRequests = [], issues = [] } = repoData;
  const { owner, repo, url: repoUrl } = metadata;
  const repoId = `${owner}/${repo}`;

  console.log(`[Neo4j Service] Writing decision graph for ${repoId}...`);

  const d = getDriver();
  const session = d.session();

  try {
    // 1. Create Repository Node
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

    // 2. Process Commits, Developers, and Files
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

      for (const file of files) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (c:Commit { sha: $sha })
            MERGE (f:File { filename: $filename })
            MERGE (c)-[:MODIFIES]->(f)
            `,
            { sha, filename: file.filename }
          )
        );
      }
    }

    // 3. Process Pull Requests, Developers, Discussions & File Links
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

      // Link commits to PR if message references PR number or PR body references commit sha
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (pr:PullRequest { id: $prId })
          MATCH (c:Commit)
          WHERE c.message CONTAINS ('#' + toString($number))
             OR toLower(pr.body) CONTAINS toLower(c.sha)
          MERGE (c)-[:RELATED_TO]->(pr)
          `,
          { prId, number: neo4j.int(pr.number) }
        )
      );

      // Add Discussion nodes
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
            `,
            {
              prId,
              commentId: comment.id,
              user: comment.user,
              body: comment.body,
              type: comment.type,
              date: comment.date || '',
            }
          )
        );

        if (comment.path) {
          await session.executeWrite((tx) =>
            tx.run(
              `
              MATCH (pr:PullRequest { id: $prId })
              MERGE (f:File { filename: $path })
              MERGE (pr)-[:DISCUSSES]->(f)
              `,
              { prId, path: comment.path }
            )
          );
        }
      }
    }

    // 4. Process Issues
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
          `,
          { issueId, number: neo4j.int(issue.number) }
        )
      );
    }

    console.log(`[Neo4j Service] Decision graph built successfully for ${repoId}.`);
    return { success: true, repository: repoId };
  } catch (err) {
    console.error(`[Neo4j Service] Graph build error:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Searches Neo4j for relevant commits, PRs, issues, and discussions matching keywords.
 * Returns formatted evidence list.
 * 
 * @param {string} question - Natural language question
 * @returns {Promise<Array<Object>>} List of evidence items
 */
export async function querySubgraph(question) {
  if (!question || typeof question !== 'string') {
    return [];
  }

  // Extract keywords (> 3 chars) from question
  const words = question
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['why', 'what', 'how', 'when', 'where', 'was', 'were', 'the', 'this', 'that', 'with', 'from'].includes(w));

  const keyword = words[0] || question.trim();
  console.log(`[Neo4j Service] Querying subgraph for keyword: "${keyword}"...`);

  const d = getDriver();
  const session = d.session();

  try {
    const cypher = `
      // 1. Commits matching keyword or modified file
      MATCH (c:Commit)
      WHERE toLower(c.message) CONTAINS toLower($keyword)
         OR EXISTS {
           MATCH (c)-[:MODIFIES]->(f:File)
           WHERE toLower(f.filename) CONTAINS toLower($keyword)
         }
      OPTIONAL MATCH (dev:Developer)-[:AUTHORED]->(c)
      RETURN 'commit' AS type,
             c.message AS title,
             dev.username AS author,
             c.date AS date,
             c.url AS url,
             ('Commit ' + substring(c.sha, 0, 7) + ': ' + c.message) AS reason
      LIMIT 10

      UNION

      // 2. Pull Requests matching keyword or connected files
      MATCH (pr:PullRequest)
      WHERE toLower(pr.title) CONTAINS toLower($keyword)
         OR toLower(pr.body) CONTAINS toLower($keyword)
         OR EXISTS {
           MATCH (pr)-[:DISCUSSES]->(f:File)
           WHERE toLower(f.filename) CONTAINS toLower($keyword)
         }
      OPTIONAL MATCH (dev:Developer)-[:AUTHORED]->(pr)
      RETURN 'pull_request' AS type,
             ('PR #' + toString(pr.number) + ': ' + pr.title) AS title,
             dev.username AS author,
             pr.merged_at AS date,
             pr.url AS url,
             ('Pull Request #' + toString(pr.number) + ': ' + pr.title + ' - ' + substring(pr.body, 0, 150)) AS reason
      LIMIT 10

      UNION

      // 3. Issues matching keyword
      MATCH (i:Issue)
      WHERE toLower(i.title) CONTAINS toLower($keyword)
         OR toLower(i.body) CONTAINS toLower($keyword)
      OPTIONAL MATCH (dev:Developer)-[:CREATED]->(i)
      RETURN 'issue' AS type,
             ('Issue #' + toString(i.number) + ': ' + i.title) AS title,
             dev.username AS author,
             i.state AS date,
             i.url AS url,
             ('Issue #' + toString(i.number) + ' (' + i.state + '): ' + i.title + ' - ' + substring(i.body, 0, 150)) AS reason
      LIMIT 10

      UNION

      // 4. Discussions matching keyword
      MATCH (d:Discussion)
      WHERE toLower(d.body) CONTAINS toLower($keyword)
      OPTIONAL MATCH (pr:PullRequest)-[:HAS_DISCUSSION]->(d)
      RETURN 'discussion' AS type,
             ('Discussion by @' + d.user) AS title,
             d.user AS author,
             d.date AS date,
             pr.url AS url,
             ('Review Comment by @' + d.user + ': ' + substring(d.body, 0, 200)) AS reason
      LIMIT 10
    `;

    const result = await session.executeRead((tx) => tx.run(cypher, { keyword }));

    const evidence = result.records.map((record) => ({
      type: record.get('type') || 'evidence',
      title: record.get('title') || 'Historical Context',
      author: record.get('author') || 'Unknown',
      date: record.get('date') || 'N/A',
      url: record.get('url') || '#',
      reason: record.get('reason') || '',
    }));

    console.log(`[Neo4j Service] Extracted ${evidence.length} evidence records.`);
    return evidence;
  } catch (err) {
    console.error(`[Neo4j Service] Subgraph query error:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}
