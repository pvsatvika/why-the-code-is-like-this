import { Octokit } from '@octokit/rest';

/**
 * Creates and returns an Octokit instance using GITHUB_TOKEN if available.
 */
function getOctokitClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your_github_token') {
    console.warn('[GitHub Service] Warning: GITHUB_TOKEN is not configured or using default placeholder. Unauthenticated rate limits apply (60 req/hr).');
  }
  return new Octokit({
    auth: token && token !== 'your_github_token' ? token : undefined,
  });
}

/**
 * Fetches commits, modified files, closed PRs, and PR discussions for any target GitHub repository.
 * Optimized with parallel fetching (Promise.all) and capped at 15 commits / 10 PRs for sub-10s performance.
 * 
 * @param {string} owner - Repository owner/org
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Structured repo data
 */
export async function fetchRepoData(owner, repo) {
  if (!owner || !repo) {
    const error = new Error('Both owner and repo parameters are required');
    error.status = 400;
    throw error;
  }

  const octokit = getOctokitClient();

  try {
    console.log(`[GitHub Service] Fast-Ingesting repo: ${owner}/${repo}...`);

    // Fetch top 15 commits and top 10 closed PRs in parallel
    const [commitsPromise, prsPromise] = await Promise.allSettled([
      octokit.rest.repos.listCommits({ owner, repo, per_page: 15 }),
      octokit.rest.pulls.list({ owner, repo, state: 'closed', per_page: 10 }),
    ]);

    const commitList = commitsPromise.status === 'fulfilled' ? commitsPromise.value.data : [];
    const prList = prsPromise.status === 'fulfilled' ? prsPromise.value.data : [];

    if (commitsPromise.status === 'rejected') {
      console.warn(`[GitHub Service] Warning fetching commits for ${owner}/${repo}:`, commitsPromise.reason?.message);
    }
    if (prsPromise.status === 'rejected') {
      console.warn(`[GitHub Service] Warning fetching PRs for ${owner}/${repo}:`, prsPromise.reason?.message);
    }

    console.log(`[GitHub Service] Fetched ${commitList.length} commits & ${prList.length} closed PRs. Fetching details in parallel...`);

    // 1. Parallel Fetch for Commit File Diffs
    const commitDetailsPromises = commitList.map(async (commit) => {
      try {
        const { data: detail } = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });

        const files = (detail.files || []).map((f) => ({
          filename: f.filename,
          additions: f.additions,
          deletions: f.deletions,
        }));

        return {
          sha: commit.sha,
          message: commit.commit?.message || '',
          author: {
            name: commit.commit?.author?.name || 'Unknown',
            date: commit.commit?.author?.date || null,
          },
          html_url: commit.html_url,
          files,
        };
      } catch (err) {
        return {
          sha: commit.sha,
          message: commit.commit?.message || '',
          author: { name: commit.commit?.author?.name || 'Unknown', date: null },
          html_url: commit.html_url,
          files: [],
        };
      }
    });

    // 2. Parallel Fetch for PR Issue & Review Comments
    const prDetailsPromises = prList.map(async (pr) => {
      try {
        const [issueCommentsRes, reviewCommentsRes] = await Promise.allSettled([
          octokit.rest.issues.listComments({ owner, repo, issue_number: pr.number }),
          octokit.rest.pulls.listReviewComments({ owner, repo, pull_number: pr.number }),
        ]);

        const issueComments = issueCommentsRes.status === 'fulfilled' ? issueCommentsRes.value.data : [];
        const reviewComments = reviewCommentsRes.status === 'fulfilled' ? reviewCommentsRes.value.data : [];

        const comments = [
          ...issueComments.map((c) => ({
            type: 'issue_comment',
            user: c.user?.login || 'Unknown',
            body: c.body || '',
            created_at: c.created_at,
          })),
          ...reviewComments.map((rc) => ({
            type: 'review_comment',
            user: rc.user?.login || 'Unknown',
            body: rc.body || '',
            path: rc.path || null,
            created_at: rc.created_at,
          })),
        ];

        return {
          number: pr.number,
          title: pr.title,
          body: pr.body || '',
          user: pr.user?.login || 'Unknown',
          merged_at: pr.merged_at || null,
          html_url: pr.html_url,
          comments,
        };
      } catch (err) {
        return {
          number: pr.number,
          title: pr.title,
          body: pr.body || '',
          user: pr.user?.login || 'Unknown',
          merged_at: pr.merged_at || null,
          html_url: pr.html_url,
          comments: [],
        };
      }
    });

    const [commits, pullRequests] = await Promise.all([
      Promise.all(commitDetailsPromises),
      Promise.all(prDetailsPromises),
    ]);

    console.log(`[GitHub Service] Ingestion complete for ${owner}/${repo}: ${commits.length} commits, ${pullRequests.length} PRs.`);

    return {
      owner,
      repo,
      commits,
      pullRequests,
    };
  } catch (err) {
    console.error(`[GitHub Service] Ingestion failed for ${owner}/${repo}:`, err.message);

    if (err.status === 404) {
      const error = new Error(`Repository '${owner}/${repo}' not found or is private.`);
      error.status = 404;
      throw error;
    } else if (err.status === 401) {
      const error = new Error('Unauthorized GitHub API token.');
      error.status = 401;
      throw error;
    } else if (err.status === 403) {
      const error = new Error('GitHub API rate limit exceeded or forbidden access.');
      error.status = 403;
      throw error;
    }

    if (!err.status) err.status = 500;
    throw err;
  }
}
