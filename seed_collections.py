#!/usr/bin/env python3
"""
Seed the curated collections with initial articles
"""

import sys
sys.path.insert(0, 'api')

from search_logger import SearchLogger

def seed_collections():
    logger = SearchLogger(db_path="search_history.db")
    
    # Create Palestine collection
    palestine_collection = logger.get_collection_by_tag('palestine')
    if not palestine_collection:
        logger.create_collection(
            tag='palestine',
            display_name='Palestine',
            icon='🇵🇸',
            description='Coverage of the Israel-Palestine conflict and Gaza'
        )
        print("✅ Created 'Palestine' collection")
    
    # Create other collections
    collections_to_create = [
        ('politics', 'Politics', '🏛️', 'Political news and analysis'),
        ('technology', 'Technology', '💻', 'Tech news and AI developments'),
        ('culture', 'Culture', '🎭', 'Arts, music, and cultural commentary'),
        ('media', 'Media', '📰', 'Journalism and media industry news'),
    ]
    
    for tag, display_name, icon, description in collections_to_create:
        if not logger.get_collection_by_tag(tag):
            logger.create_collection(tag, display_name, icon, description)
            print(f"✅ Created '{display_name}' collection")
    
    # Seed Palestine collection with articles
    palestine_articles = [
        {
            'title': 'Trump, Gaza, and Oslo Déjà Vu',
            'url': 'https://www.dropsitenews.com/p/trump-gaza-abbas-oslo-hamas-palestinian-islamic-jihad-fatah-palestinian-liberation-organization-palestinian-resistance-united-nation-macron-france',
            'source': 'Drop Site News',
            'authors': 'Jeremy Scahill, Jawa Ahmad',
            'date': 'December 1, 2025',
            'summary': 'The U.S. is pushing its colonialist plan, as Israel keeps killing. Mahmoud Abbas is changing election laws to ban Hamas. A battle is brewing over who speaks for the Palestinian liberation cause.'
        },
        {
            'title': "Israel's Forced Displacement of Palestinians in Gaza",
            'url': 'https://www.hrw.org/report/2024/11/14/hopeless-starving-and-besieged/israels-forced-displacement-palestinians-gaza',
            'source': 'Human Rights Watch',
            'authors': None,
            'date': 'November 14, 2024',
            'summary': "Hopeless, Starving, and Besieged: Report on Israel's forced displacement of Palestinians in Gaza."
        },
        {
            'title': 'Benjamin Netanyahu Talks Full Gaza Occupation',
            'url': 'https://www.theguardian.com/world/2025/aug/07/benjamin-netanyahu-talks-full-gaza-occupation-aid-agencies-hostages',
            'source': 'The Guardian',
            'authors': None,
            'date': 'August 7, 2025',
            'summary': 'Netanyahu discusses full Gaza occupation amid concerns from aid agencies about hostages.'
        },
        {
            'title': 'Funeral Held for Anas Al-Sharif and Other Journalists Killed in Israeli Strike',
            'url': 'https://www.theguardian.com/world/2025/aug/11/funeral-held-for-anas-al-sharif-and-other-journalists-killed-in-israeli-strike',
            'source': 'The Guardian',
            'authors': None,
            'date': 'August 11, 2025',
            'summary': 'Funeral held for journalists killed in Israeli strike in Gaza.'
        },
        {
            'title': 'Israel, Gaza, Holocaust, Genocide, Palestinians - Opinion',
            'url': 'https://www.nytimes.com/2025/07/15/opinion/israel-gaza-holocaust-genocide-palestinians.html',
            'source': 'The New York Times',
            'authors': None,
            'date': 'July 15, 2025',
            'summary': 'Opinion piece on the parallels between historical atrocities and current events in Gaza.'
        }
    ]
    
    for article in palestine_articles:
        result = logger.add_article_to_collection(
            'palestine',
            article['title'],
            article['url'],
            article['source'],
            article['authors'],
            article['date'],
            article['summary']
        )
        if result:
            print(f"  📄 Added: {article['title'][:50]}...")
        else:
            print(f"  ⏭️  Already exists: {article['title'][:50]}...")
    
    # Print summary
    print("\n📊 Collections Summary:")
    for collection in logger.get_all_collections():
        print(f"  {collection['icon']} {collection['display_name']}: {collection['article_count']} articles")

if __name__ == '__main__':
    seed_collections()

