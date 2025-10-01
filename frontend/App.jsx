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
  const [showCopyNotification, setShowCopyNotification] = useState(false);


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

    // Check for URL parameters on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const sharedQuery = urlParams.get('q');
    if (sharedQuery) {
      const decodedQuery = decodeURIComponent(sharedQuery);
      setQuery(decodedQuery);
      // Automatically perform search for shared URL
      setTimeout(() => {
        performSearch(decodedQuery);
      }, 100);
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

  // Function to update URL with search query
  const updateURL = (searchQuery) => {
    const url = new URL(window.location);
    if (searchQuery && searchQuery.trim()) {
      url.searchParams.set('q', encodeURIComponent(searchQuery));
    } else {
      url.searchParams.delete('q');
    }
    window.history.pushState({}, '', url);
  };

  // Function to generate shareable URL
  const generateShareableURL = (searchQuery) => {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?q=${encodeURIComponent(searchQuery)}`;
  };

  // Separate function to perform search (used by both handleSearch and URL parameter loading)
  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Validate and clean the response data
      const cleanNews = Array.isArray(data.web) ? data.web : [];
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
          query: searchQuery,
          searchedAt: new Date().toISOString()
        };
      } else if (searchQuery.trim() && (data.web?.length > 0 || data.reddit?.length > 0)) {
        // Text search or URL search without full metadata
        if (searchQuery.startsWith('http')) {
          // URL search without full article metadata - try to extract domain for better display
          try {
            const url = new URL(searchQuery);
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
              url: searchQuery,
              query: searchQuery,
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
              url: searchQuery,
              query: searchQuery,
              searchedAt: new Date().toISOString()
            };
          }
        } else {
          // Text search with results
          historyItem = {
            id: Date.now(),
            title: searchQuery.length > 40 ? searchQuery.substring(0, 40) + '...' : searchQuery,
            source: 'Search Query',
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            url: searchQuery,
            query: searchQuery,
            searchedAt: new Date().toISOString()
          };
        }
      }
      
      if (historyItem) {
        // Store the complete results with the history item
        historyItem.cachedResults = {
          web: cleanNews,
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

  // Main search handler that updates URL and performs search
  const handleSearch = async () => {
    if (!query.trim()) return;
    
    // Update URL with search query
    updateURL(query);
    
    // Perform the actual search
    await performSearch(query);
  };

  // Function to handle sharing - always copy to clipboard
  const handleShare = async () => {
    if (!query.trim()) return;
    
    const shareableURL = generateShareableURL(query);
    
    try {
      // Always copy to clipboard instead of using native share
      await navigator.clipboard.writeText(shareableURL);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (error) {
      // If clipboard API fails, fallback to manual copy
      console.error('Copy to clipboard failed:', error);
      try {
        // Create a temporary input element to copy the URL
        const tempInput = document.createElement('input');
        tempInput.value = shareableURL;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 2000);
      } catch (fallbackError) {
        console.error('All copy methods failed:', fallbackError);
        // Show error message if all methods fail
        alert('Unable to copy link. Please copy manually: ' + shareableURL);
      }
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
      justifyContent: (news.length > 0 || reddit.length > 0 || article) ? 'flex-start' : 'center',
      padding: '20px',
      paddingTop: (news.length > 0 || reddit.length > 0 || article) ? 
        (window.innerWidth <= 768 ? '100px' : '80px') : '20px',
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
    },
      shareButton: {
      marginTop: '20px',
      padding: '10px 24px',
      fontSize: '11px',
      letterSpacing: '1px',
      fontWeight: '600',
      backgroundColor: darkMode ? '#333' : '#f0f0f0',
      color: darkMode ? '#fff' : '#333',
      border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
      cursor: 'pointer',
      fontFamily: 'Arial, sans-serif',
      transition: 'all 0.2s ease',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center'
    },
      shareContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '20px'
    },
      copyNotification: {
      fontSize: '12px',
      color: darkMode ? '#4da6ff' : '#0066cc',
      marginTop: '8px',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },
      copyNotificationVisible: {
      opacity: 1
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
                  const searchQuery = item.query || item.url;
                  setQuery(searchQuery);
                  setSidebarOpen(false);
                  
                  // Update URL when loading from history
                  updateURL(searchQuery);
                  
                  // Restore cached results if available
                  if (item.cachedResults) {
                    setNews(item.cachedResults.web || []);
                    setReddit(item.cachedResults.reddit || []);
                    setArticle(item.cachedResults.article || null);
                  } else {
                    // Fallback: trigger a new search for older items without cache
                    setTimeout(() => {
                      performSearch(searchQuery);
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
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#999' : '#666',
            marginTop: '8px',
            fontStyle: 'italic',
            textAlign: 'left',
            lineHeight: '1.4'
          }}>
            💡 Note: Some premium publications (WSJ, NYT, etc.) may require subscriptions to access content.
            Try publicly accessible articles for best results.
          </div>
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
              <div style={{
                ...styles.summaryText,
                ...(article.error ? {
                  color: darkMode ? '#ff9999' : '#cc0000',
                  fontStyle: 'italic',
                  padding: '10px',
                  backgroundColor: darkMode ? '#2a1a1a' : '#fff5f5',
                  border: `1px solid ${darkMode ? '#4a2a2a' : '#ffcccc'}`,
                  borderRadius: '4px'
                } : {})
              }}>
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
              {/* Combine web and reddit results (backend already filters same domain) */}
              {[
                ...news.map(article => ({
                  ...article,
                  type: 'Web'
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
                      backgroundColor: item.type === 'Web' ? '#4ECDC4' : '#FF6B6B',
                      color: '#fff',
                      fontWeight: '500'
                    }}>
                      {item.type}
                    </span>
                    <a href={item.url} target="_blank" rel="noreferrer" style={styles.link}>{item.title}</a>
                    {item.type === 'Reddit' && item.num_comments > 0 && (
                      <span style={{
                        fontSize: '11px',
                        color: darkMode ? '#999' : '#666',
                        marginLeft: 'auto',
                        fontStyle: 'italic'
                      }}>
                        💬 {item.num_comments} comment{item.num_comments !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {item.summary && (
                    <p style={styles.summary}>{item.summary}</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Share functionality */}
            <div style={styles.shareContainer}>
              <button 
                onClick={handleShare}
                style={styles.shareButton}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#444' : '#e0e0e0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = darkMode ? '#333' : '#f0f0f0';
                }}
              >
                <span>🔗</span>
                SHARE RESULTS
              </button>
              <div style={{
                ...styles.copyNotification,
                ...(showCopyNotification ? styles.copyNotificationVisible : {})
              }}>
                Link copied to clipboard!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
