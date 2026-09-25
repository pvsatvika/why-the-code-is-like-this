import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'neo4j+s://xxxxxx.databases.neo4j.io';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'your_neo4j_password';

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
    console.log(`[Neo4j Graph] Connected to server: ${serverInfo.address}`);
    return true;
  } catch (err) {
    console.warn(`[Neo4j Graph] Connection warning: ${err.message}`);
    return false;
  }
}

/**
 * Wipes graph data for a specific repository or clears the database.
 * @param {string} [owner]
 * @param {string} [repo]
 */
export async function clearDatabase(owner, repo) {
  const d = getDriver();
  const session = d.session();
  try {
    if (owner && repo) {
      console.log(`[Neo4j Graph] Clearing existing graph nodes for repo: ${owner}/${repo}...`);
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (r:Repository { name: $repo, owner: $owner })
          OPTIONAL MATCH (r)-[:CONTAINS]->(e:CodeEntity)
          OPTIONAL MATCH (e)-[:MODIFIED_IN]->(c:Commit)
          OPTIONAL MATCH (c)-[:BELONGS_TO]->(pr:PullRequest)
          OPTIONAL MATCH (pr)-[:DISCUSSES]->(d:Discussion)
          DETACH DELETE r, e, c, pr, d
          `,
          { owner, repo }
        )
      );
    } else {
      console.log('[Neo4j Graph] Wiping all nodes and relationships...');
      await session.executeWrite((tx) => tx.run('MATCH (n) DETACH DELETE n'));
    }
  } catch (err) {
    console.warn(`[Neo4j Graph] Clear database warning:`, err.message);
  } finally {
    await session.close();
  }
}

/**
 * Constructs a decision graph for a specific repository in Neo4j.
 * 
 * @param {Object} repoData - Object containing { owner, repo, commits, pullRequests }
 */
export async function buildDecisionGraph(repoData) {
  const { owner, repo, commits = [], pullRequests = [] } = repoData;
  console.log(`[Neo4j Graph] Building multi-repo decision graph for ${owner}/${repo}...`);

  await clearDatabase(owner, repo);

  const d = getDriver();
  const session = d.session();

  try {
    // 1. Repository Node
    await session.executeWrite((tx) =>
      tx.run(`MERGE (r:Repository { name: $repo, owner: $owner })`, { repo, owner })
    );

    // 2. Process Commits & Code Entities
    for (const commit of commits) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (c:Commit { sha: $sha, owner: $owner, repo: $repo })
          SET c.message = $message,
              c.author = $author,
              c.date = $date,
              c.url = $url
          `,
          {
            sha: commit.sha,
            owner,
            repo,
            message: commit.message || '',
            author: commit.author?.name || 'Unknown',
            date: commit.author?.date || '',
            url: commit.html_url || '',
          }
        )
      );

      for (const file of commit.files || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (r:Repository { name: $repo, owner: $owner })
            MATCH (c:Commit { sha: $sha, owner: $owner, repo: $repo })
            MERGE (e:CodeEntity { filename: $filename, owner: $owner, repo: $repo })
            MERGE (r)-[:CONTAINS]->(e)
            MERGE (e)-[:MODIFIED_IN]->(c)
            `,
            {
              repo,
              owner,
              sha: commit.sha,
              filename: file.filename,
            }
          )
        );
      }
    }

    // 3. Process Pull Requests & Discussions
    for (const pr of pullRequests) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (pr:PullRequest { number: $number, owner: $owner, repo: $repo })
          SET pr.title = $title,
              pr.body = $body,
              pr.user = $user,
              pr.merged_at = $merged_at,
              pr.url = $url
          `,
          {
            number: neo4j.int(pr.number),
            owner,
            repo,
            title: pr.title || '',
            body: pr.body || '',
            user: pr.user || 'Unknown',
            merged_at: pr.merged_at || '',
            url: pr.html_url || '',
          }
        )
      );

      // Link Commits to PR if PR references commit or commit references PR number
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (pr:PullRequest { number: $number, owner: $owner, repo: $repo })
          MATCH (c:Commit { owner: $owner, repo: $repo })
          WHERE c.message CONTAINS ('#' + toString($number))
             OR toLower(pr.body) CONTAINS toLower(c.sha)
          MERGE (c)-[:BELONGS_TO]->(pr)
          `,
          { number: neo4j.int(pr.number), owner, repo }
        )
      );

      // Create Discussions
      for (const comment of pr.comments || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { number: $number, owner: $owner, repo: $repo })
            CREATE (d:Discussion {
              user: $user,
              body: $body,
              type: $type,
              date: $date
            })
            CREATE (pr)-[:DISCUSSES]->(d)
            `,
            {
              number: neo4j.int(pr.number),
              owner,
              repo,
              user: comment.user || 'Unknown',
              body: comment.body || '',
              type: comment.type || 'comment',
              date: comment.created_at || '',
            }
          )
        );
      }
    }

    console.log(`[Neo4j Graph] Multi-repo graph updated for ${owner}/${repo}.`);
    return { success: true, owner, repo };
  } catch (err) {
    console.error(`[Neo4j Graph] Error building graph for ${owner}/${repo}:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Queries Neo4j for a matching subgraph context.
 * 
 * @param {string} keyword - Search term or file name
 * @returns {Promise<Array<Object>>} Subgraph evidence
 */
export async function querySubgraph(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return [];
  }

  const d = getDriver();
  const session = d.session();

  try {
    const cypher = `
      MATCH (e:CodeEntity) WHERE toLower(e.filename) CONTAINS toLower($keyword)
      OPTIONAL MATCH (e)-[:MODIFIED_IN]->(c:Commit)
      OPTIONAL MATCH (c)-[:BELONGS_TO]->(pr:PullRequest)
      OPTIONAL MATCH (pr)-[:DISCUSSES]->(d:Discussion)
      RETURN e.filename AS codeEntity,
             c.sha AS commitSha,
             c.message AS commitMessage,
             c.author AS commitAuthor,
             c.date AS commitDate,
             pr.number AS prNumber,
             pr.title AS prTitle,
             pr.body AS prBody,
             collect(DISTINCT { user: d.user, body: d.body, type: d.type, date: d.date }) AS discussions

      UNION

      MATCH (c:Commit) WHERE toLower(c.message) CONTAINS toLower($keyword)
      OPTIONAL MATCH (e:CodeEntity)-[:MODIFIED_IN]->(c)
      OPTIONAL MATCH (c)-[:BELONGS_TO]->(pr:PullRequest)
      OPTIONAL MATCH (pr)-[:DISCUSSES]->(d:Discussion)
      RETURN e.filename AS codeEntity,
             c.sha AS commitSha,
             c.message AS commitMessage,
             c.author AS commitAuthor,
             c.date AS commitDate,
             pr.number AS prNumber,
             pr.title AS prTitle,
             pr.body AS prBody,
             collect(DISTINCT { user: d.user, body: d.body, type: d.type, date: d.date }) AS discussions
      LIMIT 50
    `;

    const result = await session.executeRead((tx) =>
      tx.run(cypher, { keyword: keyword.trim() })
    );

    return result.records.map((record) => {
      const prNumber = record.get('prNumber');
      return {
        codeEntity: record.get('codeEntity'),
        commit: record.get('commitSha') ? {
          sha: record.get('commitSha'),
          message: record.get('commitMessage'),
          author: record.get('commitAuthor'),
          date: record.get('commitDate'),
        } : null,
        pullRequest: prNumber ? {
          number: typeof prNumber === 'object' && prNumber.toNumber ? prNumber.toNumber() : prNumber,
          title: record.get('prTitle'),
          body: record.get('prBody'),
        } : null,
        discussions: (record.get('discussions') || []).filter((d) => d && d.user),
      };
    });
  } catch (err) {
    console.error(`[Neo4j Graph] Error querying subgraph:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}
