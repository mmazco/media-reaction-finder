#!/usr/bin/env python3
"""
Seed the curated collections with initial articles
Run from project root: python scripts/seed_collections.py
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.search_logger import SearchLogger

def seed_collections():
    logger = SearchLogger(db_path="search_history.db")
    
    # Create collections (no emojis) - Order: Palestine, Culture, AI, Internet, Politics
    collections_to_create = [
        ('palestine', 'Palestine', '', "Coverage on Israel's genocide in Gaza and embracing Palestinian culture"),
        ('culture', 'Culture', '', 'Arts, music, and cultural commentary'),
        ('ai', 'AI', '', 'Artificial intelligence news and developments'),
        ('internet', 'Internet', '', 'Digital culture and online trends'),
        ('politics', 'Politics', '', 'Political news and analysis'),
    ]
    
    for tag, display_name, icon, description in collections_to_create:
        if not logger.get_collection_by_tag(tag):
            logger.create_collection(tag, display_name, icon, description)
            print(f"✅ Created '{display_name}' collection")
    
    # Palestine articles
    palestine_articles = [
        {
            'title': 'Israel, Gaza, Holocaust, Genocide, Palestinians',
            'url': 'https://www.nytimes.com/2025/07/15/opinion/israel-gaza-holocaust-genocide-palestinians.html',
            'source': 'The New York Times',
            'authors': None,
            'date': 'July 15, 2025',
            'summary': 'Opinion piece examining the parallels and distinctions in discussions of genocide and historical atrocities in the context of Gaza.'
        },
        {
            'title': 'Support Late Photographer Mariam Riyad Abu Dagga and Ahmed Younes',
            'url': 'https://www.dazed.me/art-photography/support-late-photographer-mariam-riyad-abu-dagga-and-ahmed-younes-through-the-palestine-print-platform',
            'source': 'Dazed',
            'authors': None,
            'date': None,
            'summary': 'Supporting Palestinian photographers through the Palestine Print Platform initiative.'
        },
        {
            'title': 'Palestine Is Everywhere: The New Book Demanding Art World Solidarity',
            'url': 'https://www.dazeddigital.com/art-photography/article/69037/1/palestine-is-everywhere-the-new-book-demanding-art-world-solidarity',
            'source': 'Dazed Digital',
            'authors': None,
            'date': None,
            'summary': 'A new book demanding solidarity from the art world for Palestine.'
        },
        {
            'title': 'Eugenicism and Palestine',
            'url': 'https://palestinenexus.com/articles/eugenicism',
            'source': 'Palestine Nexus',
            'authors': None,
            'date': None,
            'summary': 'An exploration of eugenicist ideologies in the context of Palestine.'
        },
        {
            'title': 'There Is No Peace in Gaza',
            'url': 'https://www.newyorker.com/news/essay/there-is-no-peace-in-gaza',
            'source': 'The New Yorker',
            'authors': None,
            'date': None,
            'summary': 'An essay examining the ongoing conflict and humanitarian situation in Gaza.'
        },
        {
            'title': 'Trump, Gaza, and Oslo Déjà Vu',
            'url': 'https://www.dropsitenews.com/p/trump-gaza-abbas-oslo-hamas-palestinian-islamic-jihad-fatah-palestinian-liberation-organization-palestinian-resistance-united-nation-macron-france',
            'source': 'Drop Site News',
            'authors': 'Jeremy Scahill, Jawa Ahmad',
            'date': 'December 1, 2025',
            'summary': 'The U.S. is pushing its colonialist plan, as Israel keeps killing. Mahmoud Abbas is changing election laws to ban Hamas.'
        },
        {
            'title': "Israel's Genocide Against Palestinians Continues Unabated Despite Ceasefire",
            'url': 'https://www.amnesty.org/en/latest/news/2025/11/israels-genocide-against-palestinians-in-gaza-continues-unabated-despite-ceasefire/',
            'source': 'Amnesty International',
            'authors': None,
            'date': 'November 2025',
            'summary': "Amnesty International's report on the ongoing humanitarian crisis in Gaza."
        },
        {
            'title': 'Portrait of a Campus in Crisis',
            'url': 'https://jewishcurrents.org/portrait-of-a-campus-in-crisis',
            'source': 'Jewish Currents',
            'authors': None,
            'date': None,
            'summary': 'An examination of campus dynamics amid the Israel-Palestine conflict.'
        },
        {
            'title': 'The Israel Lobby Is Melting Down Before Our Eyes',
            'url': 'https://mondoweiss.net/2025/12/the-israel-lobby-is-melting-down-before-our-eyes/',
            'source': 'Mondoweiss',
            'authors': None,
            'date': 'December 2025',
            'summary': 'Analysis of the shifting political landscape around Israel advocacy in the US.'
        },
        {
            'title': 'Losing the Republican Base: Israel Pours Millions to Target Evangelicals',
            'url': 'https://www.haaretz.com/israel-news/security-aviation/2025-11-09/ty-article-magazine/.premium/losing-the-republican-base-israel-pours-millions-to-target-evangelicals-and-churchgoers/0000019a-540e-db4c-a5fb-dfafea590000',
            'source': 'Haaretz',
            'authors': None,
            'date': 'November 9, 2025',
            'summary': 'Israel invests millions in targeting evangelical and churchgoing communities amid shifting political dynamics.'
        },
        {
            'title': "Politics of Counting Gaza's Dead",
            'url': 'https://arena.org.au/politics-of-counting-gazas-dead/',
            'source': 'Arena',
            'authors': None,
            'date': None,
            'summary': 'An analysis of the political dimensions of casualty counting in Gaza.'
        },
        {
            'title': 'Substack Post on Palestine',
            'url': 'https://substack.com/home/post/p-166396887',
            'source': 'Substack',
            'authors': None,
            'date': None,
            'summary': 'Commentary and analysis on the Palestine situation.'
        },
        {
            'title': 'Substack Post on Gaza',
            'url': 'https://substack.com/home/post/p-176551170',
            'source': 'Substack',
            'authors': None,
            'date': None,
            'summary': 'Recent perspectives on the ongoing situation in Gaza.'
        },
        {
            'title': "Ellison's Paramount, TikTok, and Israel Media Empire",
            'url': 'https://www.972mag.com/ellisons-paramount-tiktok-israel-media-empire/',
            'source': '+972 Magazine',
            'authors': None,
            'date': None,
            'summary': 'Investigation into media ownership and its connections to Israel.'
        },
    ]
    
    # AI articles
    ai_articles = [
        {
            'title': 'AI and Supply Chains',
            'url': 'https://www.weforum.org/stories/2025/01/ai-supply-chains/',
            'source': 'World Economic Forum',
            'authors': None,
            'date': 'January 2025',
            'summary': 'How artificial intelligence is transforming global supply chain management.'
        },
        {
            'title': 'Chromaverse',
            'url': 'https://dotdotdash.com/labs/chromaverse',
            'source': 'Dot Dot Dash Labs',
            'authors': None,
            'date': None,
            'summary': 'An experimental AI-powered creative project exploring color and visual synthesis.'
        },
        {
            'title': 'TLE - AI Research',
            'url': 'https://ii.inc/web/blog/post/tle',
            'source': 'ii.inc',
            'authors': None,
            'date': None,
            'summary': 'Technical research on AI language models and training approaches.'
        },
        {
            'title': 'How Does a Blind Model See the Earth?',
            'url': 'https://outsidetext.substack.com/p/how-does-a-blind-model-see-the-earth',
            'source': 'Outside Text',
            'authors': None,
            'date': None,
            'summary': 'Exploring how AI models without visual training understand spatial and geographic concepts.'
        },
        {
            'title': 'AI 2027: Predictions and Trajectories',
            'url': 'https://ai-2027.com/',
            'source': 'AI 2027',
            'authors': None,
            'date': None,
            'summary': 'Forecasting the development and impact of AI through 2027.'
        },
        {
            'title': 'Amanda Askell Publications',
            'url': 'https://askell.io/publications/',
            'source': 'Askell.io',
            'authors': 'Amanda Askell',
            'date': None,
            'summary': 'Research publications on AI alignment, ethics, and language models.'
        },
        {
            'title': 'Claude Character Research',
            'url': 'https://www.anthropic.com/research/claude-character',
            'source': 'Anthropic',
            'authors': None,
            'date': None,
            'summary': "Anthropic's research on developing Claude's character and values."
        },
        {
            'title': 'AI Development Insights',
            'url': 'https://substack.com/home/post/p-165014643',
            'source': 'Substack',
            'authors': None,
            'date': None,
            'summary': 'Analysis and commentary on recent AI developments.'
        },
        {
            'title': 'AI Industry Analysis',
            'url': 'https://substack.com/home/post/p-174437267',
            'source': 'Substack',
            'authors': None,
            'date': None,
            'summary': 'Deep dive into AI industry trends and implications.'
        },
    ]
    
    # Culture articles
    culture_articles = [
        {
            'title': 'Models.com Feature',
            'url': 'https://models.com/oftheminute/?p=168720',
            'source': 'Models.com',
            'authors': None,
            'date': None,
            'summary': 'Fashion and modeling industry spotlight and cultural commentary.'
        },
        {
            'title': 'Trish Talks Culture',
            'url': 'https://substack.com/@trishestalks/p-176272631',
            'source': 'Substack',
            'authors': 'Trish',
            'date': None,
            'summary': 'Cultural commentary and analysis on contemporary trends.'
        },
        {
            'title': 'Christianity Was Borderline Illegal in Silicon Valley. Now It\'s the New Religion',
            'url': 'https://www.vanityfair.com/news/story/christianity-was-borderline-illegal-in-silicon-valley-now-its-the-new-religion',
            'source': 'Vanity Fair',
            'authors': None,
            'date': None,
            'summary': 'Examining the rise of Christianity and religious movements in Silicon Valley tech culture.'
        },
    ]
    
    # Politics articles
    politics_articles = [
        {
            'title': 'Building a Prosocial Media Ecosystem',
            'url': 'https://www.noemamag.com/building-a-prosocial-media-ecosystem/',
            'source': 'Noema Magazine',
            'authors': None,
            'date': None,
            'summary': 'Exploring how to create media platforms that promote positive social outcomes.'
        },
        {
            'title': 'Newsom Launches Digital Democracy Initiative',
            'url': 'https://www.latimes.com/california/story/2025-02-23/newsom-launches-a-new-digital-democracy-initiative-including-outreach-to-wildfire-victims',
            'source': 'Los Angeles Times',
            'authors': None,
            'date': 'February 23, 2025',
            'summary': 'Governor Newsom launches a new digital democracy tool with focus on wildfire victim outreach.'
        },
        {
            'title': 'Warlords of Information: Palantir, Epstein, & The New York Times',
            'url': 'https://www.zig.art/p/my-final-message-before-im-on-an',
            'source': 'Ziggurat',
            'authors': 'Juan Sebastián Pinto',
            'date': 'January 9, 2026',
            'summary': "Former Palantir employee's analysis of AI surveillance technology, ISTAR systems, and the connections between Silicon Valley, defense contractors, and media manipulation in hybrid warfare."
        },
    ]
    
    # Internet articles
    internet_articles = [
        {
            'title': 'Internet Archive Reaches Trillion',
            'url': 'https://blog.archive.org/trillion',
            'source': 'Internet Archive',
            'authors': None,
            'date': None,
            'summary': 'The Internet Archive celebrates a major milestone in preserving digital history.'
        },
    ]
    
    # Seed all collections
    collections_data = [
        ('palestine', palestine_articles),
        ('ai', ai_articles),
        ('culture', culture_articles),
        ('politics', politics_articles),
        ('internet', internet_articles),
    ]
    
    for tag, articles in collections_data:
        print(f"\n📁 Seeding '{tag}' collection:")
        for article in articles:
            result = logger.add_article_to_collection(
                tag,
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
        print(f"  {collection['display_name']}: {collection['article_count']} articles")

if __name__ == '__main__':
    seed_collections()
