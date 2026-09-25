import { Octokit } from '@octokit/rest';

/**
 * Creates and returns an Octokit instance using GITHUB_TOKEN if available.
 */
function getOctokitClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === 'your_github_token') {
    console.warn('[GitHub Parser] Warning: GITHUB_TOKEN is not set or using default placeholder. Unauthenticated rate limits apply (60 req/hr).');
  }
  return new Octokit({
    auth: token && token !== 'your_github_token' ? token : undefined,
  });
}

/**
 * Fetches commits, modified files, closed PRs, and PR comments for a repository.
 * 
 * @param {string} owner - Repository owner (user/org)
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} Structured JSON with commits and pull requests
 */
export async function fetchRepoData(owner, repo) {
  if (!owner || !repo) {
    const error = new Error('Both owner and repo parameters are required');
    error.status = 400;
    throw error;
  }

  const octokit = getOctokitClient();

  try {
    // 1. Fetch the last 30 commits
    console.log(`[GitHub Parser] Fetching last 30 commits for ${owner}/${repo}...`);
    const { data: commitList, headers: commitHeaders } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 30,
    });

    console.log(`[GitHub Parser] Found ${commitList.length} commits. Rate limit remaining: ${commitHeaders['x-ratelimit-remaining'] || 'N/A'}`);

    // Fetch modified files for each commit in parallel batching / sequence
    const commits = [];
    for (let i = 0; i < commitList.length; i++) {
      const commit = commitList[i];
      console.log(`[GitHub Parser] [${i + 1}/${commitList.length}] Fetching commit details for ${commit.sha.substring(0, 7)}...`);
      
      const { data: commitDetail } = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: commit.sha,
      });

      const files = (commitDetail.files || []).map((f) => ({
        filename: f.filename,
        additions: f.additions,
        deletions: f.deletions,
      }));

      commits.push({
        sha: commit.sha,
        message: commit.commit?.message || '',
        author: {
          name: commit.commit?.author?.name || 'Unknown',
          date: commit.commit?.author?.date || null,
        },
        html_url: commit.html_url,
        files,
      });
    }

    // 2. Fetch the last 20 closed Pull Requests
    console.log(`[GitHub Parser] Fetching last 20 closed pull requests for ${owner}/${repo}...`);
    const { data: prList, headers: prHeaders } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'closed',
      per_page: 20,
    });

    console.log(`[GitHub Parser] Found ${prList.length} closed PRs. Rate limit remaining: ${prHeaders['x-ratelimit-remaining'] || 'N/A'}`);

    const pullRequests = [];
    for (let i = 0; i < prList.length; i++) {
      const pr = prList[i];
      console.log(`[GitHub Parser] [${i + 1}/${prList.length}] Fetching comments & discussions for PR #${pr.number}: "${pr.title}"...`);

      // Fetch issue comments (general PR discussion)
      const { data: issueComments } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: pr.number,
      });

      // Fetch review comments (code-level review comments)
      const { data: reviewComments } = await octokit.rest.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pr.number,
      });

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

      pullRequests.push({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        user: pr.user?.login || 'Unknown',
        merged_at: pr.merged_at || null,
        html_url: pr.html_url,
        comments,
      });
    }

    console.log(`[GitHub Parser] Successfully extracted repo data for ${owner}/${repo}. (${commits.length} commits, ${pullRequests.length} PRs)`);

    return {
      owner,
      repo,
      commits,
      pullRequests,
    };
  } catch (err) {
    console.error(`[GitHub Parser] Error processing ${owner}/${repo}:`, err.message);

    // Format GitHub API specific errors
    if (err.status === 404) {
      const error = new Error(`Repository '${owner}/${repo}' not found or is private.`);
      error.status = 404;
      throw error;
    } else if (err.status === 401) {
      const error = new Error('Unauthorized API token. Please check your GITHUB_TOKEN in .env');
      error.status = 401;
      throw error;
    } else if (err.status === 403) {
      const isRateLimit = err.response?.headers?.['x-ratelimit-remaining'] === '0' || err.message?.includes('rate limit');
      const errorMsg = isRateLimit
        ? 'GitHub API rate limit exceeded. Please provide a valid GITHUB_TOKEN in .env'
        : `Forbidden access to repository '${owner}/${repo}'.`;
      const error = new Error(errorMsg);
      error.status = 403;
      throw error;
    }

    // Pass along standard or custom status if already attached
    if (!err.status) {
      err.status = 500;
    }
    throw err;
  }
}
