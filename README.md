# Media Reaction Finder

A web application that analyzes public discourse around articles and media content by searching news sources and Reddit discussions.

## Features

- **Article Analysis**: Extract metadata and generate summaries from article URLs
- **News Search**: Find related news articles using Google Search API
- **Reddit Reactions**: Discover Reddit discussions and reactions to articles
- **Archive System**: Save and instantly access previous searches
- **Search Analytics**: Track and analyze all search queries with detailed statistics
- **Data Export**: Export search history in JSON or CSV formats
- **Dark Mode**: Toggle between light and dark themes
- **AI-Powered Summaries**: Generate intelligent summaries of articles and Reddit comments

## Tech Stack

### Backend
- **Python/Flask**: API server
- **OpenAI GPT-4**: Text summarization and analysis
- **SerpAPI**: Google search integration
- **Reddit PRAW**: Reddit API integration
- **BeautifulSoup**: Web scraping for article extraction
- **SQLite**: Search analytics and history database

### Frontend
- **React**: User interface
- **Vite**: Build tool and development server
- **Vanilla CSS**: Styling with dynamic dark mode

## Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- API Keys for:
  - OpenAI
  - SerpAPI
  - Reddit API

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd media-reaction-finder
```

2. Backend setup:
```bash
pip install -r requirements.txt
```

3. Frontend setup:
```bash
cd frontend
npm install
```

4. Environment variables:
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
SERPAPI_API_KEY=your_serpapi_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_reddit_user_agent
```

### Development

1. Start the backend:
```bash
python app.py
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Open https://media-reaction-finder.vercel.app/

## Deployment

This application is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Usage

1. **Analyze an Article**: Paste any article URL and click "ANALYZE REACTIONS"
2. **View Results**: See article summary, related news, and Reddit discussions
3. **Archive Access**: Click "ARCHIVE" to view and re-access previous searches
4. **Search Analytics**: Click "ANALYTICS" to view search statistics and export data
5. **Dark Mode**: Toggle the theme using the "DARK/LIGHT" button

### Analytics Features

The application now tracks all search queries and provides comprehensive analytics:

#### Web Interface
- **Analytics Dashboard**: Access via the "ANALYTICS" button
- **Search Statistics**: View total searches, unique queries, and average results
- **Top Queries**: See your most frequently searched terms
- **Data Export**: Download search history in JSON or CSV format

#### Command Line Interface
Use the analytics CLI tool for advanced data analysis:

```bash
# View overall statistics
python3 analytics_cli.py stats --days 30

# Show recent search history
python3 analytics_cli.py history --limit 20 --days 7

# Export data to file
python3 analytics_cli.py export --format csv --output searches.csv

# Search for specific queries
python3 analytics_cli.py search "climate change"
```

#### API Endpoints
- `GET /api/analytics/dashboard` - Get analytics dashboard data
- `GET /api/analytics/history` - Get search history with filters
- `GET /api/analytics/export` - Export search data
- `GET /api/analytics/stats` - Get quick statistics
- `GET /api/analytics/trends` - Get search trends and patterns

## Main API Endpoints

- `POST /api/reactions` - Analyze article and get reactions
- `POST /api/summarize` - Generate text summaries

See the Analytics Features section above for analytics-specific endpoints.

## License

MIT License
