# 📄 Comprehensive Project Documentation: AI Job Finder

## 1. Introduction: The "Why"
Traditional job hunting is a fragmented and time-consuming process. Candidates often have to:
- Manually check dozens of job boards (LinkedIn, Indeed, Niche boards, etc.).
- Read hundreds of descriptions that don't match their specific experience or tech stack.
- Track their progress across multiple platforms.
- Overlook high-quality, relevant roles because they were buried in "noise."

**AI Job Finder** was built to solve this by automating the discovery and evaluation phases. It acts as a personal AI agent that hunts for jobs 24/7, scores them based on your unique professional DNA, and presents you with only the most high-value opportunities.

---

## 2. Overview: The "What"
AI Job Finder is a full-stack job aggregation and semantic analysis engine. It leverages modern web scraping, vector embeddings, and LLM reasoning to bridge the gap between "Active Search" and "Direct Matching."

Unlike simple alert systems, this project doesn't just look for "Job Titles." It looks for **context**—understanding your specific requirements (e.g., "Full-stack but focusing on Backend," "3-7 years experience window") and matching them against the full text of job listings.

---

## 3. Key Functionalities

### 📍 Global Aggregation (Wide Net)
- **160+ Sources**: Integrated with a powerful CLI scraper (`EverJobs`) to pull from almost every major and niche job platform globally.
- **Auto-Discovery**: Dynamically generates search queries based on your professional profile.
- **Smart Targeted Searching**: Ability to focus specifically on "Dream Companies" or "Preferred Sources" (e.g., only LinkedIn roles).

### 🏷 Intelligent Processing (The Filter)
- **Semantic Matching**: Uses OpenAI’s `text-embedding-3-large` to calculate a "Similarity Score" (0.00 to 1.00) between your resume and a job's requirements.
- **Noise Guard**: Automatically rejects roles that are clearly irrelevant (e.g., DevOps for a Backend dev) using deep-title analysis.
- **Experience Enforcement**: Uses Regex pattern matching to identify "Years of Experience" required in a listing and skips jobs that don't fit your tier.
- **Freshness Window**: Ensures you are only applying to active leads (default 7-day window).

### 🤖 AI Reasoning Layer
- **Deep Explanations**: For the top-scored matches, the system uses `gpt-4o` to write a specific reasoning report: *"Why is this job a match?"*
- **Scoring Breakdown**: Provides a multi-factor score (Similarity, Recency, Title Relevance, Location Priority).

### 📧 Automated Delivery
- **Daily Digest**: Summarizes the best matches into a clean, professional email sent via **Resend API**.
- **Unified Pipeline**: A one-command workflow (`npm run daily-run`) that manages the entire lifecycle from scrape to email.

---

## 4. Live Examples: How It Works

### Example A: The "Dream Company" Hunt
**Goal**: You only want to work at Tier-1 companies like Google or Meta.
- **Config**:
  ```env
  TARGET_COMPANIES=["Google", "Meta"]
  TARGET_TITLES=["Senior Backend Engineer"]
  ```
- **Execution**: 
  1. The system searches broadly for `"Senior Backend Engineer"` across all 160+ sources.
  2. It finds 400+ jobs, but the **Aggregator** instantly discards 390 of them because the `company` field doesn't match Google or Meta.
  3. You are left with a high-quality list of only the 10 roles at your target firms.

### Example B: The "Broad Discovery" Search
**Goal**: You are open to any company but want to focus on LinkedIn and RemoteOK to save time.
- **Config**:
  ```env
  TARGET_COMPANIES=[] # Empty means search everyone
  TARGET_SOURCES=["linkedin", "remoteok"]
  TARGET_TITLES=["Node.js Developer", "Full Stack Engineer"]
  ```
- **Execution**:
  1. The system performs two laser-focused scrapes exclusively on LinkedIn and RemoteOK.
  2. It collects every matching role.
  3. The **AI Intelligence Phase** then scores these jobs based on your resume, ranking a "Node.js" role at a small startup higher than a generic "Engineer" role because of your specific tech stack.

---

## 5. How It Works: Technical Architecture

### Phase 1: Aggregation (The Hunt)
The system reads your `.env` for `TARGET_TITLES`. It then spawns the `EverJobsAdapter`, which runs automated CLI searches. 
> *Optimization*: It uses high-buffer execution to handle the massive JSON output from 160 simultaneous sources.

### Phase 2: Refinement & Deduplication
Jobs are passed into the `Aggregator`. 
- **Deduplication**: It creates a unique hash from the Job URL and content. If a job is on LinkedIn AND Indeed, it merge them, tracking all sources and alternate URLs.
- **Target Filtering**: If you have `TARGET_COMPANIES` set, the aggregator discards anything not from those employers.

### Phase 3: Embedding & Scoring (The Brain)
- The system checks for "Unprocessed" jobs in MongoDB.
- It sends the job description to OpenAI to generate a **Vector Embedding**.
- It calculates the **Cosine Similarity** between this vector and your **Profile Vector** (stored in DB).
- A **Ranking Engine** then applies weightings:
    - 40% Similarity
    - 20% Title Match
    - 20% Freshness
    - 10% Location
    - 10% Experience Alignment

### Phase 4: AI Logic & Alerting
- The top-ranked jobs are sent to `gpt-4o` for a brief analysis.
- An HTML email template is generated.
- The email is dispatched to your configured inbox.

---

## 5. Technology Stack
- **Backend**: Node.js, TypeScript
- **Database**: MongoDB (Mongoose)
- **AI/ML**: OpenAI (Embeddings + GPT-4o)
- **Email**: Resend API
- **Scraping**: EverJobs CLI (External Integration)
- **DevOps**: DotenvX (Environment Management), Git

---

## 6. How to Run & Configure

### Configuration
Everything is managed in the `.env` file:
- `TARGET_TITLES`: What we search for.
- `TARGET_COMPANIES`: Who we look at.
- `TARGET_SOURCES`: Where we look.
- `MIN_SIMILARITY_SCORE`: The quality bar (usually 0.75+).

### Running
1. **Setup**: `npm install`
2. **Profile Creation**: Place your resume in `data/resume.md` and run `npm run update-profile`.
3. **Automated Search**: `npm run daily-run`.

---

## 7. Future Roadmap
- **Browser Automation**: Auto-apply to LinkedIn roles found by the assistent.
- **Salary Insights**: Real-time salary benchmark check against similar roles.
- **Interview Prep**: AI-generated interview questions specific to a saved job match.
