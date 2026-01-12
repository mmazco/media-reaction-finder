#!/usr/bin/env python3
"""
Seed the Iran collection with articles
"""

import sys
sys.path.insert(0, 'api')

from search_logger import SearchLogger

def seed_iran_collection():
    logger = SearchLogger(db_path="search_history.db")
    
    # Create Iran collection if it doesn't exist
    if not logger.get_collection_by_tag('iran'):
        logger.create_collection(
            'iran', 
            'Iran', 
            '', 
            'Articles on Iran, Iranian politics, opposition movements, and regional dynamics'
        )
        print("✅ Created 'Iran' collection")
    else:
        print("📁 'Iran' collection already exists")
    
    # Iran articles
    iran_articles = [
        {
            'title': "Tehran's Method of Governance Has Reached a Dead End - Former Top Adviser Tells Euronews",
            'url': 'https://www.euronews.com/2026/01/05/tehrans-method-of-governance-has-reached-a-dead-end-former-top-adviser-tells-euronews',
            'source': 'Euronews',
            'authors': None,
            'date': 'January 5, 2026',
            'summary': 'A former top adviser discusses the challenges facing the Iranian government and its governance model.'
        },
        {
            'title': "In Pursuit of Whiteness: Why Iranian Monarchists Cheer Israel's Genocide",
            'url': 'https://www.jadaliyya.com/Details/46906',
            'source': 'Jadaliyya',
            'authors': 'Reza Zia-Ebrahimi',
            'date': 'September 22, 2025',
            'summary': 'Analysis of Iranian diaspora monarchists supporting Israel, examining dislocative nationalism and the pursuit of whiteness through internalised racial hierarchies and Islamophobia rooted in Western colonial epistemologies.'
        },
        {
            'title': "Iran's Political Opposition Jailed",
            'url': 'https://www.theatlantic.com/international/archive/2025/08/iran-political-opposition-jailed/683785/',
            'source': 'The Atlantic',
            'authors': None,
            'date': 'August 2025',
            'summary': 'Examination of the imprisonment of political opposition figures in Iran.'
        },
        {
            'title': 'The Israeli Influence Operation in Iran Pushing to Reinstate the Shah Monarchy',
            'url': 'https://www.haaretz.com/israel-news/security-aviation/2025-10-03/ty-article-magazine/.premium/the-israeli-influence-operation-in-iran-pushing-to-reinstate-the-shah-monarchy/00000199-9f12-df33-a5dd-9f770d7a0000',
            'source': 'Haaretz',
            'authors': None,
            'date': 'October 3, 2025',
            'summary': "Investigation into Israeli operations aimed at promoting monarchist restoration in Iran."
        },
    ]
    
    print(f"\n📁 Seeding 'Iran' collection:")
    for article in iran_articles:
        result = logger.add_article_to_collection(
            'iran',
            article['title'],
            article['url'],
            article['source'],
            article['authors'],
            article['date'],
            article['summary']
        )
        if result:
            print(f"  📄 Added: {article['title'][:60]}...")
        else:
            print(f"  ⏭️  Already exists: {article['title'][:60]}...")
    
    # Print summary
    print("\n📊 Iran Collection Summary:")
    articles = logger.get_collection_articles('iran')
    print(f"  Total articles: {len(articles)}")
    for article in articles:
        print(f"    • {article['title'][:70]}...")

if __name__ == '__main__':
    seed_iran_collection()

