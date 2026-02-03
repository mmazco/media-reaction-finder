#!/usr/bin/env python3
"""
Update search logger to include domain and source fields
Run from project root: python scripts/update_search_logger.py
"""

import os

# Get project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def update_search_logger():
    with open(os.path.join(PROJECT_ROOT, 'api', 'search_logger.py'), 'r') as f:
        content = f.read()
    
    # Update the search_results table schema
    content = content.replace(
        '''            CREATE TABLE IF NOT EXISTS search_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER,
                result_type TEXT NOT NULL,
                title TEXT,
                url TEXT,
                snippet TEXT,
                position INTEGER,
                category TEXT,
                FOREIGN KEY (search_id) REFERENCES searches (id)
            )''',
        '''            CREATE TABLE IF NOT EXISTS search_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER,
                result_type TEXT NOT NULL,
                title TEXT,
                url TEXT,
                snippet TEXT,
                position INTEGER,
                category TEXT,
                source TEXT,
                domain TEXT,
                FOREIGN KEY (search_id) REFERENCES searches (id)
            )'''
    )
    
    # Update the insert statement
    content = content.replace(
        '''                cursor.execute('''
                    INSERT INTO search_results (search_id, result_type, title, url, snippet, position, category)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    search_id,
                    search_type,
                    result.get('title', ''),
                    result.get('url', ''),
                    result.get('summary', result.get('snippet', '')),
                    idx + 1,
                    result.get('category', 'general')
                ))''',
        '''                cursor.execute('''
                    INSERT INTO search_results (search_id, result_type, title, url, snippet, position, category, source, domain)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    search_id,
                    search_type,
                    result.get('title', ''),
                    result.get('url', ''),
                    result.get('summary', result.get('snippet', '')),
                    idx + 1,
                    result.get('category', 'general'),
                    result.get('source', 'Unknown Source'),
                    result.get('domain', 'unknown')
                ))'''
    )
    
    # Update the categorized searches query to include source and domain
    content = content.replace(
        '''            SELECT 
                s.id, s.query, s.search_type, s.timestamp, s.results_count,
                GROUP_CONCAT(
                    sr.title || '|||' || 
                    sr.url || '|||' || 
                    sr.snippet || '|||' || 
                    COALESCE(sr.category, 'general'), 
                    ':::'
                ) as results_data''',
        '''            SELECT 
                s.id, s.query, s.search_type, s.timestamp, s.results_count,
                GROUP_CONCAT(
                    sr.title || '|||' || 
                    sr.url || '|||' || 
                    sr.snippet || '|||' || 
                    COALESCE(sr.category, 'general') || '|||' ||
                    COALESCE(sr.source, 'Unknown Source') || '|||' ||
                    COALESCE(sr.domain, 'unknown'), 
                    ':::'
                ) as results_data'''
    )
    
    # Update the result parsing
    content = content.replace(
        '''                for result_str in results_data.split(':::'):
                    if result_str.strip():
                        parts = result_str.split('|||')
                        if len(parts) >= 4:
                            results.append({
                                'title': parts[0],
                                'url': parts[1],
                                'snippet': parts[2],
                                'category': parts[3]
                            })''',
        '''                for result_str in results_data.split(':::'):
                    if result_str.strip():
                        parts = result_str.split('|||')
                        if len(parts) >= 6:
                            results.append({
                                'title': parts[0],
                                'url': parts[1],
                                'snippet': parts[2],
                                'category': parts[3],
                                'source': parts[4],
                                'domain': parts[5]
                            })
                        elif len(parts) >= 4:
                            # Backward compatibility
                            results.append({
                                'title': parts[0],
                                'url': parts[1],
                                'snippet': parts[2],
                                'category': parts[3],
                                'source': 'Unknown Source',
                                'domain': 'unknown'
                            })'''
    )
    
    # Add a method to get source statistics
    content = content.replace(
        '''        return [dict(zip(['category', 'result_count', 'search_count'], row)) for row in stats]
    
    def export_data(self, format='json', date_from=None, date_to=None):''',
        '''        return [dict(zip(['category', 'result_count', 'search_count'], row)) for row in stats]
    
    def get_source_stats(self, days=30):
        """Get statistics by source/domain"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COALESCE(sr.source, 'Unknown Source') as source,
                COALESCE(sr.domain, 'unknown') as domain,
                COUNT(*) as result_count,
                COUNT(DISTINCT s.id) as search_count
            FROM searches s
            LEFT JOIN search_results sr ON s.id = sr.search_id
            WHERE DATE(s.timestamp) >= DATE('now', '-{} days')
            GROUP BY COALESCE(sr.source, 'Unknown Source'), COALESCE(sr.domain, 'unknown')
            ORDER BY result_count DESC
        '''.format(days))
        
        stats = cursor.fetchall()
        conn.close()
        
        return [dict(zip(['source', 'domain', 'result_count', 'search_count'], row)) for row in stats]
    
    def export_data(self, format='json', date_from=None, date_to=None):'''
    )
    
    with open('api/search_logger.py', 'w') as f:
        f.write(content)
    
    print("✅ Updated search logger to include source and domain tracking!")

if __name__ == '__main__':
    update_search_logger()