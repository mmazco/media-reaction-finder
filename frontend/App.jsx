import React, { useState, useEffect } from 'react';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [reddit, setReddit] = useState([]);
  const [article, setArticle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // Function to delete history items
  const deleteHistoryItem = (id, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Load search history and dark mode from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    // Close sidebar with Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      setNews(data.news || []);
      setReddit(data.reddit || []);
      setArticle(data.article || null);
      console.log('Article set to:', data.article); // Debug log
      
      // Save to search history - for URLs use article data, for text queries create basic entry
      let historyItem = null;
      
      if (data.article) {
        // URL search with article metadata
        historyItem = {
          id: Date.now(),
          title: data.article.title,
          source: data.article.source,
          date: data.article.date,
          url: data.article.url,
          query: query,
          searchedAt: new Date().toISOString()
        };
      } else if (query.trim() && (data.news?.length > 0 || data.reddit?.length > 0)) {
        // Text search or URL search without full metadata
        if (query.startsWith('http')) {
          // URL search without full article metadata - try to extract domain for better display
          try {
            const url = new URL(query);
            const domain = url.hostname.replace('www.', '');
            historyItem = {
              id: Date.now(),
              title: `Article from ${domain}`,
              source: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              url: query,
              query: query,
              searchedAt: new Date().toISOString()
            };
          } catch {
            // Fallback if URL parsing fails
            historyItem = {
              id: Date.now(),
              title: 'Web Article',
              source: 'Unknown Source',
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              url: query,
              query: query,
              searchedAt: new Date().toISOString()
            };
          }
        } else {
          // Text search with results
          historyItem = {
            id: Date.now(),
            title: query.length > 40 ? query.substring(0, 40) + '...' : query,
            source: 'Search Query',
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            url: query,
            query: query,
            searchedAt: new Date().toISOString()
          };
        }
      }
      
      if (historyItem) {
        // Store the complete results with the history item
        historyItem.cachedResults = {
          news: data.news,
          reddit: data.reddit,
          article: data.article
        };
        
        const updatedHistory = [historyItem, ...searchHistory.slice(0, 9)]; // Keep last 10
        setSearchHistory(updatedHistory);
        
        // Try to save to localStorage, but handle quota exceeded errors
        try {
          localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        } catch (e) {
          // If storage is full, remove cached results from older items
          console.warn('localStorage quota exceeded, removing old cached results');
          const reducedHistory = updatedHistory.map((item, index) => {
            if (index > 4) { // Keep cached results only for the 5 most recent
              const { cachedResults, ...itemWithoutCache } = item;
              return itemWithoutCache;
            }
            return item;
          });
          localStorage.setItem('searchHistory', JSON.stringify(reducedHistory));
        }
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic styles based on dark mode
  const getStyles = () => {
    const baseColors = darkMode ? {
      bg: '#121212',
      cardBg: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      border: '#333333',
      accent: '#ffffff'
    } : {
      bg: '#ffffff',
      cardBg: '#f8f8f8',
      text: '#1a1a1a',
      textSecondary: '#666',
      border: '#e0e0e0',
      accent: '#1a1a1a'
    };

    return {
      container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      backgroundColor: baseColors.bg,
      color: baseColors.text
    },
      archiveLabel: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: baseColors.accent,
      color: darkMode ? '#121212' : '#ffffff',
      padding: '6px 16px',
      fontSize: '11px',
      letterSpacing: '1px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
      darkModeToggle: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'transparent',
      border: `2px solid ${baseColors.accent}`,
      color: baseColors.accent,
      padding: '6px 12px',
      fontSize: '11px',
      letterSpacing: '1px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
      content: {
      maxWidth: '700px',
      width: '100%',
      textAlign: 'center'
    },
      title: {
      fontSize: '48px',
      fontWeight: 'normal',
      marginBottom: '20px',
      color: baseColors.text,
      fontFamily: 'Georgia, serif'
    },
      subtitle: {
      fontSize: '16px',
      color: baseColors.textSecondary,
      marginBottom: '50px',
      fontStyle: 'italic',
      fontFamily: 'Georgia, serif'
    },
      form: {
      marginBottom: '40px'
    },
      label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '10px',
      textAlign: 'left',
      color: baseColors.text,
      fontFamily: 'Arial, sans-serif'
    },
      input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '15px',
      border: 'none',
      borderBottom: '1px solid #ccc',
      outline: 'none',
      backgroundColor: 'transparent',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      color: '#666'
    },
      button: {
      marginTop: '40px',
      padding: '14px 32px',
      fontSize: '12px',
      letterSpacing: '1.5px',
      fontWeight: '600',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      transition: 'background-color 0.3s ease'
    },
      loadingContainer: {
      marginTop: '40px',
      textAlign: 'center'
    },
      loadingText: {
      fontSize: '16px',
      color: '#666',
      fontStyle: 'italic',
      fontFamily: 'Georgia, serif',
      marginBottom: '10px'
    },
      loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #666',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
      results: {
      marginTop: '60px',
      textAlign: 'left'
    },
      resultSection: {
      marginBottom: '40px'
    },
      resultTitle: {
      fontSize: '24px',
      marginBottom: '20px',
      color: darkMode ? '#ffffff' : '#1a1a1a',
      fontFamily: 'Georgia, serif'
    },
      resultItem: {
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
      borderRadius: '5px'
    },
      link: {
      color: darkMode ? '#4da6ff' : '#0066cc',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500'
    },
      summary: {
      marginTop: '8px',
      color: darkMode ? '#b3b3b3' : '#666',
      fontSize: '14px',
      lineHeight: '1.5'
    },
      sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '350px',
      backgroundColor: baseColors.bg,
      borderRight: `1px solid ${baseColors.border}`,
      transform: 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    },
      sidebarOpen: {
      transform: 'translateX(0)'
    },
      sidebarHeader: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '20px',
      color: baseColors.text,
      fontFamily: 'Arial, sans-serif'
    },
      historyItem: {
      marginBottom: '15px',
      padding: '15px',
      backgroundColor: baseColors.cardBg,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      border: `1px solid ${baseColors.border}`,
      wordWrap: 'break-word',
      overflow: 'hidden'
    },
      historyTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: baseColors.text,
      marginBottom: '6px',
      lineHeight: '1.3',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical'
    },
      historySource: {
      fontSize: '13px',
      color: baseColors.textSecondary,
      marginBottom: '2px',
      fontWeight: '500'
    },
      historyDate: {
      fontSize: '11px',
      color: baseColors.textSecondary,
      fontStyle: 'italic'
    },
      overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 999
    },
      articleSummary: {
      marginTop: '40px',
      padding: '20px',
      backgroundColor: baseColors.cardBg,
      borderRadius: '8px',
      border: `1px solid ${baseColors.border}`,
      textAlign: 'left'
    },
      summaryTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '15px',
      color: baseColors.text,
      fontFamily: 'Georgia, serif',
      textAlign: 'left'
    },
      summaryRow: {
      display: 'flex',
      marginBottom: '8px'
    },
      summaryLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: darkMode ? '#b3b3b3' : '#333',
      width: '80px',
      fontFamily: 'Arial, sans-serif'
    },
      summaryValue: {
      fontSize: '14px',
      color: darkMode ? '#d4d4d4' : '#666',
      flex: 1,
      fontFamily: 'Georgia, serif'
    },
      summaryText: {
      fontSize: '14px',
      color: darkMode ? '#d4d4d4' : '#444',
      lineHeight: '1.6',
      marginTop: '10px',
      fontFamily: 'Georgia, serif',
      textAlign: 'left'
    }
    };
  };

  // Get current styles
  const styles = getStyles();

  return (
    <div style={styles.container}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {})
      }}>
        <div style={styles.sidebarHeader}>Search Archive</div>
        {searchHistory.length > 0 ? (
          searchHistory.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.historyItem,
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#e8e8e8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#1e1e1e' : '#f8f8f8'}
            >
              <div
                onClick={async () => {
                  setQuery(item.query || item.url);
                  setSidebarOpen(false);
                  
                  // Restore cached results if available
                  if (item.cachedResults) {
                    setNews(item.cachedResults.news || []);
                    setReddit(item.cachedResults.reddit || []);
                    setArticle(item.cachedResults.article || null);
                  } else {
                    // Fallback: trigger a new search for older items without cache
                    setTimeout(() => {
                      handleSearch();
                    }, 100);
                  }
                }}
                style={{cursor: 'pointer', paddingRight: '35px'}}
              >
                <div style={styles.historyTitle}>{item.title}</div>
                <div style={styles.historySource}>{item.source}</div>
                <div style={styles.historyDate}>{item.date}</div>
              </div>
              <button
                onClick={(e) => deleteHistoryItem(item.id, e)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: darkMode ? '#666' : '#999',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px',
                  width: '25px',
                  height: '25px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#333' : '#ddd';
                  e.target.style.color = darkMode ? '#fff' : '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = darkMode ? '#666' : '#999';
                }}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div style={{color: darkMode ? '#b3b3b3' : '#666', fontSize: '14px', fontStyle: 'italic'}}>
            No search history yet
          </div>
        )}
      </div>
      
      <div 
        style={styles.archiveLabel}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? '#333' : '#333'}
        onMouseLeave={(e) => e.target.style.backgroundColor = darkMode ? '#ffffff' : '#1a1a1a'}
      >
        ARCHIVE
      </div>
      
      <div 
        style={styles.darkModeToggle}
        onClick={toggleDarkMode}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = darkMode ? '#ffffff' : '#1a1a1a';
          e.target.style.color = darkMode ? '#121212' : '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = darkMode ? '#ffffff' : '#1a1a1a';
        }}
      >
        {darkMode ? 'LIGHT' : 'DARK'}
      </div>
      
      <div style={styles.content}>
        <h1 style={styles.title}>Media Reaction Finder</h1>
        <p style={styles.subtitle}>Discover public discourse around any published article, media and content</p>
        
        <div style={styles.form}>
          <label style={styles.label}>Insert URL</label>
          <input
            type="text"
            placeholder="https://example.com/article"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          {!loading ? (
            <button 
              onClick={handleSearch} 
              style={styles.button}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1a1a'}
            >
              ANALYZE REACTIONS
            </button>
          ) : (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingText}>Searching for reactions across the web...</div>
              <div style={styles.loadingSpinner}></div>
            </div>
          )}
        </div>

        {/* Article Summary - Also show for any URL that was searched */}
        {(article || (query.startsWith('http') && (news.length > 0 || reddit.length > 0))) && (
          <div style={styles.articleSummary}>
            <div style={styles.summaryTitle}>Summary</div>
            <div style={styles.summaryRow}>
              <div style={styles.summaryLabel}>Title:</div>
              <div style={styles.summaryValue}>
                {article ? (article.title || 'Unknown Title') : 'Article from URL'}
              </div>
            </div>
            <div style={styles.summaryRow}>
              <div style={styles.summaryLabel}>Source:</div>
              <div style={styles.summaryValue}>
                {article ? (article.source || 'Unknown Source') : 'Web Article'}
              </div>
            </div>
            <div style={styles.summaryRow}>
              <div style={styles.summaryLabel}>Date:</div>
              <div style={styles.summaryValue}>
                {article ? (article.date || 'Date not available') : 'Date not available'}
              </div>
            </div>
            {article && article.summary && (
              <div style={styles.summaryText}>
                {article.summary}
              </div>
            )}
            {!article && query.startsWith('http') && (
              <div style={styles.summaryText}>
                Analysis complete for: {query}
              </div>
            )}
          </div>
        )}



        {(news.length > 0 || reddit.length > 0) && (
          <div style={styles.results}>
            {news.length > 0 && (
              <div style={styles.resultSection}>
                <h2 style={styles.resultTitle}>Related News</h2>
                {news.map((article, i) => (
                  <div key={i} style={styles.resultItem}>
                    <a href={article.url} target="_blank" rel="noreferrer" style={styles.link}>{article.title}</a>
                    {article.summary && (
                      <p style={styles.summary}>{article.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reddit.length > 0 && (
              <div style={styles.resultSection}>
                <h2 style={styles.resultTitle}>Reddit Reactions</h2>
                {reddit.map((post, i) => (
                  <div key={i} style={styles.resultItem}>
                    <a href={post.url} target="_blank" rel="noreferrer" style={styles.link}>{post.title}</a>
                    <p style={styles.summary}>{post.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
