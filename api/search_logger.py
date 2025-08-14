import json
import os
from datetime import datetime
import sqlite3
from pathlib import Path

class SearchLogger:
    def __init__(self, db_path="search_history.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database for search logging"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create searches table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                search_type TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_ip TEXT,
                results_count INTEGER,
                serpapi_response TEXT,
                processing_time REAL,
                search_params TEXT
            )
        ''')
        
        # Create search_results table for detailed result tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS search_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER,
                result_type TEXT NOT NULL,
                title TEXT,
                url TEXT,
                snippet TEXT,
                position INTEGER,
                category TEXT,
                subcategory TEXT,
                source TEXT,
                FOREIGN KEY (search_id) REFERENCES searches (id)
            )
        ''')
        
        # Add new columns to existing search_results table if they don't exist
        try:
            cursor.execute('ALTER TABLE search_results ADD COLUMN subcategory TEXT')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        try:
            cursor.execute('ALTER TABLE search_results ADD COLUMN source TEXT')
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Create search_analytics table for aggregated data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS search_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE,
                total_searches INTEGER DEFAULT 0,
                unique_queries INTEGER DEFAULT 0,
                avg_results_count REAL DEFAULT 0,
                most_common_query TEXT,
                search_types TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def log_search(self, query, search_type, user_ip=None, results=None, processing_time=None, search_params=None, serpapi_response=None):
        """Log a search query and its results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert search record
        cursor.execute('''
            INSERT INTO searches (query, search_type, user_ip, results_count, serpapi_response, processing_time, search_params)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            query,
            search_type,
            user_ip,
            len(results) if results else 0,
            json.dumps(serpapi_response) if serpapi_response else None,
            processing_time,
            json.dumps(search_params) if search_params else None
        ))
        
        search_id = cursor.lastrowid
        
        # Insert individual results
        if results:
            for idx, result in enumerate(results):
                cursor.execute('''
                    INSERT INTO search_results (search_id, result_type, title, url, snippet, position, category, subcategory, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    search_id,
                    search_type,
                    result.get('title', ''),
                    result.get('url', ''),
                    result.get('summary', result.get('snippet', '')),
                    idx + 1,
                    result.get('category', 'general'),
                    result.get('subcategory', ''),
                    result.get('source', '')
                ))
        
        conn.commit()
        conn.close()
        
        # Update daily analytics
        self.update_daily_analytics()
        
        return search_id
    
    def update_daily_analytics(self):
        """Update daily analytics summary"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now().date()
        
        # Get today's stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_searches,
                COUNT(DISTINCT query) as unique_queries,
                AVG(results_count) as avg_results,
                query
            FROM searches 
            WHERE DATE(timestamp) = ?
            GROUP BY query
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ''', (today,))
        
        stats = cursor.fetchone()
        
        if stats:
            total_searches, unique_queries, avg_results, most_common = stats
            
            # Get search type distribution
            cursor.execute('''
                SELECT search_type, COUNT(*) 
                FROM searches 
                WHERE DATE(timestamp) = ?
                GROUP BY search_type
            ''', (today,))
            
            search_types = dict(cursor.fetchall())
            
            # Insert or update analytics
            cursor.execute('''
                INSERT OR REPLACE INTO search_analytics 
                (date, total_searches, unique_queries, avg_results_count, most_common_query, search_types)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                today,
                total_searches,
                unique_queries,
                avg_results or 0,
                most_common,
                json.dumps(search_types)
            ))
        
        conn.commit()
        conn.close()
    
    def get_search_history(self, limit=100, search_type=None, date_from=None, date_to=None):
        """Retrieve search history with optional filters"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT id, query, search_type, timestamp, user_ip, results_count, processing_time
            FROM searches
            WHERE 1=1
        '''
        params = []
        
        if search_type:
            query += ' AND search_type = ?'
            params.append(search_type)
        
        if date_from:
            query += ' AND DATE(timestamp) >= ?'
            params.append(date_from)
        
        if date_to:
            query += ' AND DATE(timestamp) <= ?'
            params.append(date_to)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        conn.close()
        
        # Convert to list of dictionaries
        columns = ['id', 'query', 'search_type', 'timestamp', 'user_ip', 'results_count', 'processing_time']
        return [dict(zip(columns, row)) for row in results]
    
    def get_analytics(self, days=30):
        """Get analytics for the last N days"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Daily analytics
        cursor.execute('''
            SELECT date, total_searches, unique_queries, avg_results_count, most_common_query, search_types
            FROM search_analytics
            WHERE date >= DATE('now', '-{} days')
            ORDER BY date DESC
        '''.format(days))
        
        daily_analytics = cursor.fetchall()
        
        # Overall stats
        cursor.execute('''
            SELECT 
                COUNT(*) as total_searches,
                COUNT(DISTINCT query) as unique_queries,
                AVG(results_count) as avg_results,
                MIN(timestamp) as first_search,
                MAX(timestamp) as last_search
            FROM searches
            WHERE DATE(timestamp) >= DATE('now', '-{} days')
        '''.format(days))
        
        overall_stats = cursor.fetchone()
        
        # Top queries
        cursor.execute('''
            SELECT query, COUNT(*) as count
            FROM searches
            WHERE DATE(timestamp) >= DATE('now', '-{} days')
            GROUP BY query
            ORDER BY count DESC
            LIMIT 10
        '''.format(days))
        
        top_queries = cursor.fetchall()
        
        # Search type distribution
        cursor.execute('''
            SELECT search_type, COUNT(*) as count
            FROM searches
            WHERE DATE(timestamp) >= DATE('now', '-{} days')
            GROUP BY search_type
        '''.format(days))
        
        search_types = cursor.fetchall()
        
        conn.close()
        
        return {
            'daily_analytics': [dict(zip(['date', 'total_searches', 'unique_queries', 'avg_results', 'most_common_query', 'search_types'], row)) for row in daily_analytics],
            'overall_stats': dict(zip(['total_searches', 'unique_queries', 'avg_results', 'first_search', 'last_search'], overall_stats)) if overall_stats else {},
            'top_queries': [dict(zip(['query', 'count'], row)) for row in top_queries],
            'search_types': [dict(zip(['type', 'count'], row)) for row in search_types]
        }
    
    def get_categorized_searches(self, limit=100, days=30):
        """Get searches with their categorized results"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                s.id, s.query, s.search_type, s.timestamp, s.results_count,
                GROUP_CONCAT(
                    sr.title || '|||' || 
                    sr.url || '|||' || 
                    sr.snippet || '|||' || 
                    COALESCE(sr.category, 'general') || '|||' ||
                    COALESCE(sr.subcategory, '') || '|||' ||
                    COALESCE(sr.source, ''), 
                    ':::'
                ) as results_data
            FROM searches s
            LEFT JOIN search_results sr ON s.id = sr.search_id
            WHERE DATE(s.timestamp) >= DATE('now', '-{} days')
            GROUP BY s.id
            ORDER BY s.timestamp DESC
            LIMIT ?
        '''.format(days), (limit,))
        
        searches = cursor.fetchall()
        conn.close()
        
        # Process the results
        formatted_searches = []
        for search in searches:
            search_id, query, search_type, timestamp, results_count, results_data = search
            
            # Parse results data
            results = []
            if results_data:
                for result_str in results_data.split(':::'):
                    if result_str.strip():
                        parts = result_str.split('|||')
                        if len(parts) >= 4:
                            results.append({
                                'title': parts[0],
                                'url': parts[1],
                                'snippet': parts[2],
                                'category': parts[3],
                                'subcategory': parts[4] if len(parts) > 4 else '',
                                'source': parts[5] if len(parts) > 5 else ''
                            })
            
            # Get category distribution for this search
            categories = {}
            for result in results:
                cat = result['category']
                categories[cat] = categories.get(cat, 0) + 1
            
            formatted_searches.append({
                'id': search_id,
                'query': query,
                'search_type': search_type,
                'timestamp': timestamp,
                'results_count': results_count,
                'results': results,
                'categories': categories,
                'primary_category': max(categories, key=categories.get) if categories else 'general'
            })
        
        return formatted_searches
    
    def get_category_stats(self, days=30):
        """Get statistics by category"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COALESCE(sr.category, 'general') as category,
                COUNT(*) as result_count,
                COUNT(DISTINCT s.id) as search_count
            FROM searches s
            LEFT JOIN search_results sr ON s.id = sr.search_id
            WHERE DATE(s.timestamp) >= DATE('now', '-{} days')
            GROUP BY COALESCE(sr.category, 'general')
            ORDER BY result_count DESC
        '''.format(days))
        
        stats = cursor.fetchall()
        conn.close()
        
        return [dict(zip(['category', 'result_count', 'search_count'], row)) for row in stats]
    
    def get_source_distribution(self, days=30):
        """Get statistics by source"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COALESCE(sr.source, 'Unknown') as source,
                COUNT(*) as result_count,
                COUNT(DISTINCT s.id) as search_count
            FROM searches s
            LEFT JOIN search_results sr ON s.id = sr.search_id
            WHERE DATE(s.timestamp) >= DATE('now', '-{} days')
            AND sr.source IS NOT NULL AND sr.source != ''
            GROUP BY COALESCE(sr.source, 'Unknown')
            ORDER BY result_count DESC
        '''.format(days))
        
        stats = cursor.fetchall()
        conn.close()
        
        return [dict(zip(['source', 'result_count', 'search_count'], row)) for row in stats]
    
    def export_data(self, format='json', date_from=None, date_to=None):
        """Export search data in various formats"""
        history = self.get_search_history(limit=10000, date_from=date_from, date_to=date_to)
        
        if format.lower() == 'json':
            return json.dumps(history, indent=2, default=str)
        elif format.lower() == 'csv':
            if not history:
                return "No data available"
            
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=history[0].keys())
            writer.writeheader()
            writer.writerows(history)
            return output.getvalue()
        else:
            raise ValueError("Unsupported format. Use 'json' or 'csv'")