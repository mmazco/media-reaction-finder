import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import IranPoliticalGraph from './IranPoliticalGraph';
// v2.1.0 - Simplified error message styling

// Trending Topic Reactions Page Component
function TrendingTopicPage({ darkMode, isMobile, navigate, performSearch, setQuery, onFileDownloadClick }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reddit, setReddit] = useState([]);
  const [web, setWeb] = useState([]);
  const [twitter, setTwitter] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Extract topic from URL
  const topic = location.pathname.split('/trending/')[1]?.split('/')[0] || 'iran';
  
  const topicInfo = {
    'iran': {
      title: "What's happening in Iran?",
      description: 'Political landscape and updates on events',
      category: 'Geopolitics'
    },
    'ai-governance': {
      title: 'AI governance & regulation',
      description: 'Policy discussions around artificial intelligence',
      category: 'Technology'
    },
    'climate-tech': {
      title: 'Climate technology',
      description: 'Innovation in renewable energy and sustainability',
      category: 'Climate'
    }
  };
  
  const info = topicInfo[topic] || { title: topic, description: '', category: 'Topic' };
  
  const fetchReactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`/api/trending/${topic}`);
      if (response.ok) {
        const data = await response.json();
        setReddit(data.reddit || []);
        setWeb(data.web || []);
        setTwitter(data.twitter || []);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to fetch reactions');
      }
    } catch (err) {
      console.error('Error fetching trending reactions:', err);
      setError('Failed to fetch reactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchReactions();
  }, [topic]);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: darkMode ? '#000000' : 'rgb(240, 238, 231)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: '0'
    }}>
      {/* CSS Animation for refresh spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: darkMode ? '#000000' : 'rgb(240, 238, 231)',
        padding: isMobile ? '60px 20px 20px 20px' : '20px 30px 20px 70px',
        borderBottom: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              color: darkMode ? '#ffd54f' : '#b8860b',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif'
            }}>
              Trending: {info.category}
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 'normal',
              color: darkMode ? '#fff' : '#1a1a1a',
              margin: 0,
              fontFamily: 'Georgia, serif'
            }}>
              {info.title}
            </h1>
            {info.description && (
              <p style={{
                fontSize: '14px',
                color: darkMode ? '#888' : '#666',
                margin: '6px 0 0',
                fontFamily: 'Arial, sans-serif'
              }}>
                {info.description}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Refresh Button */}
            <button
              onClick={() => fetchReactions(true)}
              disabled={refreshing || loading}
              title="Refresh feed"
              style={{
                padding: '10px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                color: darkMode ? '#888' : '#666',
                border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                borderRadius: '6px',
                cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: refreshing || loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!refreshing && !loading) {
                  e.currentTarget.style.borderColor = darkMode ? '#555' : '#999';
                  e.currentTarget.style.color = darkMode ? '#fff' : '#333';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = darkMode ? '#333' : '#d0d0d0';
                e.currentTarget.style.color = darkMode ? '#888' : '#666';
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none'
                }}
              >
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            
            {topic === 'iran' && (
              <button
                onClick={() => navigate('/trending/iran/graph')}
                style={{
                  padding: '10px 20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: darkMode ? '#ffd54f' : '#b8860b',
                  color: darkMode ? '#000' : '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                View political map (beta)
              </button>
            )}
          </div>
        </div>
        
        {/* Last updated indicator */}
        {lastUpdated && !loading && (
          <div style={{
            fontSize: '11px',
            color: darkMode ? '#555' : '#999',
            marginTop: '8px',
            fontFamily: 'Arial, sans-serif'
          }}>
            Last updated: {lastUpdated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {lastUpdated.toLocaleTimeString()} {new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(lastUpdated).find(p => p.type === 'timeZoneName')?.value}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '30px 20px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `2px solid ${darkMode ? '#333' : '#ddd'}`,
              borderTopColor: darkMode ? '#fff' : '#000',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: darkMode ? '#888' : '#666', fontStyle: 'italic' }}>
              Fetching results from X, Reddit and the web...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: darkMode ? '#e57373' : '#c62828' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Twitter/X Section */}
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'Georgia, serif'
              }}>
                Posts on X
                <span style={{
                  padding: '2px 6px',
                  backgroundColor: darkMode ? '#ffd54f' : '#b8860b',
                  color: darkMode ? '#000' : '#fff',
                  fontSize: '9px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  borderRadius: '3px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  BETA
                </span>
                <span style={{ fontSize: '14px', color: darkMode ? '#666' : '#999', fontWeight: '400', fontFamily: 'Arial, sans-serif' }}>
                  ({twitter.length})
                </span>
              </h2>
              {twitter.length > 0 ? (
                <div>
                  {twitter.map((tweet, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '12px',
                        padding: '15px',
                        backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
                        borderRadius: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1DA1F2',
                          color: '#fff',
                          fontWeight: '500'
                        }}>
                          X
                        </span>
                        {(tweet.created_at_iso || tweet.created_at) && (
                          <span style={{ fontSize: '11px', color: darkMode ? '#777' : '#888', fontFamily: 'Arial, sans-serif' }}>
                            {tweet.created_at_iso
                              ? new Date(tweet.created_at_iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : tweet.created_at}
                          </span>
                        )}
                        <span style={{
                          fontSize: '11px',
                          color: darkMode ? '#999' : '#666',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginLeft: 'auto',
                          whiteSpace: 'nowrap'
                        }}>
                          ❤️ {tweet.likes} · 🔄 {tweet.retweets} · 💬 {tweet.replies}
                        </span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <a 
                          href={tweet.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            color: darkMode ? '#ffffff' : '#000000',
                            textDecoration: 'none',
                            fontSize: '15px',
                            fontWeight: '500',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          {tweet.author_name}
                          <span style={{ fontWeight: '400', color: darkMode ? '#888' : '#666', marginLeft: '6px' }}>
                            @{tweet.author_username}
                          </span>
                        </a>
                      </div>
                      <p style={{
                        marginTop: '8px',
                        color: darkMode ? '#aaa' : '#555',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        margin: 0,
                        fontFamily: 'Arial, sans-serif',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}>
                        {tweet.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: darkMode ? '#666' : '#888' }}>
                  No tweets found. Twitter API may not be configured.
                </p>
              )}
            </div>
            
            {/* Reddit Section */}
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'Georgia, serif'
              }}>
                Reddit discussions
                <span style={{ fontSize: '14px', color: darkMode ? '#666' : '#999', fontWeight: '400', fontFamily: 'Arial, sans-serif' }}>
                  ({reddit.length})
                </span>
              </h2>
              {reddit.length > 0 ? (
                <div>
                  {reddit.map((post, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '12px',
                        padding: '15px',
                        backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
                        borderRadius: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
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
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            color: darkMode ? '#ffffff' : '#000000',
                            textDecoration: 'none',
                            fontSize: '15px',
                            fontWeight: '500',
                            fontFamily: 'Arial, sans-serif'
                          }}
                        >
                          {post.title}
                        </a>
                        {post.num_comments > 0 && (
                          <span style={{
                            fontSize: '11px',
                            color: darkMode ? '#999' : '#666',
                            marginLeft: 'auto',
                            fontStyle: 'italic',
                            whiteSpace: 'nowrap'
                          }}>
                            💬 {post.num_comments} comment{post.num_comments !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {post.summary && !post.summary.startsWith('Discussion with') && !post.summary.startsWith('Reddit discussion') && !post.summary.startsWith('Unable to') && !post.summary.startsWith('Summarization unavailable') && (
                        <p style={{
                          marginTop: '8px',
                          color: darkMode ? '#999' : '#666',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          fontFamily: 'Arial, sans-serif',
                          backgroundColor: darkMode ? '#161616' : '#f0f0f0',
                          padding: '10px 14px',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${darkMode ? '#333' : '#ddd'}`
                        }}>
                          {post.summary}
                        </p>
                      )}
                      {post.top_comments && post.top_comments.length > 0 && (
                        <div style={{ marginTop: '10px', borderLeft: `2px solid ${darkMode ? '#333' : '#ddd'}`, paddingLeft: '12px' }}>
                          {post.top_comments.map((comment, ci) => (
                            <div key={ci} style={{ marginBottom: ci < post.top_comments.length - 1 ? '10px' : 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#ccc' : '#444', fontFamily: 'Arial, sans-serif' }}>
                                  u/{comment.author}
                                </span>
                                <span style={{ fontSize: '11px', color: darkMode ? '#666' : '#999', fontFamily: 'Arial, sans-serif' }}>
                                  {comment.score} pts
                                </span>
                              </div>
                              <p style={{
                                fontSize: '13px',
                                color: darkMode ? '#aaa' : '#555',
                                lineHeight: '1.5',
                                margin: 0,
                                fontFamily: 'Arial, sans-serif',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere'
                              }}>
                                {comment.body}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: darkMode ? '#666' : '#888', fontFamily: 'Arial, sans-serif' }}>
                  No Reddit discussions found.
                </p>
              )}
            </div>
            
            {/* Web Section */}
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'Georgia, serif'
              }}>
                Web articles
                <span style={{ fontSize: '14px', color: darkMode ? '#666' : '#999', fontWeight: '400', fontFamily: 'Arial, sans-serif' }}>
                  ({web.length})
                </span>
              </h2>
              {web.length > 0 ? (
                <div>
                  {web.map((article, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '12px',
                        padding: '15px',
                        backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
                        borderRadius: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#4ECDC4',
                          color: '#fff',
                          fontWeight: '500'
                        }}>
                          Web
                        </span>
                        {article.category_label && (() => {
                          const categoryColors = {
                            'Mainstream Coverage': { bg: '#22c55e', color: '#fff' },
                            'Analysis': { bg: '#7c3aed', color: '#fff' },
                            'Opinion': { bg: '#2563eb', color: '#fff' }
                          };
                          const colors = categoryColors[article.category_label] || { bg: darkMode ? '#2a2a2a' : '#f0f0f0', color: darkMode ? '#ccc' : '#555' };
                          return (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: colors.bg,
                              color: colors.color,
                              fontWeight: '500'
                            }}>
                              {article.category_label}
                            </span>
                          );
                        })()}
                        {article.is_file_download ? (
                          <a 
                            href="#"
                            onClick={(e) => onFileDownloadClick(e, article.url, article.title)}
                            style={{
                              color: darkMode ? '#ffffff' : '#000000',
                              textDecoration: 'none',
                              fontSize: '15px',
                              fontWeight: '500',
                              fontFamily: 'Arial, sans-serif',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span style={{ fontSize: '14px' }} title="This link may download a file">📎</span>
                            {article.title}
                          </a>
                        ) : (
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{
                              color: darkMode ? '#ffffff' : '#000000',
                              textDecoration: 'none',
                              fontSize: '15px',
                              fontWeight: '500',
                              fontFamily: 'Arial, sans-serif'
                            }}
                          >
                            {article.title}
                          </a>
                        )}
                      </div>
                      {article.summary && !article.summary.startsWith('Unable to') && !article.summary.startsWith('Summarization unavailable') && (
                        <p style={{
                          marginTop: '8px',
                          color: darkMode ? '#999' : '#666',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          fontFamily: 'Arial, sans-serif',
                          backgroundColor: darkMode ? '#161616' : '#f0f0f0',
                          padding: '10px 14px',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${darkMode ? '#333' : '#ddd'}`
                        }}>
                          {article.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: darkMode ? '#666' : '#888', fontFamily: 'Arial, sans-serif' }}>
                  No web articles found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [reddit, setReddit] = useState([]);
  const [substack, setSubstack] = useState([]);
  const [article, setArticle] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionArticles, setCollectionArticles] = useState([]);
  const [sidebarTab, setSidebarTab] = useState('collections'); // 'collections' or 'history'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [hasSearched, setHasSearched] = useState(false);
  const [curatedFeed, setCuratedFeed] = useState([]);
  const [curatedIndex, setCuratedIndex] = useState(0);
  const [curatedLoading, setCuratedLoading] = useState(true);
  const [substackAuthors, setSubstackAuthors] = useState([]);
  const [pubCategory, setPubCategory] = useState('All');
  
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    fetch('/api/curated-feed')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setCuratedFeed(data); })
      .catch(() => {})
      .finally(() => setCuratedLoading(false));

    fetch('/api/substack-authors')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setSubstackAuthors(data); })
      .catch(() => {});
  }, []);

  // Meta Commentary state
  const [metaAudio, setMetaAudio] = useState(null);
  const [metaText, setMetaText] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // File download confirmation dialog state
  const [fileDownloadDialog, setFileDownloadDialog] = useState({ show: false, url: '', title: '' });
  
  // Handle file download link click with confirmation
  const handleFileDownloadClick = (e, url, title) => {
    e.preventDefault();
    setFileDownloadDialog({ show: true, url, title });
  };
  
  // Confirm and proceed with file download
  const confirmFileDownload = () => {
    if (fileDownloadDialog.url) {
      window.open(fileDownloadDialog.url, '_blank', 'noopener,noreferrer');
    }
    setFileDownloadDialog({ show: false, url: '', title: '' });
  };
  
  // Cancel file download
  const cancelFileDownload = () => {
    setFileDownloadDialog({ show: false, url: '', title: '' });
  };


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
    const urlParams = new URLSearchParams(location.search);
    const sharedQuery = urlParams.get('q');
    if (sharedQuery && location.pathname === '/') {
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
    setSubstack([]);
    setArticle(null);
    setHasSearched(false);
    setMetaAudio(null);
    setMetaText('');
    setMetaError(null);
    setShowTranscript(false);
    setSelectedCollection(null);
    setCollectionArticles([]);
    navigate('/'); // Navigate to home
  };

  // Check for cached meta commentary
  const checkCachedCommentary = async (articleData) => {
    if (!articleData) return;
    
    try {
      const response = await fetch('/api/meta-commentary/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article: articleData })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.cached && data.audio) {
          console.log('✅ Found cached commentary');
          setMetaText(data.text || '');
          const mimeType = data.mime_type || 'audio/mp3';
          setMetaAudio(`data:${mimeType};base64,${data.audio}`);
        }
      }
    } catch (error) {
      console.log('No cached commentary found');
    }
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
          article: article || { title: query, source: 'Topic Search', summary: '' },
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
    if (searchQuery && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Function to generate shareable URL
  const generateShareableURL = (searchQuery) => {
    const baseURL = window.location.origin;
    return `${baseURL}/?q=${encodeURIComponent(searchQuery)}`;
  };

  // Separate function to perform search (used by both handleSearch and URL parameter loading)
  const performSearch = async (searchQuery, sourcePost = null) => {
    // First, check if we have cached results (for shared links)
    try {
      const cacheCheck = await fetch('/api/reactions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      if (cacheCheck.ok) {
        const cacheData = await cacheCheck.json();
        if (cacheData.cached && cacheData.results) {
          console.log('✅ Using cached search results - no loading UI needed!');
          const data = cacheData.results;
          
          // Set results directly without loading state
          const cleanNews = Array.isArray(data.web) ? data.web : [];
          const cleanReddit = Array.isArray(data.reddit) ? data.reddit : [];
          const cleanSubstack = Array.isArray(data.substack) ? data.substack : [];
          const cleanArticle = data.article && typeof data.article === 'object' ? data.article : null;
          
          setNews(cleanNews);
          setSubstack(cleanSubstack);
          if (sourcePost) {
            const sourceTitle = sourcePost.title.toLowerCase().trim();
            const isDuplicate = cleanReddit.some(r => {
              const t = (r.title || '').toLowerCase().trim();
              return r.url === sourcePost.url || t === sourceTitle || t.includes(sourceTitle) || sourceTitle.includes(t);
            });
            if (!isDuplicate) {
              cleanReddit.unshift(sourcePost);
            } else {
              const idx = cleanReddit.findIndex(r => {
                const t = (r.title || '').toLowerCase().trim();
                return r.url === sourcePost.url || t === sourceTitle || t.includes(sourceTitle) || sourceTitle.includes(t);
              });
              if (idx >= 0) {
                cleanReddit[idx] = { ...cleanReddit[idx], match_type: 'curated_source', summary: cleanReddit[idx].summary || sourcePost.summary, top_comments: cleanReddit[idx].top_comments && cleanReddit[idx].top_comments.length > 0 ? cleanReddit[idx].top_comments : sourcePost.top_comments };
              }
            }
          }
          setReddit(cleanReddit);
          setArticle(cleanArticle);
          setHasSearched(true);
          
          setMetaAudio(null);
          setMetaText('');
          setMetaError(null);
          setShowTranscript(false);
          
          if (cleanNews.length > 0 || cleanReddit.length > 0 || cleanSubstack.length > 0) {
            checkCachedCommentary(cleanArticle || { title: searchQuery, source: 'Topic Search', summary: '' });
          }
          
          return;
        }
      }
    } catch (cacheError) {
      console.log('Cache check failed, proceeding with full search:', cacheError);
    }
    
    // Not cached - show loading UI and perform full search
    setLoading(true);
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, skip_cache: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // Validate and clean the response data
      const cleanNews = Array.isArray(data.web) ? data.web : [];
      const cleanReddit = Array.isArray(data.reddit) ? data.reddit : [];
      const cleanSubstack = Array.isArray(data.substack) ? data.substack : [];
      const cleanArticle = data.article && typeof data.article === 'object' ? data.article : null;
      
      setNews(cleanNews);
      setSubstack(cleanSubstack);
      if (sourcePost) {
        const sourceTitle = sourcePost.title.toLowerCase().trim();
        const isDuplicate = cleanReddit.some(r => {
          const t = (r.title || '').toLowerCase().trim();
          return r.url === sourcePost.url || t === sourceTitle || t.includes(sourceTitle) || sourceTitle.includes(t);
        });
        if (!isDuplicate) {
          cleanReddit.unshift(sourcePost);
        } else {
          const idx = cleanReddit.findIndex(r => {
            const t = (r.title || '').toLowerCase().trim();
            return r.url === sourcePost.url || t === sourceTitle || t.includes(sourceTitle) || sourceTitle.includes(t);
          });
          if (idx >= 0) {
            cleanReddit[idx] = { ...cleanReddit[idx], match_type: 'curated_source', summary: cleanReddit[idx].summary || sourcePost.summary, top_comments: cleanReddit[idx].top_comments && cleanReddit[idx].top_comments.length > 0 ? cleanReddit[idx].top_comments : sourcePost.top_comments };
          }
        }
      }
      setReddit(cleanReddit);
      setArticle(cleanArticle);
      setHasSearched(true);
      
      setMetaAudio(null);
      setMetaText('');
      setMetaError(null);
      setShowTranscript(false);
      
      if (cleanNews.length > 0 || cleanReddit.length > 0 || cleanSubstack.length > 0) {
        checkCachedCommentary(cleanArticle || { title: searchQuery, source: 'Topic Search', summary: '' });
      }
      
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
          substack: cleanSubstack,
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
      justifyContent: 'flex-start',
      padding: '20px',
      paddingLeft: '20px',
      paddingTop: (news.length > 0 || reddit.length > 0 || substack.length > 0 || article) ? 
        (window.innerWidth <= 768 ? '100px' : '80px') : 
        (window.innerWidth <= 768 ? '80px' : '12vh'),
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
      fontSize: window.innerWidth <= 768 ? '32px' : '48px',
      fontWeight: 'normal',
      marginBottom: window.innerWidth <= 768 ? '16px' : '24px',
      marginTop: 0,
      color: baseColors.text,
      fontFamily: 'Georgia, serif',
      cursor: 'pointer',
      transition: 'opacity 0.2s ease'
    },
      subtitle: {
      fontSize: window.innerWidth <= 768 ? '14px' : '16px',
      color: baseColors.textSecondary,
      marginBottom: window.innerWidth <= 768 ? '40px' : '56px',
      fontFamily: 'Arial, sans-serif'
    },
      form: {
      marginBottom: '56px'
    },
      label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '14px',
      textAlign: 'left',
      color: baseColors.text,
      fontFamily: 'Arial, sans-serif'
    },
      input: {
      width: '100%',
      padding: '14px 18px',
      fontSize: '15px',
      border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
      borderRadius: '8px',
      outline: 'none',
      backgroundColor: darkMode ? '#111' : '#fff',
      fontFamily: 'Arial, sans-serif',
      color: darkMode ? '#ddd' : '#333',
      boxSizing: 'border-box'
    },
      button: {
      marginTop: '36px',
      marginBottom: '24px',
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
      fontFamily: 'Arial, sans-serif',
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
      fontSize: '22px',
      fontWeight: 'normal',
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
      fontWeight: '500',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere'
    },
      summary: {
      marginTop: '8px',
      color: darkMode ? '#999' : '#666',
      fontSize: '13px',
      lineHeight: '1.6',
      padding: '8px 12px',
      backgroundColor: darkMode ? '#111' : '#f0f0f0',
      borderRadius: '4px',
      borderLeft: `3px solid ${darkMode ? '#444' : '#ccc'}`,
      fontFamily: 'Arial, sans-serif'
    },
      sidebar: {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: window.innerWidth <= 768 ? '100%' : '300px',
      backgroundColor: baseColors.bg,
      borderRight: window.innerWidth <= 768 ? 'none' : `1px solid ${baseColors.border}`,
      transform: 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      zIndex: 1100,
      padding: '70px 20px 20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
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
      zIndex: 1099
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
      fontSize: '22px',
      fontWeight: 'normal',
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
      fontFamily: 'Arial, sans-serif'
    },
      summaryText: {
      fontSize: '14px',
      color: darkMode ? '#d4d4d4' : '#444',
      lineHeight: '1.6',
      marginTop: '10px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'left'
    },
      shareButton: {
      marginTop: '20px',
      padding: '10px 24px',
      fontSize: '13px',
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(sidebarOpen ? styles.sidebarOpen : {})
      }}>
        {/* Navigation */}
        <div style={{ marginBottom: '20px', borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, paddingBottom: '16px' }}>
          <div
            onClick={() => { setSidebarOpen(false); navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: darkMode ? '#ccc' : '#333', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
            Search
          </div>
          <div
            onClick={() => { setSidebarOpen(false); setSelectedCollection(null); setCollectionArticles([]); navigate('/collections'); }}
            style={{ padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: darkMode ? '#ccc' : '#333', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            Collections
          </div>
          <div
            onClick={toggleDarkMode}
            style={{ padding: '10px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: darkMode ? '#ccc' : '#333', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </div>
        </div>

        {/* Search history */}
        <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', color: darkMode ? '#666' : '#999', marginBottom: '12px', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
          Search history
        </div>
        {searchHistory.length > 0 ? (
          searchHistory.map((item) => (
            <div
              key={item.id}
              onClick={async () => {
                const searchQuery = item.query || item.url;
                setQuery(searchQuery);
                setSidebarOpen(false);
                updateURL(searchQuery);
                if (item.cachedResults) {
                  setNews(item.cachedResults.web || []);
                  setReddit(item.cachedResults.reddit || []);
                  setSubstack(item.cachedResults.substack || []);
                  setArticle(item.cachedResults.article || null);
                } else {
                  setTimeout(() => { performSearch(searchQuery); }, 100);
                }
              }}
              style={{
                padding: '8px 0',
                cursor: 'pointer',
                borderBottom: `1px solid ${darkMode ? '#1a1a1a' : '#f0f0f0'}`,
                fontFamily: 'Arial, sans-serif'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: darkMode ? '#ccc' : '#333',
                lineHeight: '1.4',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: '11px', color: darkMode ? '#555' : '#aaa', marginTop: '2px' }}>
                {item.source}
              </div>
            </div>
          ))
        ) : (
          <div style={{color: darkMode ? '#b3b3b3' : '#666', fontSize: '13px', fontFamily: 'Arial, sans-serif'}}>
            No search history yet
          </div>
        )}

        {/* Footer links */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`, display: 'flex', gap: '16px' }}>
          <a href="https://github.com/mmazco/media-reaction-finder" target="_blank" rel="noreferrer" style={{ color: darkMode ? '#fff' : '#1a1a1a', display: 'flex' }} title="GitHub">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a href="https://x.com/mmazco" target="_blank" rel="noreferrer" style={{ color: darkMode ? '#fff' : '#1a1a1a', display: 'flex' }} title="X">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
        </div>

      {/* Collections Page Overlay */}
      {location.pathname === '/collections' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
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
              fontSize: '22px',
              fontWeight: 'normal',
              fontFamily: 'Georgia, serif',
              color: darkMode ? '#fff' : '#1a1a1a',
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
                  {['palestine', 'iran', 'culture', 'ai', 'politics']
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
                  ← All collections
            </button>
            {selectedCollection.description && (
                  <p style={{
                color: darkMode ? '#999' : '#666',
                    fontSize: '15px',
                    marginBottom: '25px',
                    fontStyle: 'italic',
                    fontFamily: 'Arial, sans-serif'
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
                        {article.summary && !article.summary.startsWith('Unable to') && !article.summary.startsWith('Summarization unavailable') && (
                          <p style={{
                            fontSize: '14px',
                            color: darkMode ? '#aaa' : '#555',
                            lineHeight: '1.6',
                            marginBottom: '16px',
                            fontFamily: 'Arial, sans-serif'
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
                      setSelectedCollection(null);
                      setCollectionArticles([]);
                      navigate(`/?q=${encodeURIComponent(article.url)}`);
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

      {/* Iran Political Graph Page */}
      {location.pathname === '/trending/iran/graph' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: darkMode ? '#000000' : 'rgb(240, 238, 231)',
          zIndex: 1000,
          overflowY: 'auto'
        }}>
          <IranPoliticalGraph darkMode={darkMode} isMobile={isMobile} />
        </div>
      )}

      {/* Trending Topic Reactions Page */}
      {location.pathname.startsWith('/trending/') && !location.pathname.includes('/graph') && (
        <TrendingTopicPage 
          darkMode={darkMode} 
          isMobile={isMobile} 
          navigate={navigate}
          performSearch={performSearch}
          setQuery={setQuery}
          onFileDownloadClick={handleFileDownloadClick}
        />
      )}
      
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <>
          <div
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              zIndex: 1200,
              width: '44px',
              height: '44px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(26,26,26,0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1150
              }}
            />
          )}

          {/* Mobile Slide-out Menu */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '280px',
            backgroundColor: darkMode ? 'rgba(10, 10, 10, 0.92)' : 'rgba(245, 245, 245, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderLeft: `1px solid ${darkMode ? '#222' : '#ddd'}`,
            zIndex: 1160,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease',
            padding: '80px 20px 20px 20px',
            overflowY: 'auto'
          }}>
            {/* Menu Items */}
            <div
              onClick={() => {
                setMobileMenuOpen(false);
                setSidebarOpen(false);
                setSelectedCollection(null);
                setCollectionArticles([]);
                navigate('/');
              }}
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundColor: location.pathname === '/' && !sidebarOpen ? (darkMode ? '#222' : '#e5e5e5') : 'transparent'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#333'} strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span style={{ color: darkMode ? '#fff' : '#333', fontWeight: '500' }}>Search</span>
            </div>

            <div
              onClick={() => {
                setMobileMenuOpen(false);
                if (location.pathname !== '/') {
                  navigate('/');
                  setSelectedCollection(null);
                  setCollectionArticles([]);
                }
                setSidebarOpen(!sidebarOpen);
              }}
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundColor: sidebarOpen ? (darkMode ? '#222' : '#e5e5e5') : 'transparent'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#333'} strokeWidth="2">
                <path d="M3 3v5h5"></path>
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
              </svg>
              <span style={{ color: darkMode ? '#fff' : '#333', fontWeight: '500' }}>Search history</span>
            </div>

            <div
              onClick={() => {
                setMobileMenuOpen(false);
                setSidebarOpen(false);
                setSelectedCollection(null);
                setCollectionArticles([]);
                navigate('/collections');
              }}
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundColor: location.pathname === '/collections' ? (darkMode ? '#222' : '#e5e5e5') : 'transparent'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#fff' : '#333'} strokeWidth="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
              </svg>
              <span style={{ color: darkMode ? '#fff' : '#333', fontWeight: '500' }}>Collections</span>
            </div>

            <div
              onClick={() => {
                setMobileMenuOpen(false);
                toggleDarkMode();
              }}
              style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              <span style={{ color: darkMode ? '#fff' : '#333', fontWeight: '500' }}>
                {darkMode ? 'Light mode' : 'Dark mode'}
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${darkMode ? '#333' : '#ddd'}`, margin: '16px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px' }}>
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.open('https://github.com/mmazco/media-reaction-finder', '_blank');
                }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={darkMode ? '#fff' : '#1a1a1a'}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.open('https://x.com/mmazco', '_blank');
                }}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={darkMode ? '#fff' : '#1a1a1a'}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Menu Toggle Button - Desktop */}
      {!isMobile && (
        <div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            left: '16px',
            top: '16px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '8px',
            zIndex: 1200,
            backgroundColor: darkMode ? '#fff' : '#1a1a1a',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#1a1a1a' : '#fff'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </div>
      )}
      
      {/* Main Content - only show when not on collections page */}
      {location.pathname !== '/collections' && (
      <div style={styles.content}>
        <h1 
          style={{
            ...styles.title,
            marginTop: (news.length > 0 || reddit.length > 0 || substack.length > 0 || article) ? '60px' : '0'
          }}
          onClick={resetToHome}
          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Media Reaction Finder
        </h1>
        <p style={styles.subtitle}>Discover reactions around any published article, media and content across the web and socials</p>
        
        <div style={styles.form}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '16px',
            border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
            backgroundColor: darkMode ? '#111' : '#fff',
            transition: 'border-color 0.2s ease'
          }}>
            <input
              type="text"
              placeholder="Paste a URL or type a topic to discover reactions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: '15px',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: 'Arial, sans-serif',
                color: darkMode ? '#ddd' : '#333'
              }}
            />
            {!loading ? (
              <div
                onClick={handleSearch}
                style={{
                  width: isMobile ? '44px' : '36px',
                  height: isMobile ? '44px' : '36px',
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#fff' : '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#1a1a1a' : '#fff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </div>
            ) : (
              <div style={{
                width: isMobile ? '44px' : '36px',
                height: isMobile ? '44px' : '36px',
                borderRadius: '50%',
                border: `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                borderTop: `2px solid ${darkMode ? '#fff' : '#1a1a1a'}`,
                animation: 'spin 1s linear infinite',
                flexShrink: 0
              }}></div>
            )}
          </div>
          {loading && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <div style={styles.loadingText}>Searching for reactions across the web...</div>
            </div>
          )}
        </div>

        {/* Homepage Feed */}
        {!loading && !hasSearched && !article && news.length === 0 && reddit.length === 0 && substack.length === 0 && (
          <div style={{ width: '100%', maxWidth: '700px', marginTop: '48px', textAlign: 'left' }}>

            {/* Curated topics */}
            <div style={{
              marginBottom: '48px',
              backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <h2 style={{
                fontSize: '22px',
                fontFamily: 'Georgia, serif',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                padding: '16px 16px 12px 16px',
                margin: 0
              }}>
                Curated topics
              </h2>
              {[
                { label: "What's happening in Iran?", action: () => navigate('/trending/iran'), beta: true },
                { label: 'Faith in Silicon Valley', action: () => { const u = 'https://www.vanityfair.com/news/story/christianity-was-borderline-illegal-in-silicon-valley-now-its-the-new-religion'; setQuery(u); updateURL(u); performSearch(u); } },
                { label: 'AI & decentralized governance', action: () => { const u = 'https://blog.cosmos-institute.org/p/coasean-bargaining-at-scale'; setQuery(u); updateURL(u); performSearch(u); } },
                { label: 'Machines of loving grace', action: () => { const u = 'https://darioamodei.com/machines-of-loving-grace'; setQuery(u); updateURL(u); performSearch(u); } }
              ].map((item, i, arr) => (
                <div key={i} onClick={item.action} style={{
                  padding: '14px 16px',
                  borderBottom: i < arr.length - 1 ? `1px solid ${darkMode ? '#2a2a2a' : '#eee'}` : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s ease'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#252525' : '#f0f0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#888' : '#666'} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    <span style={{ fontSize: '14px', color: darkMode ? '#ccc' : '#333', fontWeight: '500', fontFamily: 'Arial, sans-serif' }}>{item.label}</span>
                    {item.beta && <span style={{ padding: '2px 6px', backgroundColor: darkMode ? '#ffd54f' : '#b8860b', color: darkMode ? '#000' : '#fff', fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px', borderRadius: '3px', fontFamily: 'Arial, sans-serif' }}>BETA</span>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#666' : '#999'} strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              ))}
            </div>

            {/* Loading state for curated feed */}
            {curatedLoading && curatedFeed.length === 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
                borderRadius: '5px',
                marginBottom: '32px'
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: `2px solid ${darkMode ? '#333' : '#ddd'}`,
                  borderTop: `2px solid ${darkMode ? '#888' : '#666'}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '14px',
                  color: darkMode ? '#888' : '#666',
                  fontFamily: 'Arial, sans-serif',
                  fontStyle: 'italic'
                }}>
                  Loading top discussions from Reddit...
                </span>
              </div>
            )}

            {/* Curated Subreddit Feed — one at a time */}
            {curatedFeed.length > 0 && (() => {
              const subredditDescriptions = {
                'worldnews': 'Breaking international news and current affairs from around the globe',
                'CriticalTheory': 'Philosophy, cultural critique, and deep analysis of society and power',
                'AI_Agents': 'Building, deploying, and discussing autonomous AI systems',
                'PredictionsMarkets': 'Forecasting events through prediction markets and collective intelligence'
              };
              const channel = curatedFeed[curatedIndex % curatedFeed.length];
              const desc = subredditDescriptions[channel.subreddit] || '';
              return (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{
                      fontSize: '22px',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 'normal',
                      color: darkMode ? '#fff' : '#1a1a1a',
                      margin: 0
                    }}>
                      Top discussions
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {curatedFeed.map((ch, ci) => (
                        <button
                          key={ci}
                          onClick={() => setCuratedIndex(ci)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontFamily: 'Arial, sans-serif',
                            border: `1px solid ${ci === curatedIndex % curatedFeed.length ? (darkMode ? '#fff' : '#1a1a1a') : (darkMode ? '#333' : '#ddd')}`,
                            borderRadius: '4px',
                            backgroundColor: ci === curatedIndex % curatedFeed.length ? (darkMode ? '#fff' : '#1a1a1a') : 'transparent',
                            color: ci === curatedIndex % curatedFeed.length ? (darkMode ? '#1a1a1a' : '#fff') : (darkMode ? '#888' : '#666'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {desc && (
                    <p style={{
                      fontSize: '13px',
                      color: darkMode ? '#bbb' : '#444',
                      fontFamily: 'Arial, sans-serif',
                      margin: '0 0 20px',
                      lineHeight: '1.4'
                    }}>
                      {desc}
                    </p>
                  )}

                  <div style={{
                    backgroundColor: darkMode ? '#1e1e1e' : '#f8f8f8',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    {channel.posts.filter(p => p.num_comments > 0).map((post, pi, filteredArr) => (
                      <div key={pi} style={{
                        padding: '15px',
                        borderBottom: pi < filteredArr.length - 1 ? `1px solid ${darkMode ? '#2a2a2a' : '#eee'}` : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#FF6B6B',
                            color: '#fff',
                            fontWeight: '500'
                          }}>
                            Reddit
                          </span>
                          {post.num_comments > 0 && (
                            <span style={{
                              fontSize: '11px',
                              color: darkMode ? '#999' : '#666',
                              fontStyle: 'italic',
                              whiteSpace: 'nowrap'
                            }}>
                              💬 {post.num_comments} comment{post.num_comments !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div>
                          <a
                            href={post.url}
                            onClick={(e) => {
                              e.preventDefault();
                              const source = {
                                title: post.title,
                                url: post.url,
                                score: post.score,
                                num_comments: post.num_comments,
                                summary: post.summary || '',
                                top_comments: post.top_comments || [],
                                match_type: 'curated_source',
                                type: 'Reddit'
                              };
                              setQuery(post.title);
                              updateURL(post.title);
                              performSearch(post.title, source);
                            }}
                            style={{...styles.link}}
                          >
                            {post.title}
                          </a>
                        </div>
                        {post.top_comments && post.top_comments.length > 0 && (
                          <div style={{ marginTop: '10px', borderLeft: `2px solid ${darkMode ? '#333' : '#ddd'}`, paddingLeft: '12px' }}>
                            {post.top_comments.map((comment, ci) => (
                              <div key={ci} style={{ marginBottom: ci < post.top_comments.length - 1 ? '10px' : 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#ccc' : '#444' }}>
                                    u/{comment.author}
                                  </span>
                                  <span style={{ fontSize: '11px', color: darkMode ? '#666' : '#999' }}>
                                    {comment.score} pts
                                  </span>
                                </div>
                                <p style={{
                                  fontSize: '13px',
                                  color: darkMode ? '#aaa' : '#555',
                                  lineHeight: '1.5',
                                  margin: 0,
                                  wordBreak: 'break-word',
                                  overflowWrap: 'anywhere'
                                }}>
                                  {comment.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Featured Publications */}
            {substackAuthors.length > 0 && (() => {
              const categories = ['All', 'News', 'Tech', 'Culture'];
              const filtered = pubCategory === 'All' ? substackAuthors : substackAuthors.filter(a => a.category === pubCategory);
              return (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{
                    fontSize: '22px',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 'normal',
                    color: darkMode ? '#fff' : '#1a1a1a',
                    margin: 0
                  }}>
                    Featured publications
                    <span style={{ padding: '2px 6px', marginLeft: '8px', backgroundColor: darkMode ? '#ffd54f' : '#b8860b', color: darkMode ? '#000' : '#fff', fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px', borderRadius: '3px', fontFamily: 'Arial, sans-serif' }}>BETA</span>
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPubCategory(cat)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontFamily: 'Arial, sans-serif',
                          border: `1px solid ${cat === pubCategory ? (darkMode ? '#fff' : '#1a1a1a') : (darkMode ? '#333' : '#ddd')}`,
                          borderRadius: '4px',
                          backgroundColor: cat === pubCategory ? (darkMode ? '#fff' : '#1a1a1a') : 'transparent',
                          color: cat === pubCategory ? (darkMode ? '#1a1a1a' : '#fff') : (darkMode ? '#888' : '#666'),
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: darkMode ? '#bbb' : '#444',
                  fontFamily: 'Arial, sans-serif',
                  margin: '0 0 16px',
                  lineHeight: '1.4'
                }}>
                  Independent voices covering tech, politics and culture
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filtered.map((author) => (
                    <div
                      key={author.handle}
                      style={{
                        display: 'flex',
                        gap: isMobile ? '12px' : '16px',
                        padding: isMobile ? '14px' : '16px',
                        backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
                        borderRadius: '8px',
                        border: `1px solid ${darkMode ? '#333' : '#d0d0d0'}`,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = darkMode ? '#222' : '#efefef'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = darkMode ? '#1a1a1a' : '#f5f5f5'; }}
                    >
                      <a href={author.profile_url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, textDecoration: 'none' }}>
                        {author.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt={author.name}
                            style={{
                              width: isMobile ? '44px' : '48px',
                              height: isMobile ? '44px' : '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              display: 'block',
                              border: `1px solid ${darkMode ? '#333' : '#ddd'}`
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          width: isMobile ? '44px' : '48px',
                          height: isMobile ? '44px' : '48px',
                          borderRadius: '50%',
                          backgroundColor: '#FF6719',
                          display: author.avatar_url ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '18px',
                          fontWeight: '700',
                          fontFamily: 'Georgia, serif'
                        }}>
                          {author.name.charAt(0)}
                        </div>
                      </a>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <a
                            href={author.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: darkMode ? '#fff' : '#1a1a1a',
                              textDecoration: 'none',
                              fontFamily: 'Arial, sans-serif'
                            }}
                            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                          >
                            {author.name}
                          </a>
                          <span style={{ fontSize: '12px', color: darkMode ? '#666' : '#999', fontFamily: 'Arial, sans-serif' }}>
                            @{author.handle}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '13px',
                          color: darkMode ? '#aaa' : '#555',
                          fontFamily: 'Arial, sans-serif',
                          lineHeight: '1.4',
                          margin: '0 0 8px',
                          wordBreak: 'break-word'
                        }}>
                          {author.bio}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: author.latest_post ? '10px' : 0 }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            backgroundColor: '#FF6719',
                            color: '#fff',
                            fontWeight: '500',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {author.publication}
                          </span>
                          {author.subscribers && (
                            <span style={{
                              fontSize: '11px',
                              color: darkMode ? '#666' : '#999',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {author.subscribers} subscribers
                            </span>
                          )}
                          {author.leaderboard && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: darkMode ? '#1a2e1a' : '#e6f4e6',
                              color: darkMode ? '#6dca6d' : '#2d7d2d',
                              fontWeight: '500',
                              fontFamily: 'Arial, sans-serif'
                            }}>
                              {author.leaderboard}
                            </span>
                          )}
                        </div>

                        {author.latest_post && (
                          <a
                            href={author.latest_post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '8px 12px',
                              backgroundColor: darkMode ? '#252525' : '#fff',
                              borderRadius: '6px',
                              border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                              textDecoration: 'none',
                              transition: 'border-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FF6719'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = darkMode ? '#333' : '#e0e0e0'; }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '13px',
                                color: darkMode ? '#ccc' : '#333',
                                fontWeight: '500',
                                fontFamily: 'Arial, sans-serif',
                                lineHeight: '1.4',
                                wordBreak: 'break-word'
                              }}>
                                {author.latest_post.title}
                              </div>
                              {author.latest_post.date && (
                                <div style={{
                                  fontSize: '11px',
                                  color: darkMode ? '#555' : '#aaa',
                                  fontFamily: 'Arial, sans-serif',
                                  marginTop: '2px'
                                }}>
                                  {new Date(author.latest_post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#666' : '#999'} strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"></polyline></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })()}

          </div>
        )}

        {/* No results empty state */}
        {!loading && hasSearched && news.length === 0 && reddit.length === 0 && substack.length === 0 && !article && (
          <div style={{
            width: '100%',
            maxWidth: '700px',
            marginTop: '40px',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '16px'
            }}>
              No reactions found
            </div>
            <p style={{
              fontSize: '15px',
              color: darkMode ? '#888' : '#666',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              We couldn't find any discussions or news coverage for this search. Try pasting a different article URL or searching for a broader topic.
            </p>
          </div>
        )}

        {/* Article Summary - Also show for any URL that was searched */}
        {(article || (query.startsWith('http') && (news.length > 0 || reddit.length > 0 || substack.length > 0))) && (
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
            {article && article.summary && !article.summary.startsWith('Unable to') && !article.summary.startsWith('Summarization unavailable') && (
              <div style={{
                ...styles.summaryText,
                color: darkMode ? '#999' : '#666'
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
        {(news.length > 0 || reddit.length > 0 || substack.length > 0) && (
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
                fontSize: '22px',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                fontFamily: 'Georgia, serif'
              }}>
                Meta commentary
              </span>
            </div>
            
            <p style={{
              fontSize: '13px',
              color: darkMode ? '#bbb' : '#444',
              marginBottom: '15px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4'
            }}>
              Generate an audio analysis of your content - what people are saying, key themes, and broader implications.
            </p>
            
            {/* Disclaimer */}
            <div style={{
              fontSize: '11px',
              color: darkMode ? '#999' : '#666',
              marginBottom: '15px',
              padding: '8px 12px',
              backgroundColor: darkMode ? '#111' : '#f0f0f0',
              borderRadius: '4px',
              borderLeft: `3px solid ${darkMode ? '#444' : '#ccc'}`,
              fontFamily: 'Arial, sans-serif'
            }}>
              ⚠️ AI-generated analysis may contain inaccuracies. Please verify any specific claims or attributions.
            </div>
            
            {!metaAudio && !metaLoading && !metaText && (
              <button
                onClick={generateMetaCommentary}
                style={{
                  padding: '12px 24px',
                  fontSize: '13px',
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
                Generate commentary
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
                  Generating commentary...
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
                  {showTranscript ? '▼' : '▶'} {showTranscript ? 'Hide' : 'Show'} transcript
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
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    {metaText}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(news.length > 0 || reddit.length > 0 || substack.length > 0) && (
          <div style={styles.results}>
            {/* Split Reddit results by match type */}
            {(() => {
              const directReactions = reddit.filter(r => r.match_type === 'url_exact' && r.num_comments > 0);
              const topicReddit = reddit.filter(r => r.match_type !== 'url_exact');
              const filteredTopicReddit = topicReddit.filter(r => r.match_type === 'curated_source' || r.num_comments > 0);
              const topicDiscussions = [
                ...filteredTopicReddit.map(post => ({ ...post, type: 'Reddit' })),
                ...substack.map(item => ({ ...item, type: 'Substack' })),
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
                        Direct reactions
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
                        color: darkMode ? '#bbb' : '#444',
                        marginBottom: '15px',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.4'
                      }}>
                        Posts that directly link to or discuss this specific article
                      </p>
                      {directReactions.map((item, i) => (
                        <div key={`direct-${i}`} style={styles.resultItem}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap'}}>
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#FF6B6B',
                              color: '#fff',
                              fontWeight: '500',
                              flexShrink: 0
                            }}>
                              Reddit
                            </span>
                            <a href={item.url} target="_blank" rel="noreferrer" style={{...styles.link, flex: 1, minWidth: 0}}>{item.title}</a>
                            {item.num_comments > 0 && (
                              <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#999' : '#666',
                                marginLeft: 'auto',
                                fontStyle: 'italic',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                💬 {item.num_comments} comment{item.num_comments !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {item.summary && !item.summary.startsWith('Discussion with') && !item.summary.startsWith('Unable to') && !item.summary.startsWith('Summarization unavailable') && (
                            <p style={styles.summary}>{item.summary}</p>
                          )}
                          {item.top_comments && item.top_comments.length > 0 && (
                            <div style={{ marginTop: '10px', borderLeft: `2px solid ${darkMode ? '#333' : '#ddd'}`, paddingLeft: '12px' }}>
                              {item.top_comments.map((comment, ci) => (
                                <div key={ci} style={{ marginBottom: ci < item.top_comments.length - 1 ? '10px' : 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#ccc' : '#444' }}>
                                      u/{comment.author}
                                    </span>
                                    <span style={{ fontSize: '11px', color: darkMode ? '#666' : '#999' }}>
                                      {comment.score} pts
                                    </span>
                                  </div>
                                  <p style={{
                                    fontSize: '13px',
                                    color: darkMode ? '#aaa' : '#555',
                                    lineHeight: '1.5',
                                    margin: 0,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                  }}>
                                    {comment.body}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state: no Reddit discussions */}
                  {reddit.length === 0 && news.length > 0 && (
                    <div style={{
                      padding: '16px 20px',
                      backgroundColor: darkMode ? '#1a1a1a' : '#f8f8f8',
                      borderRadius: '6px',
                      marginBottom: '20px',
                      border: `1px solid ${darkMode ? '#2a2a2a' : '#eee'}`
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: darkMode ? '#888' : '#777',
                        margin: 0
                      }}>
                        No Reddit discussions found for this article. Try searching for a broader topic to find community conversations.
                      </p>
                    </div>
                  )}

                  {/* Empty state: no web articles */}
                  {news.length === 0 && substack.length === 0 && reddit.length > 0 && (
                    <div style={{
                      padding: '16px 20px',
                      backgroundColor: darkMode ? '#1a1a1a' : '#f8f8f8',
                      borderRadius: '6px',
                      marginBottom: '20px',
                      border: `1px solid ${darkMode ? '#2a2a2a' : '#eee'}`
                    }}>
                      <p style={{
                        fontSize: '14px',
                        color: darkMode ? '#888' : '#777',
                        margin: 0
                      }}>
                        No related web articles found. The search returned Reddit discussions only.
                      </p>
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
                        Topic discussions
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
                        color: darkMode ? '#bbb' : '#444',
                        marginBottom: '15px',
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: '1.4'
                      }}>
                        Broader conversations about the topic
                      </p>
                      {topicDiscussions.map((item, i) => (
                        <div key={`topic-${i}`} style={styles.resultItem}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', flexWrap: 'wrap'}}>
                            <span style={{
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: item.type === 'Substack' ? '#FF6719' : item.type === 'Web' ? '#4ECDC4' : '#FF6B6B',
                              color: '#fff',
                              fontWeight: '500'
                            }}>
                              {item.type}
                            </span>
                            {item.match_type === 'curated_source' && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: darkMode ? '#333' : '#1a1a1a',
                                color: '#fff',
                                fontWeight: '500'
                              }}>
                                Source
                              </span>
                            )}
                            {item.category_label && (() => {
                              const categoryColors = {
                                'Mainstream Coverage': { bg: '#22c55e', color: '#fff' },
                                'Analysis': { bg: '#7c3aed', color: '#fff' },
                                'Opinion': { bg: '#2563eb', color: '#fff' }
                              };
                              const colors = categoryColors[item.category_label] || { bg: darkMode ? '#2a2a2a' : '#f0f0f0', color: darkMode ? '#ccc' : '#555' };
                              return (
                                <span style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  backgroundColor: colors.bg,
                                  color: colors.color,
                                  fontWeight: '500'
                                }}>
                                  {item.category_label}
                                </span>
                              );
                            })()}
                            {item.is_file_download ? (
                              <a 
                                href="#" 
                                onClick={(e) => handleFileDownloadClick(e, item.url, item.title)}
                                style={{...styles.link, flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px'}}
                              >
                                <span style={{ fontSize: '14px' }} title="This link may download a file">📎</span>
                                {item.title}
                              </a>
                            ) : (
                              <a href={item.url} target="_blank" rel="noreferrer" style={{...styles.link, flex: 1, minWidth: 0}}>{item.title}</a>
                            )}
                            {item.type === 'Reddit' && item.num_comments > 0 && (
                              <span style={{
                                fontSize: '11px',
                                color: darkMode ? '#999' : '#666',
                                marginLeft: 'auto',
                                fontStyle: 'italic',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}>
                                💬 {item.num_comments} comment{item.num_comments !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {item.summary && !item.summary.startsWith('Discussion with') && !item.summary.startsWith('Unable to') && !item.summary.startsWith('Summarization unavailable') && (
                            <p style={styles.summary}>{item.summary}</p>
                          )}
                          {item.type === 'Reddit' && item.top_comments && item.top_comments.length > 0 && (
                            <div style={{ marginTop: '10px', borderLeft: `2px solid ${darkMode ? '#333' : '#ddd'}`, paddingLeft: '12px' }}>
                              {item.top_comments.map((comment, ci) => (
                                <div key={ci} style={{ marginBottom: ci < item.top_comments.length - 1 ? '10px' : 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#ccc' : '#444' }}>
                                      u/{comment.author}
                                    </span>
                                    <span style={{ fontSize: '11px', color: darkMode ? '#666' : '#999' }}>
                                      {comment.score} pts
                                    </span>
                                  </div>
                                  <p style={{
                                    fontSize: '13px',
                                    color: darkMode ? '#aaa' : '#555',
                                    lineHeight: '1.5',
                                    margin: 0,
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                  }}>
                                    {comment.body}
                                  </p>
                                </div>
                              ))}
                            </div>
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
                Share results
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
      )}
      
      {/* File Download Confirmation Dialog */}
      {fileDownloadDialog.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: darkMode ? '1px solid #333' : '1px solid #ddd'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '28px' }}>📎</span>
              <h3 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 'normal',
                color: darkMode ? '#fff' : '#1a1a1a',
                fontFamily: 'Georgia, serif'
              }}>
                File download link
              </h3>
            </div>
            <p style={{
              color: darkMode ? '#b3b3b3' : '#666',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              This link may download a file directly to your device:
            </p>
            <p style={{
              color: darkMode ? '#4ECDC4' : '#0066cc',
              fontSize: '13px',
              wordBreak: 'break-all',
              padding: '10px',
              backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
              borderRadius: '6px',
              marginBottom: '16px',
              fontFamily: 'monospace'
            }}>
              {fileDownloadDialog.title || fileDownloadDialog.url}
            </p>
            <p style={{
              color: darkMode ? '#ff9800' : '#d35400',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span>Downloaded files may contain security risks. Only proceed if you trust the source.</span>
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelFileDownload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #444' : '1px solid #ccc',
                  backgroundColor: 'transparent',
                  color: darkMode ? '#b3b3b3' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmFileDownload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#000',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Download Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
