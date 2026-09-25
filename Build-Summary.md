# Hackathon Submission: Build Summary

- **Theme**: AI and Developer Tools
- **Project Name**: Why The Code Is Like This
- **Team Name**: TETRATECHS

---

## 🚀 Executive Summary

**Why The Code Is Like This** is an AI-powered developer intent and code forensics tool. It addresses a fundamental problem software developers face every day: understanding *why* legacy code was written or modified in a specific way. Standard git history (`git blame`) only shows *who* changed a line and *when*, but misses the critical architectural decisions, PR review debates, and developer intent behind those changes.

Our solution ingests GitHub repository commits, pull requests, and review discussions into a **Neo4j Graph Database**, constructs a connected **Decision Graph**, and utilizes **Sarvam AI (sarvam-2b)** via a **GraphRAG** pipeline to generate evidence-based explanations complete with explicit commit and PR citations.

---

## 🛠️ What Was Built

1. **GitHub Data Ingestion Pipeline (`backend/services/githubParser.js`)**:
   - Fetches commit histories, modified file lists (additions/deletions), closed Pull Requests, issue comments, and line-level code review discussions using Octokit REST API.
   - Implements error handling for rate limits, repository 404s, and token authorization.

2. **Neo4j Decision Graph Engine (`backend/services/graphService.js`)**:
   - Constructs a graph with `:Repository`, `:CodeEntity`, `:Commit`, `:PullRequest`, and `:Discussion` nodes.
   - Establishes relationships:
     - `(:Repository)-[:CONTAINS]->(:CodeEntity)`
     - `(:CodeEntity)-[:MODIFIED_IN]->(:Commit)`
     - `(:Commit)-[:BELONGS_TO]->(:PullRequest)`
     - `(:PullRequest)-[:DISCUSSES]->(:Discussion)`
   - Provides a parameterized Cypher search engine (`querySubgraph`) that traverses matching nodes to extract evidence chains.

3. **Sarvam AI GraphRAG Service (`backend/services/sarvamService.js` & `backend/routes/queryRoute.js`)**:
   - Integrates Sarvam AI (`sarvam-2b`) chat completion API with a custom Senior Software Architect persona prompt.
   - Enforces strict grounding on Neo4j graph context and requires structured Markdown answers with explicit citations.

4. **React + Vite Developer Dashboard (`frontend/src/App.jsx`)**:
   - Modern dark-mode UI with Tailwind CSS and Lucide React icons.
   - Real-time backend status check.
   - Repository ingestion trigger controls with progress feedback.
   - Interactive GraphRAG query search bar with pre-configured suggestion chips.
   - 2-Column Grid workspace: Left side renders Sarvam AI's markdown synthesis; Right side displays an interactive **Neo4j Graph Evidence Chain** panel (code entity badges, commit SHAs, PR numbers, and review quotes).

---

## ❌ Explicit Exclusions (Scope Boundaries)

To ensure a robust, production-grade MVP within hackathon time constraints, the following features were explicitly excluded from this build:
- **Real-Time GitHub Webhooks**: Automated push/PR webhook triggers (ingestion is on-demand via dashboard).
- **Multi-Repository Workspace Linking**: Cross-repo dependency graph queries (currently single repo per graph session).
- **Automated Code Refactoring**: Code writing or auto-fix execution (focused strictly on intent explanation & forensics).

---

## 🧰 Technology Stack & Rationale

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Lightning-fast HMR and seamless component composition. |
| **Styling & Icons** | Tailwind CSS + Lucide React | Clean, modern developer dashboard aesthetic with responsive dark-mode support. |
| **Backend API** | Node.js + Express | Async non-blocking I/O ideal for API integration and pipeline orchestrations. |
| **GitHub Integration**| `@octokit/rest` | Official GitHub REST API client for structured commit and PR extraction. |
| **Graph Database** | Neo4j AuraDB (Driver) | Industry-standard graph database enabling Cypher graph traversal for GraphRAG. |
| **LLM Provider** | Sarvam AI (`sarvam-2b`) | High-performance AI completions for natural language synthesis with evidence grounding. |

---

## 📊 Evidence vs. Assumptions (Testing Validation)

During prototype testing, we validated key hypotheses regarding developer intent retrieval:

- **Assumption 1**: Commit messages alone contain enough intent context.
  - **Result**: *Invalidated*. Over 60% of commit messages in sample repos were brief (e.g., `"fix bug"`, `"update index"`). 
  - **Pivot**: We expanded ingestion to include PR descriptions, issue comments, and review discussions, which contained the actual architectural debates.

- **Assumption 2**: Keyword search on filenames is sufficient for GraphRAG retrieval.
  - **Result**: *Validated & Enhanced*. Filename matching linked directly to modified commits, but joining commits to PRs via Cypher matching unlocked the full conversation history.

---

## 🔮 Next Flow / Roadmap

1. **IDE Extensions (VS Code & JetBrains)**:
   - Bring "Why The Code Is Like This" directly into the editor as a inline hover tool or sidebar panel (e.g., right-clicking a line of code to query why it was written).
2. **Commit-PR Semantic Embeddings**:
   - Add vector embeddings to Neo4j nodes to enable hybrid semantic search alongside Cypher graph traversal.
