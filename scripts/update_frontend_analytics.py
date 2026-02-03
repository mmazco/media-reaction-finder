#!/usr/bin/env python3
"""
Update the frontend analytics to show detailed source information
Run from project root: python scripts/update_frontend_analytics.py
"""

import os

# Get project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def update_frontend_analytics():
    with open(os.path.join(PROJECT_ROOT, 'frontend', 'App.jsx'), 'r') as f:
        content = f.read()
    
    # Add a helper function to extract source from URL at the top of the component
    helper_function = '''
  // Helper function to extract source from URL
  const extractSourceFromUrl = (url) => {
    try {
      const domain = new URL(url.toLowerCase()).hostname.replace('www.', '');
      const domainToSource = {
        'cnn.com': 'CNN',
        'bbc.com': 'BBC News',
        'reuters.com': 'Reuters',
        'bloomberg.com': 'Bloomberg',
        'wsj.com': 'Wall Street Journal',
        'nytimes.com': 'The New York Times',
        'washingtonpost.com': 'The Washington Post',
        'theguardian.com': 'The Guardian',
        'techcrunch.com': 'TechCrunch',
        'wired.com': 'Wired',
        'theverge.com': 'The Verge',
        'engadget.com': 'Engadget',
        'gizmodo.com': 'Gizmodo',
        'billboard.com': 'Billboard',
        'rollingstone.com': 'Rolling Stone',
        'variety.com': 'Variety',
        'hollywoodreporter.com': 'The Hollywood Reporter',
        'ew.com': 'Entertainment Weekly',
        'espn.com': 'ESPN',
        'si.com': 'Sports Illustrated',
        'nfl.com': 'NFL',
        'nba.com': 'NBA',
        'nature.com': 'Nature',
        'science.org': 'Science',
        'scientificamerican.com': 'Scientific American',
        'nasa.gov': 'NASA',
        'vogue.com': 'Vogue',
        'harpersbazaar.com': "Harper's Bazaar",
        'elle.com': 'Elle',
        'artnews.com': 'Art News',
        'artforum.com': 'Artforum',
        'metmuseum.org': 'The Met',
        'marketwatch.com': 'MarketWatch',
        'ft.com': 'Financial Times',
        'rottentomatoes.com': 'Rotten Tomatoes',
        'imdb.com': 'IMDb',
        'ticketmaster.com': 'Ticketmaster'
      };
      
      if (domainToSource[domain]) {
        return domainToSource[domain];
      }
      
      // Fallback: clean up domain name
      return domain.split('.')[0].replace('-', ' ').replace('_', ' ')
        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    } catch {
      return 'Unknown Source';
    }
  };'''
    
    # Insert the helper function after the getCategoryColor function
    content = content.replace(
        '''  };

  const handleSearch = async () => {''',
        f'''  }};
{helper_function}

  const handleSearch = async () => {'''
    )
    
    # Replace the Recent Searches section to show detailed results
    old_recent_searches = '''                {/* Recent Searches with Categories */}
                {analyticsData.categorized_searches && analyticsData.categorized_searches.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: '18px',
                      marginBottom: '15px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Recent Searches
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                      borderRadius: '8px',
                      padding: '15px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {analyticsData.categorized_searches.slice(0, 10).map((search, index) => (
                        <div key={index} style={{
                          padding: '12px 0',
                          borderBottom: index < 9 ? `1px solid ${darkMode ? '#333' : '#ddd'}` : 'none'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{ 
                              color: darkMode ? '#ffffff' : '#1a1a1a',
                              fontSize: '14px',
                              fontWeight: '500',
                              maxWidth: '60%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {search.query}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getCategoryColor(search.primary_category),
                                marginRight: '5px'
                              }}></span>
                              <span style={{ 
                                color: darkMode ? '#b3b3b3' : '#666',
                                fontSize: '12px',
                                textTransform: 'capitalize',
                                fontFamily: 'Arial, sans-serif'
                              }}>
                                {search.primary_category}
                              </span>
                            </div>
                          </div>
                          <div style={{ 
                            color: darkMode ? '#b3b3b3' : '#666',
                            fontSize: '12px',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {new Date(search.timestamp).toLocaleDateString()} • {search.results_count} results
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}'''
    
    new_recent_searches = '''                {/* Recent Searches with Detailed Results */}
                {analyticsData.categorized_searches && analyticsData.categorized_searches.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: '18px',
                      marginBottom: '15px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Recent Searches with Sources
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                      borderRadius: '8px',
                      padding: '15px',
                      maxHeight: '400px',
                      overflowY: 'auto'
                    }}>
                      {analyticsData.categorized_searches.slice(0, 5).map((search, searchIndex) => (
                        <div key={searchIndex} style={{
                          marginBottom: '20px',
                          paddingBottom: '15px',
                          borderBottom: searchIndex < 4 ? `1px solid ${darkMode ? '#333' : '#ddd'}` : 'none'
                        }}>
                          {/* Search Query Header */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '10px' 
                          }}>
                            <span style={{ 
                              color: darkMode ? '#ffffff' : '#1a1a1a',
                              fontSize: '14px',
                              fontWeight: '600',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {search.query}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getCategoryColor(search.primary_category),
                                marginRight: '5px'
                              }}></span>
                              <span style={{ 
                                color: darkMode ? '#b3b3b3' : '#666',
                                fontSize: '11px',
                                textTransform: 'capitalize',
                                fontFamily: 'Arial, sans-serif'
                              }}>
                                {search.primary_category}
                              </span>
                            </div>
                          </div>
                          
                          {/* Individual Results */}
                          {search.results && search.results.length > 0 && (
                            <div style={{ marginLeft: '10px' }}>
                              {search.results.slice(0, 3).map((result, resultIndex) => {
                                const source = extractSourceFromUrl(result.url || '');
                                const category = result.category || 'general';
                                
                                return (
                                  <div key={resultIndex} style={{
                                    padding: '6px 0',
                                    borderLeft: `3px solid ${getCategoryColor(category)}`,
                                    paddingLeft: '8px',
                                    marginBottom: '5px'
                                  }}>
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      flexWrap: 'wrap'
                                    }}>
                                      <span style={{
                                        backgroundColor: darkMode ? '#333' : '#e8e8e8',
                                        color: darkMode ? '#ffffff' : '#333',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        fontFamily: 'Arial, sans-serif'
                                      }}>
                                        {source}
                                      </span>
                                      <span style={{
                                        backgroundColor: getCategoryColor(category),
                                        color: '#ffffff',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        fontWeight: '500',
                                        textTransform: 'capitalize',
                                        fontFamily: 'Arial, sans-serif'
                                      }}>
                                        {category}
                                      </span>
                                      <span style={{
                                        color: darkMode ? '#b3b3b3' : '#666',
                                        fontSize: '11px',
                                        fontFamily: 'Arial, sans-serif',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                      }}>
                                        {result.title || 'Untitled'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {search.results.length > 3 && (
                                <div style={{
                                  color: darkMode ? '#666' : '#999',
                                  fontSize: '11px',
                                  fontStyle: 'italic',
                                  marginTop: '5px',
                                  fontFamily: 'Arial, sans-serif'
                                }}>
                                  +{search.results.length - 3} more results
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Search Metadata */}
                          <div style={{ 
                            color: darkMode ? '#666' : '#999',
                            fontSize: '11px',
                            marginTop: '8px',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {new Date(search.timestamp).toLocaleDateString()} • {search.results_count} total results
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}'''
    
    content = content.replace(old_recent_searches, new_recent_searches)
    
    with open('frontend/App.jsx', 'w') as f:
        f.write(content)
    
    print("✅ Updated frontend analytics to show Source | Category | Title for each result!")

if __name__ == '__main__':
    update_frontend_analytics()