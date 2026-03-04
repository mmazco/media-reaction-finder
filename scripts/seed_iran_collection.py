#!/usr/bin/env python3
"""
Seed the Iran collection with articles
Run from project root: python scripts/seed_iran_collection.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.search_logger import SearchLogger

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
            'recommended': False
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
        {
            'title': "Military Intervention Will Not Liberate the Iranian People",
            'url': 'https://newrepublic.com/article/205176/iran-crackdown-force-us-military',
            'source': 'The New Republic',
            'authors': 'Nancy Okail, Sina Toossi',
            'date': 'January 13, 2026',
            'summary': "Argues that Iranians are caught between their brutal regime and the U.S. war machine, rejecting military intervention as a solution. Discusses how repression cannot restore political order and why external intervention distorts democratic transitions.",
            'recommended': True
        },
        {
            'title': "A Fractured Iran Might Not Be So Bad",
            'url': 'https://www.wsj.com/opinion/a-fractured-iran-might-not-be-so-bad-5ec2d702',
            'source': 'Wall Street Journal',
            'authors': None,
            'date': 'January 2026',
            'summary': "Opinion piece discussing potential outcomes of political fragmentation in Iran.",
            'recommended': False
        },
        {
            'title': "Beyond Black and White: Notes from Tehran",
            'url': 'https://themarkaz.org/beyond-black-and-white-notes-from-tehran/',
            'source': 'The Markaz Review',
            'authors': 'M. Nateqnuri',
            'date': 'January 23, 2026',
            'summary': "First-hand account from Tehran noting layers of complexity: genuine economic grievances mixed with trained foreign agents (Israeli, US-backed MEK, separatists) attempting to manipulate protests. Describes unprecedented violence, magical thinking about US/Israeli intervention, and fear of civil war without viable opposition.",
            'recommended': True
        },
        {
            'title': "Iran-Israel AI War Propaganda Is a Warning to the World",
            'url': 'https://carnegieendowment.org/research/2025/07/iran-israel-ai-war-propaganda-is-a-warning-to-the-world?lang=en',
            'source': 'Carnegie Endowment for International Peace',
            'authors': 'Mahsa Alimardani, Sam Gregory',
            'date': 'July 28, 2025',
            'summary': "Analysis of AI-generated propaganda during the Iran-Israel war, examining the challenges of detecting synthetic media and the impact on civilian populations navigating information blackouts, disinformation, and conflict narratives.",
            'recommended': True
        },
        {
            'title': 'Inside the plan to kill Ali Khamenei',
            'url': 'https://archive.is/obNBX',
            'source': 'Financial Times',
            'authors': None,
            'date': '2026',
            'summary': 'FT reporting on the plan to kill Iran\'s Supreme Leader. Original: ft.com/content/bf998c69-ab46-4fa3-aae4-8f18f7387836.',
            'recommended': True
        },
        {
            'title': "Iran Is Built to Withstand the Ayatollah's Assassination",
            'url': 'https://archive.is/rhWfB',
            'source': 'Archived analysis',
            'authors': None,
            'date': '2026',
            'summary': 'Analysis piece on Iran\'s institutional resilience to leadership decapitation.',
            'recommended': True
        },
        {
            'title': 'State-Sponsored Twitter Accounts Pushing for War with Iran',
            'url': 'https://geoffgolberg.medium.com/state-sponsored-twitter-accounts-pushing-for-war-with-iran-732d3482b847',
            'source': 'Medium',
            'authors': 'Geoff Golberg',
            'date': None,
            'summary': 'Investigation into state-sponsored Twitter accounts pushing pro-war narratives on Iran, documenting coordinated inauthentic behavior on the platform.',
            'category_label': 'Analysis'
        },
        {
            'title': 'Why Do Official Israeli Government Twitter Accounts Follow So Many Inauthentic Accounts?',
            'url': 'https://geoffgolberg.medium.com/why-do-official-israeli-government-twitter-accounts-follow-so-many-inauthentic-accounts-51622563be89',
            'source': 'Medium',
            'authors': 'Geoff Golberg',
            'date': None,
            'summary': 'Investigation into why official Israeli government Twitter accounts follow large numbers of inauthentic accounts, raising questions about coordinated platform manipulation.',
            'category_label': 'Analysis'
        },
        {
            'title': 'State-Sponsored Platform Manipulation',
            'url': 'https://www.socialforensics.com/reports-2/state-sponsored-platform-manipulation',
            'source': 'Social Forensics',
            'authors': 'Geoff Golberg',
            'date': 'July 24, 2023',
            'summary': "Evidence of state-actor involvement in platform manipulation targeting the Iran policy debate on Twitter, including targeted abuse and gaming trending hashtags, which escalated after Mahsa Amini's death in September 2022.",
            'category_label': 'Analysis'
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
            article['summary'],
            category_label=article.get('category_label')
        )
        if result:
            print(f"  📄 Added: {article['title'][:60]}...")
            if article.get('recommended'):
                logger.set_article_recommended(result, True)
                print(f"     ⭐ Marked as recommended")
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

