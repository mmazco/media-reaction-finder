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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  // Analytics functions
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/analytics/dashboard?days=30');
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
    if (!showAnalytics && !analyticsData) {
      fetchAnalytics();
    }
  };

  // Category color mapping
  const getCategoryColor = (category) => {
    const colors = {
      'news': '#FF6B6B',
      'music': '#4ECDC4',
      'culture': '#45B7D1',
      'tech': '#96CEB4',
      'entertainment': '#FFEAA7',
      'sports': '#DDA0DD',
      'politics': '#FD79A8',
      'science': '#6C5CE7',
      'business': '#FDCB6E',
      'general': '#A0A0A0',
      'unknown': '#D3D3D3'
    };
    return colors[category] || colors['general'];
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Validate and clean the response data
      const cleanNews = Array.isArray(data.news) ? data.news : [];
      const cleanReddit = Array.isArray(data.reddit) ? data.reddit : [];
      const cleanArticle = data.article && typeof data.article === 'object' ? data.article : null;
      
      setNews(cleanNews);
      setReddit(cleanReddit);
      setArticle(cleanArticle);
      console.log('Article set to:', cleanArticle); // Debug log
      
      // Save to search history - for URLs use article data, for text queries create basic entry
      let historyItem = null;
      
      if (cleanArticle) {
        // URL search with article metadata
        historyItem = {
          id: Date.now(),
          title: cleanArticle.title,
          source: cleanArticle.source,
          date: cleanArticle.date,
          url: cleanArticle.url,
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
          news: cleanNews,
          reddit: cleanReddit,
          article: cleanArticle
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
      bg: 'rgb(31, 30, 29)',
      cardBg: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      border: '#333333',
      accent: '#ffffff'
    } : {
      bg: 'rgb(240, 238, 231)',
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
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '5px',
      transition: 'all 0.2s ease'
    },
    toggleSwitch: {
      position: 'relative',
      width: '40px',
      height: '20px',
      backgroundColor: darkMode ? '#ffffff' : '#1a1a1a',
      borderRadius: '10px',
      padding: '2px',
      transition: 'all 0.2s ease'
    },
    toggleKnob: {
      width: '16px',
      height: '16px',
      backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
      borderRadius: '50%',
      position: 'absolute',
      left: darkMode ? '22px' : '2px',
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
        style={{
          ...styles.archiveLabel,
          left: '120px'  // Position it next to ARCHIVE button with some spacing
        }}
        onClick={toggleAnalytics}
        onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? '#333' : '#333'}
        onMouseLeave={(e) => e.target.style.backgroundColor = darkMode ? '#ffffff' : '#1a1a1a'}
      >
        ANALYTICS
      </div>
      
      <div style={styles.darkModeToggle} onClick={toggleDarkMode}>
        <div style={styles.toggleSwitch}>
          <div style={styles.toggleKnob}></div>
        </div>
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
            <div style={styles.resultSection}>
              <h2 style={styles.resultTitle}>Related Content</h2>
              {/* Filter out the origin URL from news results and combine with reddit results */}
              {[
                ...news.filter(article => article.url !== query).map(article => ({
                  ...article,
                  type: 'News'
                })),
                ...reddit.map(post => ({
                  ...post,
                  type: 'Reddit'
                }))
              ].map((item, i) => (
                <div key={i} style={styles.resultItem}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.type === 'News' ? '#4ECDC4' : '#FF6B6B',
                      color: '#fff',
                      fontWeight: '500'
                    }}>
                      {item.type}
                    </span>
                    <a href={item.url} target="_blank" rel="noreferrer" style={styles.link}>{item.title}</a>
                  </div>
                  {item.summary && (
                    <p style={styles.summary}>{item.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 2000
            }}
            onClick={() => setShowAnalytics(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
              border: `1px solid ${darkMode ? '#333' : '#ddd'}`,
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              zIndex: 2001,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                margin: 0,
                color: darkMode ? '#ffffff' : '#1a1a1a',
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif'
              }}>
                Search Analytics
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: darkMode ? '#ffffff' : '#1a1a1a',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            {analyticsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  display: 'inline-block',
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '15px', color: darkMode ? '#b3b3b3' : '#666', fontFamily: 'Arial, sans-serif' }}>
                  Loading analytics...
                </p>
              </div>
            ) : analyticsData ? (
              <div>
                {/* Quick Stats */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    padding: '20px 40px',
                    backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                    borderRadius: '12px',
                    textAlign: 'center',
                    minWidth: '250px'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#1a1a1a', fontFamily: 'Arial, sans-serif' }}>
                      {analyticsData.overall_stats.total_searches || 0}
                    </div>
                    <div style={{ fontSize: '16px', color: darkMode ? '#b3b3b3' : '#666', fontFamily: 'Arial, sans-serif', marginTop: '5px' }}>
                      Total no. of searches analyzed
                    </div>
                  </div>
                </div>

                {/* Category Statistics */}
                {analyticsData.category_stats && analyticsData.category_stats.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: '18px',
                      marginBottom: '15px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Search Categories
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      {analyticsData.category_stats.slice(0, 8).map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: index < analyticsData.category_stats.length - 1 ? `1px solid ${darkMode ? '#333' : '#ddd'}` : 'none'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: getCategoryColor(item.category),
                              marginRight: '8px'
                            }}></span>
                            <span style={{ 
                              color: darkMode ? '#ffffff' : '#1a1a1a',
                              fontSize: '14px',
                              textTransform: 'capitalize',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {item.category}
                            </span>
                          </div>
                          <span style={{ 
                            color: darkMode ? '#b3b3b3' : '#666',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {item.result_count} results
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches with Categories */}
                {analyticsData.categorized_searches && analyticsData.categorized_searches.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: '18px',
                      marginBottom: '15px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Search History
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                      borderRadius: '8px',
                      padding: '15px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {analyticsData.categorized_searches.slice(0, 20).flatMap((search, index) => 
                        search.results && search.results.length > 0 ? search.results.map((result, resultIndex) => (
                          <div key={`${index}-${resultIndex}`} style={{
                            padding: '12px 0',
                            borderBottom: `1px solid ${darkMode ? '#333' : '#ddd'}`
                          }}>
                            <div style={{ 
                              color: darkMode ? '#ffffff' : '#1a1a1a',
                              fontSize: '14px',
                              fontWeight: '500',
                              marginBottom: '6px',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {result.title || 'No title'}
                            </div>
                            
                            {result.url && (
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: darkMode ? '#4A9EFF' : '#0066CC',
                                  textDecoration: 'none',
                                  fontSize: '13px',
                                  fontFamily: 'Arial, sans-serif',
                                  display: 'block',
                                  marginBottom: '6px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              >
                                {result.url}
                              </a>
                            )}
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px' }}>
                              {result.source && (
                                <span style={{ 
                                  color: darkMode ? '#b3b3b3' : '#666',
                                  fontFamily: 'Arial, sans-serif'
                                }}>
                                  📄 {result.source}
                                </span>
                              )}
                              {result.category && (
                                <span style={{ 
                                  color: darkMode ? '#b3b3b3' : '#666',
                                  fontFamily: 'Arial, sans-serif'
                                }}>
                                  🏷️ {result.category}
                                </span>
                              )}
                              {result.subcategory && (
                                <span style={{ 
                                  color: darkMode ? '#b3b3b3' : '#666',
                                  fontFamily: 'Arial, sans-serif'
                                }}>
                                  📂 {result.subcategory}
                                </span>
                              )}
                            </div>
                          </div>
                        )) : []
                      )}
                    </div>
                  </div>
                )}



                {/* Source Distribution */}
                {analyticsData.source_distribution && analyticsData.source_distribution.length > 0 && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ 
                      color: darkMode ? '#ffffff' : '#1a1a1a',
                      fontSize: '18px',
                      marginBottom: '15px',
                      fontFamily: 'Arial, sans-serif'
                    }}>
                      Source Distribution
                    </h3>
                    <div style={{
                      backgroundColor: darkMode ? '#2a2a2a' : '#f8f8f8',
                      borderRadius: '8px',
                      padding: '15px'
                    }}>
                      {analyticsData.source_distribution.slice(0, 10).map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: index < Math.min(analyticsData.source_distribution.length - 1, 9) ? `1px solid ${darkMode ? '#333' : '#ddd'}` : 'none'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: '#4ECDC4',
                              marginRight: '8px'
                            }}></span>
                            <span style={{ 
                              color: darkMode ? '#ffffff' : '#1a1a1a',
                              fontSize: '14px',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {item.source}
                            </span>
                          </div>
                          <span style={{ 
                            color: darkMode ? '#b3b3b3' : '#666',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {item.result_count} results
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Section */}
                <div style={{ marginTop: '25px' }}>
                  <h3 style={{ 
                    color: darkMode ? '#ffffff' : '#1a1a1a',
                    fontSize: '18px',
                    marginBottom: '15px',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    Export Data
                  </h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => exportData('json')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: darkMode ? '#333' : '#f0f0f0',
                        color: darkMode ? '#ffffff' : '#1a1a1a',
                        border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => exportData('csv')}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: darkMode ? '#333' : '#f0f0f0',
                        color: darkMode ? '#ffffff' : '#1a1a1a',
                        border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: darkMode ? '#b3b3b3' : '#666', fontFamily: 'Arial, sans-serif' }}>
                  No analytics data available yet. Start searching to see your analytics!
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
