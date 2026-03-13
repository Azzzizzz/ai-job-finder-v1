# 🤖 AI Job Finder

A high-performance, AI-driven job aggregation and personalization engine. This system hunts for software engineering roles across 160+ sources, matches them against your professional profile using semantic embeddings, and delivers a ranked daily digest of the best opportunities.

## 🚀 Key Features

- **Global Discovery**: Integrated with EverJobs CLI to scrape 160+ job boards including LinkedIn, Indeed, Glassdoor, and niche startup boards.
- **Personalized Logic**: Dual-file ingestion (Resume + Requirements) to build a deep understanding of your professional background and goals.
- **Semantic Matching**: Uses OpenAI's `text-embedding-3-large` to calculate cosine similarity between your profile and job descriptions.
- **Smart Filtering**:
    - **Freshness**: Automatic 7-day window filter.
    - **Experience Guard**: Regex-based extraction to enforce year-of-experience requirements.
    - **Domain Blacklist**: Automatically blocks irrelevant roles (DevOps, QA, Security, etc.) for pure Backend/Frontend developers.
- **Laser Focus**: Target specific **dream companies**, **preferred job boards**, and **exact job titles** via environment configuration.
- **AI Reasoning**: Uses `gpt-4o` to generate "Why this job matches you" explanations for top-ranked roles.
- **Automated Pipeline**: A single command to run the entire Fetch → Process → Score → Email cycle.

---

## 🛠 Architecture Flow

The system operates in four distinct phases:

1.  **Aggregation**: Fetches broad results based on `TARGET_TITLES` and `TARGET_SOURCES`.
2.  **Filtering**: Applies strict `TARGET_COMPANIES` matching and relevance guards in the `Aggregator`.
3.  **Intelligence**: Generates embeddings and calculates semantic similarity scores.
4.  **Delivery**: Ranks the top matches, generates AI explanations, and sends a daily email digest via **Resend**.

[View Detailed Architecture Diagram](./architecture_flow.md)

---

## ⚙️ Configuration (.env)

The system is highly configurable via environment variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `TARGET_COMPANIES` | JSON array or CSV of dream companies | `["Google", "Meta", "Netflix"]` |
| `TARGET_SOURCES` | Specific job boards to query | `["linkedin", "workingnomads"]` |
| `TARGET_TITLES` | Job titles to hunt for (overrides profile) | `["Senior Backend Engineer"]` |
| `MIN_SIMILARITY_SCORE` | Minimum semantic match threshold | `0.75` |
| `FRESHNESS_DAYS` | How old a job can be | `7` |

---

## 🏃 Run Commands

### The All-In-One Pipeline
Run the entire automated cycle (Fetch → Process → Email):
```bash
npm run daily-run
```

### Manual Individual Steps
- **Fetch Only**: `npm run fetch-jobs`
- **AI Processing Only**: `npm run process-jobs`
- **Send Alerts Only**: `npm run send-alerts`
- **Update Profile**: `npm run update-profile` (Re-reads `data/resume.md` and `data/requirements.md`)

---

## 📂 Project Structure

- `src/sources/`: Adapters for different job boards.
- `src/pipeline/`: Core aggregation and deduplication logic.
- `src/matching/`: Semantic matching and ranking engines.
- `src/db/`: MongoDB schemas and connection logic.
- `src/cli/`: Command-line interface scripts.
- `data/`: Your input files (`resume.md`, `requirements.md`).

---

## 🛡 Stability & Performance
- **Deduplication**: Multi-source tracking identifies if a job is listed on multiple boards.
- **Buffer Management**: Optimized to handle high-volume scraping from 160+ sources simultaneously.
- **Mongoose Modernization**: Uses latest MongoDB patterns for efficient updates and upserts.
