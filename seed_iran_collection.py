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
    
    # Iran articles - (title, url, source, authors, date, summary, recommended)
    iran_articles = [
        {
            'title': "Tehran's Method of Governance Has Reached a Dead End - Former Top Adviser Tells Euronews",
            'url': 'https://www.euronews.com/2026/01/05/tehrans-method-of-governance-has-reached-a-dead-end-former-top-adviser-tells-euronews',
            'source': 'Euronews',
            'authors': None,
            'date': 'January 5, 2026',
            'summary': 'A former top adviser discusses the challenges facing the Iranian government and its governance model.',
            'recommended': True
        },
        {
            'title': "In Pursuit of Whiteness: Why Iranian Monarchists Cheer Israel's Genocide",
            'url': 'https://www.jadaliyya.com/Details/46906',
            'source': 'Jadaliyya',
            'authors': 'Reza Zia-Ebrahimi',
            'date': 'September 22, 2025',
            'summary': 'Analysis of Iranian diaspora monarchists supporting Israel, examining dislocative nationalism and the pursuit of whiteness through internalised racial hierarchies and Islamophobia rooted in Western colonial epistemologies.',
            'recommended': True
        },
        {
            'title': "Iran's Political Opposition Jailed",
            'url': 'https://www.theatlantic.com/international/archive/2025/08/iran-political-opposition-jailed/683785/',
            'source': 'The Atlantic',
            'authors': None,
            'date': 'August 2025',
            'summary': 'Examination of the imprisonment of political opposition figures in Iran.',
            'recommended': False
        },
        {
            'title': 'The Israeli Influence Operation in Iran Pushing to Reinstate the Shah Monarchy',
            'url': 'https://archive.ph/QvqFh',
            'source': 'Haaretz',
            'authors': None,
            'date': 'October 3, 2025',
            'summary': "Investigation into Israeli operations aimed at promoting monarchist restoration in Iran.",
            'recommended': False
        },
        {
            'title': "Iran Toppled the Shah in 1979. Why This Time Isn't Quite Like That",
            'url': 'https://time.com/7345623/iran-protests-reza-shah-pahlavi-ayatollah-1979/',
            'source': 'TIME',
            'authors': 'Narges Bajoghli',
            'date': 'January 2026',
            'summary': "Analysis comparing current Iran protests to 1979 revolution, examining why structural conditions differ - the bazaar has lost autonomy to IRGC-connected elites, clergy is fragmented, military hasn't defected, and external disinformation complicates genuine opposition.",
            'recommended': True
        },
        {
            'title': "How the U.S. and Israel Are Trying to Co-opt Iran's Protests",
            'url': 'https://www.dropsitenews.com/p/iran-protests-us-israel-islamic-republic',
            'source': 'Drop Site News',
            'authors': 'Samira Mohyeddin, Narges Bajoghli, Jeremy Scahill, Murtaza Hussain',
            'date': 'January 13, 2026',
            'summary': "Discussion on what's driving Iran's protests, what we know under conditions of severe information blackout, and why Washington's talk of intervention carries enormous risks for Iranians and the broader region.",
            'recommended': True
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

