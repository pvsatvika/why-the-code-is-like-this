import { Octokit } from '@octokit/rest';

/**
 * Initializes and returns an Octokit client instance.
 */
function getOctokitClient() {
  const token = process.env.GITHUB_TOKEN;
  const isDummy = !token || token === 'your_github_token';

  if (isDummy) {
    console.warn('[GitHub Service] Warning: GITHUB_TOKEN is missing or using default placeholder. Unauthenticated rate limits (60 req/hr) apply.');
  }

  return new Octokit({
    auth: !isDummy ? token : undefined,
  });
}

/**
 * Fetches repository history: metadata, commits, pull requests, review comments, and issues.
 * Bounded to 20 commits, 15 pull requests, and 15 issues for fast, reliable ingestion.
 * 
 * @param {string} owner - Repository owner (user or organization)
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Structured repository data
 */
export async function fetchRepoData(owner, repo) {
  if (!owner || !repo) {
    const error = new Error("Both 'owner' and 'repo' are required parameters.");
    error.status = 400;
    throw error;
  }

  const octokit = getOctokitClient();

  try {
    console.log(`[GitHub Service] Ingesting repository history for: ${owner}/${repo}...`);

    // Fetch repo metadata, commits, closed PRs, and issues in parallel
    const [repoRes, commitsRes, prsRes, issuesRes] = await Promise.allSettled([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listCommits({ owner, repo, per_page: 20 }),
      octokit.rest.pulls.list({ owner, repo, state: 'closed', per_page: 15 }),
      octokit.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 15 }),
    ]);

    // Check repository existence first
    if (repoRes.status === 'rejected') {
      const err = repoRes.reason;
      if (err.status === 404) {
        const error = new Error(`Repository '${owner}/${repo}' not found on GitHub or is private.`);
        error.status = 404;
        throw error;
      }
      if (err.status === 401) {
        const error = new Error('Unauthorized GITHUB_TOKEN configured.');
        error.status = 401;
        throw error;
      }
      if (err.status === 403) {
        const error = new Error('GitHub API rate limit exceeded or access forbidden.');
        error.status = 403;
        throw error;
      }
      throw err;
    }

    const repoMetadata = {
      owner,
      repo,
      description: repoRes.value.data.description || '',
      stars: repoRes.value.data.stargazers_count || 0,
      url: repoRes.value.data.html_url || `https://github.com/${owner}/${repo}`,
    };

    const commitList = commitsRes.status === 'fulfilled' ? commitsRes.value.data : [];
    const prList = prsRes.status === 'fulfilled' ? prsRes.value.data : [];
    const issueListRaw = issuesRes.status === 'fulfilled' ? issuesRes.value.data : [];

    // Filter out PRs from issue list (GitHub API returns PRs in listForRepo issues endpoint)
    const issueList = issueListRaw.filter((issue) => !issue.pull_request);

    // 1. Fetch File Diffs for Commits (in parallel)
    const commits = await Promise.all(
      commitList.map(async (commit) => {
        try {
          const { data: detail } = await octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          const files = (detail.files || []).map((f) => ({
            filename: f.filename,
            additions: f.additions || 0,
            deletions: f.deletions || 0,
          }));

          return {
            sha: commit.sha,
            message: commit.commit?.message || '',
            author: commit.author?.login || commit.commit?.author?.name || 'Unknown',
            date: commit.commit?.author?.date || null,
            url: commit.html_url,
            files,
          };
        } catch {
          return {
            sha: commit.sha,
            message: commit.commit?.message || '',
            author: commit.author?.login || commit.commit?.author?.name || 'Unknown',
            date: commit.commit?.author?.date || null,
            url: commit.html_url,
            files: [],
          };
        }
      })
    );

    // 2. Fetch Discussions & Comments for Pull Requests (in parallel)
    const pullRequests = await Promise.all(
      prList.map(async (pr) => {
        try {
          const [issueCommentsRes, reviewCommentsRes] = await Promise.allSettled([
            octokit.rest.issues.listComments({ owner, repo, issue_number: pr.number }),
            octokit.rest.pulls.listReviewComments({ owner, repo, pull_number: pr.number }),
          ]);

          const issueComments = issueCommentsRes.status === 'fulfilled' ? issueCommentsRes.value.data : [];
          const reviewComments = reviewCommentsRes.status === 'fulfilled' ? reviewCommentsRes.value.data : [];

          const comments = [
            ...issueComments.map((c) => ({
              id: `ic_${c.id}`,
              type: 'issue_comment',
              user: c.user?.login || 'Unknown',
              body: c.body || '',
              date: c.created_at,
            })),
            ...reviewComments.map((rc) => ({
              id: `rc_${rc.id}`,
              type: 'review_comment',
              user: rc.user?.login || 'Unknown',
              body: rc.body || '',
              path: rc.path || null,
              date: rc.created_at,
            })),
          ];

          return {
            number: pr.number,
            title: pr.title || '',
            body: pr.body || '',
            author: pr.user?.login || 'Unknown',
            merged_at: pr.merged_at || null,
            url: pr.html_url,
            comments,
          };
        } catch {
          return {
            number: pr.number,
            title: pr.title || '',
            body: pr.body || '',
            author: pr.user?.login || 'Unknown',
            merged_at: pr.merged_at || null,
            url: pr.html_url,
            comments: [],
          };
        }
      })
    );

    // 3. Format Issues
    const issues = issueList.map((issue) => ({
      number: issue.number,
      title: issue.title || '',
      body: issue.body || '',
      author: issue.user?.login || 'Unknown',
      state: issue.state || 'closed',
      created_at: issue.created_at,
      url: issue.html_url,
    }));

    console.log(`[GitHub Service] Extraction complete: ${commits.length} commits, ${pullRequests.length} PRs, ${issues.length} issues.`);

    return {
      metadata: repoMetadata,
      commits,
      pullRequests,
      issues,
    };
  } catch (err) {
    console.error(`[GitHub Service] Failed to ingest repository ${owner}/${repo}:`, err.message);
    if (!err.status) err.status = 500;
    throw err;
  }
}
