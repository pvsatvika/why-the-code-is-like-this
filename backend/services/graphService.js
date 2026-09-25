import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.NEO4J_URI || 'neo4j+s://xxxxxx.databases.neo4j.io';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'your_neo4j_password';

let driver;

/**
 * Returns a singleton Neo4j driver instance.
 */
function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password)
    );
  }
  return driver;
}

/**
 * Verifies connection to the Neo4j database.
 * @returns {Promise<boolean>} True if connected, false otherwise.
 */
export async function verifyConnection() {
  try {
    const d = getDriver();
    const serverInfo = await d.getServerInfo();
    console.log(`[Neo4j Graph] Connected successfully to server: ${serverInfo.address}`);
    return true;
  } catch (err) {
    console.warn(`[Neo4j Graph] Connection verification failed: ${err.message}`);
    return false;
  }
}

/**
 * Wipes all nodes and relationships from the graph database.
 */
export async function clearDatabase() {
  const d = getDriver();
  const session = d.session();
  try {
    console.log('[Neo4j Graph] Clearing database (DETACH DELETE all nodes)...');
    await session.executeWrite((tx) => tx.run('MATCH (n) DETACH DELETE n'));
    console.log('[Neo4j Graph] Database wiped clean.');
  } catch (err) {
    console.error('[Neo4j Graph] Failed to clear database:', err.message);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Constructs a decision graph in Neo4j from ingested repository data.
 * Creates :Repository, :CodeEntity, :Commit, :PullRequest, and :Discussion nodes and their relationships.
 * 
 * @param {Object} repoData - Object containing { owner, repo, commits, pullRequests }
 */
export async function buildDecisionGraph(repoData) {
  const { owner, repo, commits = [], pullRequests = [] } = repoData;
  console.log(`[Neo4j Graph] Building decision graph for ${owner}/${repo}...`);

  await clearDatabase();

  const d = getDriver();
  const session = d.session();

  try {
    // 1. Create Repository Node
    console.log(`[Neo4j Graph] Creating Repository node: ${owner}/${repo}`);
    await session.executeWrite((tx) =>
      tx.run(
        `MERGE (r:Repository { name: $repo, owner: $owner })`,
        { repo, owner }
      )
    );

    // 2. Process Commits & CodeEntities
    console.log(`[Neo4j Graph] Processing ${commits.length} commits and code entities...`);
    for (const commit of commits) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (c:Commit { sha: $sha })
          SET c.message = $message,
              c.author = $author,
              c.date = $date,
              c.url = $url
          `,
          {
            sha: commit.sha,
            message: commit.message || '',
            author: commit.author?.name || 'Unknown',
            date: commit.author?.date || '',
            url: commit.html_url || '',
          }
        )
      );

      // Create CodeEntity nodes and connect to Repository & Commit
      for (const file of commit.files || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (r:Repository { name: $repo, owner: $owner })
            MATCH (c:Commit { sha: $sha })
            MERGE (e:CodeEntity { filename: $filename })
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

    // 3. Process PullRequests & Discussions
    console.log(`[Neo4j Graph] Processing ${pullRequests.length} pull requests and discussions...`);
    for (const pr of pullRequests) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (pr:PullRequest { number: $number })
          SET pr.title = $title,
              pr.body = $body,
              pr.user = $user,
              pr.merged_at = $merged_at,
              pr.url = $url
          `,
          {
            number: neo4j.int(pr.number),
            title: pr.title || '',
            body: pr.body || '',
            user: pr.user || 'Unknown',
            merged_at: pr.merged_at || '',
            url: pr.html_url || '',
          }
        )
      );

      // Link commits to PR if commit message references PR number (e.g. #123) or PR body references commit sha
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (pr:PullRequest { number: $number })
          MATCH (c:Commit)
          WHERE c.message CONTAINS ('#' + toString($number))
             OR toLower(pr.body) CONTAINS toLower(c.sha)
          MERGE (c)-[:BELONGS_TO]->(pr)
          `,
          { number: neo4j.int(pr.number) }
        )
      );

      // Create Discussion nodes for PR comments
      for (const comment of pr.comments || []) {
        await session.executeWrite((tx) =>
          tx.run(
            `
            MATCH (pr:PullRequest { number: $number })
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
              user: comment.user || 'Unknown',
              body: comment.body || '',
              type: comment.type || 'comment',
              date: comment.created_at || '',
            }
          )
        );
      }
    }

    console.log(`[Neo4j Graph] Decision graph successfully constructed for ${owner}/${repo}.`);
    return { success: true, owner, repo };
  } catch (err) {
    console.error(`[Neo4j Graph] Error building decision graph:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}

/**
 * Queries the Neo4j graph for a subgraph matching a given keyword or filename.
 * Returns connected CodeEntity, Commit, PullRequest, and Discussion nodes.
 * 
 * @param {string} keyword - Search query or filename
 * @returns {Promise<Array<Object>>} Structured subgraph evidence context
 */
export async function querySubgraph(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return [];
  }

  console.log(`[Neo4j Graph] Querying subgraph for keyword: "${keyword}"...`);
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

    const subgraph = result.records.map((record) => {
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

    console.log(`[Neo4j Graph] Subgraph query returned ${subgraph.length} matching nodes/pathways.`);
    return subgraph;
  } catch (err) {
    console.error(`[Neo4j Graph] Error querying subgraph:`, err.message);
    throw err;
  } finally {
    await session.close();
  }
}
