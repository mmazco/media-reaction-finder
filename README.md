# Media Reaction Finder

Analyze public discourse around articles by searching news sources and Reddit discussions.

## Features

- **Article Analysis** — Paste any URL to extract metadata and AI-generated summaries
- **News Search** — Find related news coverage via Google News
- **Reddit Reactions** — Discover community discussions and reactions
- **Curated Collections** — Browse themed article collections (Palestine, Culture, AI, etc.)
- **Search History** — Access previous searches from the sidebar
- **Dark Mode** — Toggle light/dark themes

### Beta Features

- **Political Landscape Mapping** — Interactive visualization of Iran's political entities and power structures
- **Prediction Markets** — Live odds from Polymarket and Kalshi on geopolitical events

## Tech Stack

**Backend:** Python/Flask, OpenAI GPT-4, SerpAPI, Reddit PRAW, SQLite  
**Frontend:** React, Vite

## Setup

### Prerequisites
- Python 3.8+, Node.js 16+
- API keys: OpenAI, SerpAPI, Reddit

### Install

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### Environment Variables

Create `.env` in root:
```env
OPENAI_API_KEY=your_key
SERPAPI_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=your_agent
```

### Run

```bash
# Terminal 1 - Backend
python app.py

# Terminal 2 - Frontend (dev)
cd frontend && npm run dev
```

## Project Structure

```
├── app.py              # Main Flask server
├── api/                # Backend modules
├── frontend/           # React app
├── scripts/            # CLI tools & utilities
├── tests/              # Test files
├── data/               # Sample data
└── docs/               # Documentation
```

## CLI Tools

```bash
python scripts/analytics_cli.py stats --days 30
python scripts/analytics_cli.py history --limit 20
python scripts/analytics_cli.py export --format csv --output searches.csv
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/reactions` | Analyze article and get reactions |
| `POST /api/summarize` | Generate text summaries |
| `GET /api/analytics/dashboard` | Analytics dashboard data |
| `GET /api/analytics/export` | Export search data |

## License

MIT
