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
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionArticles, setCollectionArticles] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('collections'); // 'collections' or 'history'
  const [showCollectionsPage, setShowCollectionsPage] = useState(false); // Collections page view
  
  // Meta Commentary state
  const [metaAudio, setMetaAudio] = useState(null);
  const [metaText, setMetaText] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);


  // Function to delete history items
  const deleteHistoryItem = (id, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Fetch curated collections from API
  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  // Fetch articles for a specific collection
  const fetchCollectionArticles = async (tag) => {
    try {
      const response = await fetch(`/api/collections/${tag}`);
      if (response.ok) {
        const data = await response.json();
        setCollectionArticles(data.articles || []);
        setSelectedCollection(data.collection);
      }
    } catch (error) {
      console.error('Error fetching collection articles:', error);
    }
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

    // Fetch curated collections
    fetchCollections();

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

  // Reset to home state
  const resetToHome = () => {
    setQuery('');
    setNews([]);
    setReddit([]);
    setArticle(null);
    setMetaAudio(null);
    setMetaText('');
    setMetaError(null);
    setShowTranscript(false);
    updateURL(''); // Clear URL parameters
  };

  // Generate meta commentary audio
  const generateMetaCommentary = async () => {
    setMetaLoading(true);
    setMetaError(null);
    setMetaAudio(null);
    setMetaText('');
    
    try {
      const response = await fetch('/api/meta-commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: article,
          web: news,
          reddit: reddit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error && !data.audio) {
        setMetaError(data.error);
        if (data.text) {
          setMetaText(data.text);
        }
      } else {
        setMetaText(data.text || '');
        if (data.audio) {
          const mimeType = data.mime_type || 'audio/mp3';
          setMetaAudio(`data:${mimeType};base64,${data.audio}`);
        }
      }
    } catch (error) {
      console.error('Error generating meta commentary:', error);
      setMetaError('Failed to generate commentary. Please try again.');
    } finally {
      setMetaLoading(false);
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
      bg: '#000000',
      cardBg: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#999999',
      border: '#333333',
      accent: '#ffffff',
      accentAlt: '#cccccc'
    } : {
      bg: 'rgb(240, 238, 231)',
      cardBg: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      border: '#d0d0d0',
      accent: '#000000',
      accentAlt: '#333333'
    };

    return {
      container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: (news.length > 0 || reddit.length > 0 || article) ? 'flex-start' : 'center',
      padding: '20px',
      paddingLeft: '76px', // Account for left sidebar (56px + 20px)
      paddingTop: (news.length > 0 || reddit.length > 0 || article) ? 
        (window.innerWidth <= 768 ? '100px' : '80px') : '20px',
      position: 'relative',
      backgroundColor: baseColors.bg,
      color: baseColors.text
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
      fontFamily: 'Georgia, serif',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease'
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
      backgroundColor: darkMode ? '#ffffff' : '#000000',
      color: darkMode ? '#000000' : '#ffffff',
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
      border: `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
      borderTop: `2px solid ${darkMode ? '#fff' : '#000'}`,
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
      color: darkMode ? '#ffffff' : '#000000',
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
      left: '56px',
      height: '100vh',
      width: '320px',
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
      left: '56px',
      width: 'calc(100vw - 56px)',
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
      
      {/* History Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {})
      }}>
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

      {/* Collections Page Overlay */}
      {showCollectionsPage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: '56px',
          width: 'calc(100vw - 56px)',
          height: '100vh',
          backgroundColor: darkMode ? '#000000' : 'rgb(240, 238, 231)',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '0'
        }}>
          {/* Collections Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: darkMode ? '#000000' : 'rgb(240, 238, 231)',
            padding: '20px 30px',
            borderBottom: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              fontFamily: 'Georgia, serif',
              color: darkMode ? '#fff' : '#000',
              margin: 0
            }}>
              {selectedCollection ? selectedCollection.display_name : 'Collections'}
            </h2>
          </div>

          {/* Collections Content */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '30px 20px',
            position: 'relative'
          }}>
            {!selectedCollection ? (
              /* Collections List */
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '16px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {['palestine', 'culture', 'ai', 'internet', 'politics']
                    .map(tag => collections.find(c => c.tag.toLowerCase() === tag))
                    .filter(Boolean)
                    .map((collection) => (
                <div
                  key={collection.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchCollectionArticles(collection.tag);
                      }}
                  style={{
                        padding: '24px',
                        backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                        borderRadius: '8px',
                        border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        zIndex: 1
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = darkMode 
                          ? '0 8px 24px rgba(0,0,0,0.4)' 
                          : '0 8px 24px rgba(0,0,0,0.1)';
                        e.currentTarget.style.borderColor = darkMode ? '#444' : '#bbb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                      }}
                    >
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: darkMode ? '#fff' : '#000',
                        marginBottom: '8px',
                        fontFamily: 'Arial, sans-serif'
                      }}>
                        {collection.display_name}
                    </div>
                      <div style={{
                        fontSize: '13px',
                        color: darkMode ? '#999' : '#666',
                        marginBottom: '12px',
                        fontStyle: 'italic'
                      }}>
                        {collection.description}
                  </div>
                      <div style={{
                        fontSize: '12px',
                        color: darkMode ? '#666' : '#999',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        {collection.article_count} article{collection.article_count !== 1 ? 's' : ''}
                </div>
              </div>
                  ))}
                </div>
              </>
            ) : (
              /* Articles in Collection */
          <>
            <button
              onClick={() => {
                setSelectedCollection(null);
                setCollectionArticles([]);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: darkMode ? '#999' : '#666',
                cursor: 'pointer',
                fontSize: '13px',
                    marginBottom: '20px',
                    padding: '0',
                display: 'flex',
                alignItems: 'center',
                    gap: '6px'
              }}
            >
                  ← All Collections
            </button>
            {selectedCollection.description && (
                  <p style={{
                color: darkMode ? '#999' : '#666',
                    fontSize: '15px',
                    marginBottom: '25px',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif'
              }}>
                {selectedCollection.description}
                  </p>
            )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
            {collectionArticles.length > 0 ? (
              collectionArticles.map((article) => (
                <div
                  key={article.id}
                        style={{
                          padding: '20px 24px',
                          backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                          borderRadius: '8px',
                          border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = darkMode ? '#444' : '#bbb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                        }}
                      >
                        {article.recommended && (
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: darkMode ? '#2d4a3e' : '#e8f5e9',
                            color: darkMode ? '#81c784' : '#2e7d32',
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginBottom: '10px',
                            fontFamily: 'Arial, sans-serif',
                            textTransform: 'uppercase'
                          }}>
                            ★ Recommended
                          </div>
                        )}
                        <div style={{
                          fontSize: '17px',
                          fontWeight: '600',
                          color: darkMode ? '#fff' : '#000',
                          marginBottom: '8px',
                          lineHeight: '1.4',
                          fontFamily: 'Georgia, serif'
                        }}>
                          {article.title}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '10px',
                          flexWrap: 'wrap'
                        }}>
                          {article.source && (
                            <span style={{
                              fontSize: '13px',
                              color: darkMode ? '#4da6ff' : '#0066cc',
                              fontWeight: '500'
                            }}>
                              {article.source}
                            </span>
                          )}
                          {article.authors && (
                            <>
                              <span style={{color: darkMode ? '#555' : '#ccc'}}>•</span>
                              <span style={{
                                fontSize: '13px',
                                color: darkMode ? '#888' : '#666'
                              }}>
                                {article.authors}
                              </span>
                            </>
                          )}
                          {article.date && (
                            <>
                              <span style={{color: darkMode ? '#555' : '#ccc'}}>•</span>
                              <span style={{
                                fontSize: '12px',
                                color: darkMode ? '#666' : '#888',
                                fontStyle: 'italic'
                              }}>
                                {article.date}
                              </span>
                            </>
                          )}
                        </div>
                        {article.summary && (
                          <p style={{
                            fontSize: '14px',
                            color: darkMode ? '#aaa' : '#555',
                            lineHeight: '1.6',
                            marginBottom: '16px',
                            fontFamily: 'Georgia, serif'
                          }}>
                            {article.summary.length > 200 
                              ? article.summary.substring(0, 200) + '...' 
                              : article.summary}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <button
                    onClick={() => {
                      setQuery(article.url);
                              setShowCollectionsPage(false);
                              setSelectedCollection(null);
                              setCollectionArticles([]);
                      updateURL(article.url);
                      performSearch(article.url);
                    }}
                            style={{
                              padding: '10px 20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              letterSpacing: '0.5px',
                              backgroundColor: darkMode ? '#fff' : '#000',
                              color: darkMode ? '#000' : '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'Arial, sans-serif',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.85';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            VIEW REACTIONS
                          </button>
                          <button
                            onClick={() => window.open(article.url, '_blank')}
                            style={{
                              padding: '10px 20px',
                        fontSize: '12px',
                              fontWeight: '600',
                              letterSpacing: '0.5px',
                              backgroundColor: 'transparent',
                              color: darkMode ? '#999' : '#666',
                              border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'Arial, sans-serif',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = darkMode ? '#666' : '#999';
                              e.currentTarget.style.color = darkMode ? '#fff' : '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = darkMode ? '#444' : '#ccc';
                              e.currentTarget.style.color = darkMode ? '#999' : '#666';
                            }}
                          >
                            VIEW ORIGINAL
                          </button>
                  </div>
                </div>
              ))
            ) : (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: darkMode ? '#666' : '#888',
                      fontStyle: 'italic'
                    }}>
                No articles in this collection yet
              </div>
            )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Left Icon Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '56px',
        backgroundColor: darkMode ? '#0a0a0a' : '#1a1a1a',
        borderRight: `1px solid ${darkMode ? '#222' : '#333'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '16px',
        zIndex: 1001,
        gap: '4px'
      }}>
        {/* Search Icon */}
        <div 
          onClick={() => {
            // Close any open views first
            setSidebarOpen(false);
            setShowCollectionsPage(false);
            setSelectedCollection(null);
            setCollectionArticles([]);
            // Scroll to top and focus search input
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
              document.querySelector('input[type="text"]')?.focus();
            }, 100);
          }}
                  style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
        </div>

        {/* History Icon (Clock with counterclockwise arrow) */}
        <div 
          onClick={() => {
            // Close collections page if open
            setShowCollectionsPage(false);
            setSelectedCollection(null);
            setCollectionArticles([]);
            // Toggle history sidebar
            setSidebarOpen(!sidebarOpen);
          }}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Search History"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M12 7v5l4 2"></path>
          </svg>
        </div>

        {/* Bookmark/Collections Icon */}
        <div 
          onClick={() => {
            // Close history sidebar if open
            setSidebarOpen(false);
            // Toggle collections page
            if (showCollectionsPage) {
              setShowCollectionsPage(false);
              setSelectedCollection(null);
              setCollectionArticles([]);
                      } else {
              setShowCollectionsPage(true);
            }
          }}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Collections"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
                  </div>

        {/* Dark Mode Icon */}
        <div 
          onClick={toggleDarkMode}
                    style={{
            width: '40px',
            height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        )}
      </div>
      
        {/* GitHub Icon */}
        <div 
          onClick={() => window.open('https://github.com/mmazco/media-reaction-finder', '_blank')}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="GitHub"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#888">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
      </div>
      
      <div style={styles.content}>
        <h1 
          style={{
            ...styles.title,
            marginTop: (news.length > 0 || reddit.length > 0 || article) ? '60px' : '0'
          }}
          onClick={resetToHome}
          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Media Reaction Finder
        </h1>
        <p style={styles.subtitle}>Discover reactions around any published article, media and content across the web and socials</p>
        
        {/* Search Examples Section */}
        {!loading && !article && news.length === 0 && reddit.length === 0 && (
          <div style={{
            marginBottom: '40px',
            marginTop: '40px',
            width: '100%',
            maxWidth: '700px'
          }}>
            <div style={{
              fontSize: '11px',
              color: darkMode ? '#666' : '#999',
              marginBottom: '16px',
              fontWeight: '600',
              letterSpacing: '1px',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}>
              Search Examples
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Example 1: News */}
              <div
                onClick={() => {
                  const exampleUrl = 'https://www.vanityfair.com/news/story/christianity-was-borderline-illegal-in-silicon-valley-now-its-the-new-religion';
                  setQuery(exampleUrl);
                  updateURL(exampleUrl);
                  performSearch(exampleUrl);
                }}
                style={{
                  padding: '14px 20px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                  border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#555' : '#999';
                  e.currentTarget.style.backgroundColor = darkMode ? '#252525' : '#eee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                  e.currentTarget.style.backgroundColor = darkMode ? '#1a1a1a' : '#f5f5f5';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: darkMode ? '#888' : '#666',
                  marginBottom: '4px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  News
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: darkMode ? '#fff' : '#000',
                  fontFamily: 'Georgia, serif'
                }}>
                  Faith in Silicon Valley
                </div>
              </div>

              {/* Example 2: Blog */}
              <div
                onClick={() => {
                  const exampleUrl = 'https://outsidetext.substack.com/p/how-does-a-blind-model-see-the-earth';
                  setQuery(exampleUrl);
                  updateURL(exampleUrl);
                  performSearch(exampleUrl);
                }}
                style={{
                  padding: '14px 20px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                  border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#555' : '#999';
                  e.currentTarget.style.backgroundColor = darkMode ? '#252525' : '#eee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                  e.currentTarget.style.backgroundColor = darkMode ? '#1a1a1a' : '#f5f5f5';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: darkMode ? '#888' : '#666',
                  marginBottom: '4px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Blog
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: darkMode ? '#fff' : '#000',
                  fontFamily: 'Georgia, serif'
                }}>
                  Blind Model & Earth
                </div>
              </div>

              {/* Example 3: Essay */}
              <div
                onClick={() => {
                  const exampleUrl = 'https://darioamodei.com/machines-of-loving-grace';
                  setQuery(exampleUrl);
                  updateURL(exampleUrl);
                  performSearch(exampleUrl);
                }}
                style={{
                  padding: '14px 20px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                  border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#555' : '#999';
                  e.currentTarget.style.backgroundColor = darkMode ? '#252525' : '#eee';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                  e.currentTarget.style.backgroundColor = darkMode ? '#1a1a1a' : '#f5f5f5';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '400',
                  color: darkMode ? '#888' : '#666',
                  marginBottom: '4px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Essay
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: darkMode ? '#fff' : '#000',
                  fontFamily: 'Georgia, serif'
                }}>
                  Machines of Loving Grace
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div style={styles.form}>
          <label style={styles.label}>Insert URL or Topic</label>
          <input
            type="text"
            placeholder="https://example.com/article or search topic"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div style={{
            fontSize: '14px',
            color: darkMode ? '#999' : '#666',
            marginTop: '8px',
            fontStyle: 'italic',
            textAlign: 'left',
            lineHeight: '1.5'
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



        {/* Meta Commentary Section */}
        {(news.length > 0 || reddit.length > 0) && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#000'} strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: darkMode ? '#fff' : '#000',
                fontFamily: 'Georgia, serif'
              }}>
                Meta Commentary
              </span>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: darkMode ? '#999' : '#666',
              marginBottom: '15px',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif'
            }}>
              Generate an AI audio analysis of the discourse around this content - what people are saying, key themes, and broader implications.
            </p>
            
            {!metaAudio && !metaLoading && !metaText && (
              <button
                onClick={generateMetaCommentary}
                style={{
                  padding: '12px 24px',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  fontWeight: '600',
                  backgroundColor: darkMode ? '#fff' : '#000',
                  color: darkMode ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                GENERATE COMMENTARY
              </button>
            )}
            
            {metaLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                  borderTop: `2px solid ${darkMode ? '#fff' : '#000'}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{
                  fontSize: '14px',
                  color: darkMode ? '#999' : '#666',
                  fontStyle: 'italic'
                }}>
                  Generating meta commentary...
                </span>
              </div>
            )}
            
            {metaError && (
              <div style={{
                padding: '12px',
                backgroundColor: darkMode ? '#2a1a1a' : '#fff5f5',
                border: `1px solid ${darkMode ? '#4a2a2a' : '#ffcccc'}`,
                borderRadius: '6px',
                color: darkMode ? '#ff9999' : '#cc0000',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                {metaError}
              </div>
            )}
            
            {metaAudio && (
              <div style={{ marginBottom: '15px' }}>
                <audio 
                  controls 
                  src={metaAudio}
                  style={{
                    width: '100%',
                    height: '40px',
                    borderRadius: '6px'
                  }}
                />
              </div>
            )}
            
            {metaText && (
              <div>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: darkMode ? '#4da6ff' : '#0066cc',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {showTranscript ? '▼' : '▶'} {showTranscript ? 'Hide' : 'Show'} Transcript
                </button>
                {showTranscript && (
                  <div style={{
                    marginTop: '12px',
                    padding: '15px',
                    backgroundColor: darkMode ? '#0d0d0d' : '#fff',
                    borderRadius: '6px',
                    border: `1px solid ${darkMode ? '#222' : '#e0e0e0'}`,
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: darkMode ? '#ccc' : '#444',
                    fontFamily: 'Georgia, serif'
                  }}>
                    {metaText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(news.length > 0 || reddit.length > 0) && (
          <div style={styles.results}>
            {/* Split Reddit results by match type */}
            {(() => {
              const directReactions = reddit.filter(r => r.match_type === 'url_exact');
              const topicReddit = reddit.filter(r => r.match_type !== 'url_exact');
              const topicDiscussions = [
                ...topicReddit.map(post => ({ ...post, type: 'Reddit' })),
                ...news.map(article => ({ ...article, type: 'Web' }))
              ];
              
              return (
                <>
                  {/* Direct Reactions Section */}
                  {directReactions.length > 0 && (
                    <div style={styles.resultSection}>
                      <h2 style={{
                        ...styles.resultTitle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        Direct Reactions
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: darkMode ? '#666' : '#999',
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          ({directReactions.length})
                        </span>
                      </h2>
                      <p style={{
                        fontSize: '13px',
                        color: darkMode ? '#888' : '#777',
                        marginBottom: '15px',
                        fontStyle: 'italic'
                      }}>
                        Posts that directly link to or discuss this specific article
                      </p>
                      {directReactions.map((item, i) => (
                        <div key={`direct-${i}`} style={styles.resultItem}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#FF6B6B',
                              color: '#fff',
                              fontWeight: '500'
                            }}>
                              Reddit
                            </span>
                            <a href={item.url} target="_blank" rel="noreferrer" style={styles.link}>{item.title}</a>
                            {item.num_comments > 0 && (
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
                  )}

                  {/* Topic Discussions Section */}
                  {topicDiscussions.length > 0 && (
                    <div style={styles.resultSection}>
                      <h2 style={{
                        ...styles.resultTitle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        Topic Discussions
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: darkMode ? '#666' : '#999',
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          ({topicDiscussions.length})
                        </span>
                      </h2>
                      <p style={{
                        fontSize: '13px',
                        color: darkMode ? '#888' : '#777',
                        marginBottom: '15px',
                        fontStyle: 'italic'
                      }}>
                        Broader conversations about the topic
                      </p>
                      {topicDiscussions.map((item, i) => (
                        <div key={`topic-${i}`} style={styles.resultItem}>
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
                  )}
                </>
              );
            })()}
            
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
