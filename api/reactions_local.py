from flask import Flask, request, jsonify
from flask_cors import CORS
from search import search_news
from reddit import search_reddit_posts, get_title_from_url
from summarize import summarize_text
from analytics import analytics_bp
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re
from datetime import datetime
from dotenv import load_dotenv
from search_logger import SearchLogger

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS - allow all origins in production (Vercel), restrict in development
if os.getenv('VERCEL_ENV'):
    # Production: allow all origins for Vercel deployment
    CORS(app, allow_headers=['Content-Type'], methods=['GET', 'POST'])
else:
    # Development: restrict to localhost
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'], allow_headers=['Content-Type'], methods=['GET', 'POST'])

# Register analytics blueprint
app.register_blueprint(analytics_bp)
