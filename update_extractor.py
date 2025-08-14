#!/usr/bin/env python3
"""
Quick update to the SerpAPI extractor to include domain extraction
"""

def update_extractor():
    with open('serpapi_history_extractor.py', 'r') as f:
        content = f.read()
    
    # Add domain extractor import
    content = content.replace(
        'from api.search_logger import SearchLogger\nimport time',
        'from api.search_logger import SearchLogger\nfrom domain_extractor import enhance_search_results\nimport time'
    )
    
    # Update the result processing
    content = content.replace(
        '''                # Categorize each result
                categorized_results = []
                for result in results:
                    url = result.get('url', result.get('link', ''))
                    title = result.get('title', '')
                    snippet = result.get('snippet', result.get('summary', ''))
                    
                    # Determine category
                    category = self.categorizer.categorize_url(url)
                    if category == 'general':
                        # Try content-based categorization
                        content_category = self.categorizer.analyze_title_content(title, snippet)
                        if content_category:
                            category = content_category
                    
                    categorized_result = {
                        'title': title,
                        'url': url,
                        'summary': snippet,
                        'category': category
                    }
                    categorized_results.append(categorized_result)''',
        '''                # Enhance results with domain info
                enhanced_results = enhance_search_results(results)
                
                # Categorize each result
                categorized_results = []
                for result in enhanced_results:
                    url = result.get('url', result.get('link', ''))
                    title = result.get('title', '')
                    snippet = result.get('snippet', result.get('summary', ''))
                    
                    # Determine category
                    category = self.categorizer.categorize_url(url)
                    if category == 'general':
                        # Try content-based categorization
                        content_category = self.categorizer.analyze_title_content(title, snippet)
                        if content_category:
                            category = content_category
                    
                    categorized_result = {
                        'title': title,
                        'url': url,
                        'summary': snippet,
                        'category': category,
                        'source': result.get('source', 'Unknown Source'),
                        'domain': result.get('domain', 'unknown')
                    }
                    categorized_results.append(categorized_result)'''
    )
    
    with open('serpapi_history_extractor.py', 'w') as f:
        f.write(content)
    
    print("✅ Updated SerpAPI extractor to include domain extraction!")

if __name__ == '__main__':
    update_extractor()