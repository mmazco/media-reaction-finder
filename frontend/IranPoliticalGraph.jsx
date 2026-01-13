import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Prediction market data - linked to entities
const predictionMarkets = [
  {
    id: 'khamenei-out-jan31',
    title: 'Khamenei out as Supreme Leader by January 31?',
    probability: 21,
    previousProb: 18,
    volume: '$20.5M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-january-31',
    linkedEntities: ['khamenei', 'mojtaba', 'hassan_k', 'assembly'],
    trend: 'up',
  },
  {
    id: 'khamenei-out-2026',
    title: 'Khamenei out as Supreme Leader by Dec 31, 2026?',
    probability: 61,
    previousProb: 52,
    volume: '$283K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxkhameneiout/ali-khamenei-out/kxkhameneiout-akha',
    linkedEntities: ['khamenei', 'mojtaba', 'hassan_k', 'assembly'],
    trend: 'up',
  },
  {
    id: 'regime-fall-2026',
    title: 'Will the Iranian regime fall before 2027?',
    probability: 54,
    previousProb: 48,
    volume: '$1.74M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-the-iranian-regime-fall-by-the-end-of-2026',
    linkedEntities: ['khamenei', 'irgc', 'pezeshkian', 'ghalibaf'],
    trend: 'up',
  },
  {
    id: 'us-strikes-iran',
    title: 'US strikes Iran by January 31, 2026?',
    probability: 66,
    previousProb: 55,
    volume: '$18.7M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/us-strikes-iran-by',
    linkedEntities: ['trump', 'israel', 'irgc', 'khamenei'],
    trend: 'up',
  },
  {
    id: 'pahlavi-visit',
    title: 'Will Reza Pahlavi enter Iran before September?',
    probability: 57,
    previousProb: 34,
    volume: '$1.8K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxpahlavivisita/will-reza-pahlavi-enter-iran-before-september/kxpahlavivisita',
    linkedEntities: ['pahlavi'],
    trend: 'up',
  },
  {
    id: 'us-recognize-pahlavi',
    title: 'Will the United States recognize Reza Pahlavi?',
    probability: 36,
    previousProb: 28,
    volume: '$1.2K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxrecogpersoniran/recognize-reza-pahlavi/kxrecogpersoniran-26',
    linkedEntities: ['pahlavi', 'trump'],
    trend: 'up',
  },
  {
    id: 'next-supreme-leader',
    title: "Who will be Khamenei's successor?",
    probability: null,
    volume: '$2.3K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxnextiranleader/who-will-be-khameneis-successor/kxnextiranleader-45jan01',
    linkedEntities: ['mojtaba', 'hassan_k', 'arafi', 'khamenei'],
    candidates: [
      { name: 'Mojtaba Khamenei', prob: 25 },
      { name: 'Gholam-Hossein M.', prob: 23 },
    ],
    trend: 'stable',
  },
  {
    id: 'iran-nuclear-deal',
    title: 'US-Iran nuclear deal this year?',
    probability: 49,
    previousProb: 35,
    volume: '$1.5K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxusairanagreement/us-iran-nuclear-deal/kxusairanagreement-27',
    linkedEntities: ['trump', 'khamenei', 'pezeshkian'],
    trend: 'up',
  },
  {
    id: 'strait-hormuz',
    title: 'Will Iran close the Strait of Hormuz?',
    probability: 31,
    previousProb: 22,
    volume: '$4.1K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxclosehormuz/strait-of-hormuz/kxclosehormuz-27jan',
    linkedEntities: ['irgc', 'khamenei'],
    trend: 'up',
  },
];

const nodes = [
  // Opposition / External Candidates
  { id: 'pahlavi', label: 'Reza Pahlavi', group: 'opposition', x: 150, y: 200, description: 'Exiled son of the last Shah, in the US since 1978. Most visible diaspora opposition figure. Advocates for referendum on Iran\'s future. Has no political party or verified organizational presence inside Iran. Actual domestic support unclear.', influence: 'medium' },
  { id: 'rajavi', label: 'Maryam Rajavi', group: 'opposition', x: 100, y: 350, description: 'NCRI President-elect, leads parliament-in-exile. Has 10-point plan backed by US Congress members. MEK/NCRI is controversial with limited verified support inside Iran.', influence: 'low' },
  { id: 'tajzadeh', label: 'Mostafa Tajzadeh', group: 'reformist', x: 300, y: 120, description: 'Imprisoned reformist at Evin Prison, former Deputy Interior Minister. Advocates constituent assembly and peaceful transition. Publishes political analysis via Telegram. Intellectually active but operationally constrained.', influence: 'low' },
  { id: 'mousavi', label: 'Mir-Hossein Mousavi', group: 'reformist', x: 400, y: 200, description: 'Green Movement leader (2009), under house arrest since 2011. Called for referendum to end clerical rule in 2023. Symbolic figure but severely constrained after 14 years of isolation.', influence: 'low' },
  
  // Current Regime
  { id: 'khamenei', label: 'Ali Khamenei', group: 'regime', x: 550, y: 280, description: 'Supreme Leader of Iran since 1989. 86 years old. Holds ultimate authority over military, judiciary, and major state decisions under Iran\'s constitutional structure.', influence: 'critical' },
  { id: 'pezeshkian', label: 'Masoud Pezeshkian', group: 'regime', x: 450, y: 380, description: 'President of Iran since 2024. Reformist-aligned. Executive authority is constitutionally subordinate to the Supreme Leader.', influence: 'medium' },
  { id: 'ghalibaf', label: 'Mohammad Ghalibaf', group: 'regime', x: 650, y: 180, description: 'Speaker of the Iranian Parliament. Former mayor of Tehran and IRGC commander. Considered a conservative political figure.', influence: 'high' },
  
  // Succession Candidates
  { id: 'mojtaba', label: 'Mojtaba Khamenei', group: 'succession', x: 700, y: 350, description: 'Son of Supreme Leader Ali Khamenei. Mid-ranking cleric. Has never held formal government position but is considered influential within the system.', influence: 'medium' },
  { id: 'hassan_k', label: 'Hassan Khomeini', group: 'succession', x: 600, y: 450, description: 'Grandson of Ayatollah Ruhollah Khomeini, founder of the Islamic Republic. Cleric based in Qom. Generally associated with reformist positions.', influence: 'medium' },
  { id: 'arafi', label: 'Alireza Arafi', group: 'succession', x: 750, y: 260, description: 'Deputy Chairman of the Assembly of Experts. Member of the Guardian Council. Friday prayer leader of Qom.', influence: 'medium' },
  
  // External Actors
  { id: 'trump', label: 'Donald Trump', group: 'external', x: 200, y: 480, description: 'President of the United States. Has issued public statements regarding Iran protests and authorized military strikes on Iranian nuclear facilities in 2025.', influence: 'high' },
  { id: 'israel', label: 'Benjamin Netanyahu', group: 'external', x: 320, y: 520, description: 'Prime Minister of Israel. Has overseen military operations against Iran and Iranian-backed groups during ongoing regional conflict.', influence: 'high' },
  { id: 'irgc', label: 'IRGC', group: 'regime', x: 500, y: 180, description: 'Islamic Revolutionary Guard Corps. Branch of Iran\'s military reporting directly to the Supreme Leader. Also involved in economic and intelligence activities.', influence: 'critical' },
  
  // Organizations
  { id: 'ncri', label: 'NCRI / MEK', group: 'opposition', x: 80, y: 420, description: 'National Council of Resistance of Iran. Parliament-in-exile led by Rajavi. Controversial, limited internal support.', influence: 'low' },
  { id: 'assembly', label: 'Assembly of Experts', group: 'regime', x: 750, y: 450, description: 'Body of 88 elected clerics constitutionally responsible for selecting, monitoring, and if necessary dismissing the Supreme Leader.', influence: 'medium' },
];

const edges = [
  { source: 'pahlavi', target: 'trump', label: 'Seeks support', type: 'diplomatic' },
  { source: 'pahlavi', target: 'israel', label: 'Israeli backing', type: 'alliance' },
  { source: 'pahlavi', target: 'rajavi', label: 'Rivalry', type: 'conflict' },
  { source: 'rajavi', target: 'ncri', label: 'Leads', type: 'control' },
  { source: 'rajavi', target: 'trump', label: 'Congressional support', type: 'diplomatic' },
  { source: 'tajzadeh', target: 'mousavi', label: 'Allied', type: 'alliance' },
  { source: 'tajzadeh', target: 'pezeshkian', label: 'Critical of', type: 'conflict' },
  { source: 'mousavi', target: 'khamenei', label: 'House arrest', type: 'conflict' },
  { source: 'khamenei', target: 'pezeshkian', label: 'Controls', type: 'control' },
  { source: 'khamenei', target: 'irgc', label: 'Commands', type: 'control' },
  { source: 'khamenei', target: 'mojtaba', label: 'Son', type: 'family' },
  { source: 'khamenei', target: 'assembly', label: 'Succession', type: 'succession' },
  { source: 'ghalibaf', target: 'irgc', label: 'Allied', type: 'alliance' },
  { source: 'ghalibaf', target: 'khamenei', label: 'Reports to', type: 'hierarchy' },
  { source: 'irgc', target: 'pezeshkian', label: 'Constrains', type: 'control' },
  { source: 'mojtaba', target: 'assembly', label: 'Candidate', type: 'succession' },
  { source: 'hassan_k', target: 'assembly', label: 'Candidate', type: 'succession' },
  { source: 'arafi', target: 'assembly', label: 'Member', type: 'succession' },
  { source: 'arafi', target: 'khamenei', label: 'Confidant', type: 'alliance' },
  { source: 'trump', target: 'khamenei', label: 'Threatens', type: 'conflict' },
  { source: 'israel', target: 'irgc', label: 'War', type: 'conflict' },
  { source: 'israel', target: 'khamenei', label: 'Assassination threat', type: 'conflict' },
];

const groupColors = {
  opposition: { bg: '#1a472a', border: '#2d5a3d', text: '#4ade80' },
  reformist: { bg: '#2a3f5f', border: '#3d5a7f', text: '#60a5fa' },
  regime: { bg: '#4a1a1a', border: '#6a2a2a', text: '#f87171' },
  succession: { bg: '#4a3a1a', border: '#6a5a2a', text: '#fbbf24' },
  external: { bg: '#3a1a4a', border: '#5a2a6a', text: '#c084fc' },
};

const edgeColors = {
  alliance: '#4caf50',
  conflict: '#f44336',
  control: '#ff9800',
  diplomatic: '#2196f3',
  family: '#e91e63',
  succession: '#ffd54f',
  hierarchy: '#9e9e9e',
};

const PlatformLogo = ({ platform }) => {
  if (platform === 'polymarket') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#1652F0"/>
        <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#00D26A"/>
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">K</text>
    </svg>
  );
};

const TrendArrow = ({ trend }) => {
  if (trend === 'up') return <span style={{ color: '#4caf50', marginLeft: 4 }}>↑</span>;
  if (trend === 'down') return <span style={{ color: '#f44336', marginLeft: 4 }}>↓</span>;
  return <span style={{ color: '#666', marginLeft: 4 }}>→</span>;
};

const MarketCard = ({ market, isHighlighted, compact = false, darkMode = true }) => {
  const change = market.previousProb ? market.probability - market.previousProb : 0;
  
  const cardBg = darkMode ? '#1a1a1a' : '#f5f5f5';
  const cardBorder = darkMode ? '#333' : '#d0d0d0';
  const highlightBg = darkMode ? 'rgba(255, 213, 79, 0.1)' : 'rgba(184, 134, 11, 0.1)';
  const highlightBorder = darkMode ? '#ffd54f' : '#b8860b';
  const textColor = darkMode ? '#e0e0e0' : '#333';
  const mutedColor = darkMode ? '#888' : '#666';
  const faintColor = darkMode ? '#555' : '#999';
  const accent = darkMode ? '#ffd54f' : '#b8860b';
  
  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: compact ? '10px 12px' : '14px 16px',
        background: isHighlighted ? highlightBg : cardBg,
        border: `1px solid ${isHighlighted ? highlightBorder : cardBorder}`,
        marginBottom: '8px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = mutedColor;
        e.currentTarget.style.background = darkMode ? 'rgba(40, 40, 50, 0.9)' : '#eee';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHighlighted ? highlightBorder : cardBorder;
        e.currentTarget.style.background = isHighlighted ? highlightBg : cardBg;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <PlatformLogo platform={market.platform} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? '11px' : '12px',
            color: textColor,
            lineHeight: 1.4,
            marginBottom: '6px',
            fontFamily: 'Arial, sans-serif',
          }}>
            {market.title}
          </div>
          
          {market.probability !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: compact ? '18px' : '22px',
                fontWeight: 600,
                color: market.probability > 50 ? '#4caf50' : market.probability > 30 ? accent : '#e57373',
                fontFamily: "Arial, sans-serif",
              }}>
                {market.probability}%
              </div>
              {change !== 0 && (
                <div style={{
                  fontSize: '11px',
                  color: change > 0 ? '#4caf50' : '#f44336',
                  fontFamily: "Arial, sans-serif",
                }}>
                  {change > 0 ? '+' : ''}{change}%
                  <TrendArrow trend={market.trend} />
                </div>
              )}
            </div>
          ) : market.candidates && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {market.candidates.map((c, i) => (
                <div key={i} style={{ fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
                  <span style={{ color: mutedColor }}>{c.name}:</span>
                  <span style={{ color: accent, marginLeft: 4 }}>{c.prob}%</span>
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            fontSize: '10px',
            color: faintColor,
            marginTop: '6px',
            fontFamily: "Arial, sans-serif",
          }}>
            {market.volume} volume
          </div>
        </div>
      </div>
    </a>
  );
};

export default function IranPoliticalGraph({ darkMode = true }) {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [nodePositions, setNodePositions] = useState(() => {
    const positions = {};
    nodes.forEach(n => { positions[n.id] = { x: n.x, y: n.y }; });
    return positions;
  });
  const [dragging, setDragging] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('markets'); // 'markets' or 'info'
  const svgRef = useRef(null);
  
  // Pan and Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDragging(nodeId);
    setSelectedNode(nodeId);
  };
  
  // Handle panning when clicking on empty space
  const handleSvgMouseDown = (e) => {
    // Only start panning if clicking on empty space (not on a node)
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect' || e.target.tagName === 'path') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e) => {
    // Handle node dragging
    if (dragging && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const svgWidth = rect.width;
      const svgHeight = rect.height;
      
      // Convert screen coordinates to SVG coordinates accounting for zoom and pan
      const scaleX = 800 / svgWidth / zoom;
      const scaleY = 560 / svgHeight / zoom;
      
      const x = (e.clientX - rect.left) * scaleX - pan.x / zoom;
      const y = (e.clientY - rect.top) * scaleY - pan.y / zoom;
      
      setNodePositions(prev => ({
        ...prev,
        [dragging]: { x: Math.max(60, Math.min(740, x)), y: Math.max(40, Math.min(520, y)) }
      }));
    }
    
    // Handle panning
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [dragging, isPanning, panStart, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);
  
  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);
  
  // Zoom control functions
  const zoomIn = () => setZoom(prev => Math.min(2, prev + 0.2));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.2));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const filteredNodes = filter === 'all' ? nodes : nodes.filter(n => n.group === filter);
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));

  const getConnectedNodes = (nodeId) => {
    const connected = new Set();
    edges.forEach(e => {
      if (e.source === nodeId) connected.add(e.target);
      if (e.target === nodeId) connected.add(e.source);
    });
    return connected;
  };

  const activeNode = hoveredNode || selectedNode;
  const connectedToActive = activeNode ? getConnectedNodes(activeNode) : new Set();
  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null;

  // Get markets related to selected entity
  const relatedMarkets = selectedNode 
    ? predictionMarkets.filter(m => m.linkedEntities.includes(selectedNode))
    : predictionMarkets;

  // Theme colors based on dark mode
  const theme = {
    bg: darkMode ? '#000000' : 'rgb(240, 238, 231)',
    cardBg: darkMode ? '#1a1a1a' : '#f5f5f5',
    cardBorder: darkMode ? '#333' : '#d0d0d0',
    text: darkMode ? '#e0e0e0' : '#333',
    textMuted: darkMode ? '#888' : '#666',
    textFaint: darkMode ? '#555' : '#999',
    accent: darkMode ? '#ffd54f' : '#b8860b',
    svgBg: darkMode ? 'rgba(10, 10, 15, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    svgBorder: darkMode ? '#222' : '#d0d0d0',
    gridStroke: darkMode ? '#1a1a1a' : '#e0e0e0',
    btnBg: darkMode ? 'rgba(30, 30, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    btnBorder: darkMode ? '#444' : '#ccc',
    btnText: darkMode ? '#fff' : '#333',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      fontFamily: "'Georgia', serif",
      color: theme.text,
      padding: '20px',
    }}>
      <style>{`
        .filter-btn-${darkMode ? 'dark' : 'light'} {
          padding: 6px 12px;
          border: 1px solid ${theme.cardBorder};
          background: transparent;
          color: ${theme.textMuted};
          font-size: 11px;
          font-family: Arial, sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .filter-btn-${darkMode ? 'dark' : 'light'}:hover { 
          border-color: ${darkMode ? '#666' : '#999'}; 
          color: ${theme.text}; 
        }
        .filter-btn-${darkMode ? 'dark' : 'light'}.active { 
          background: ${darkMode ? '#fff' : '#333'}; 
          color: ${darkMode ? '#000' : '#fff'}; 
          border-color: ${darkMode ? '#fff' : '#333'}; 
        }
        
        .tab-btn-${darkMode ? 'dark' : 'light'} {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: ${theme.textMuted};
          font-size: 12px;
          font-family: Arial, sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid transparent;
        }
        .tab-btn-${darkMode ? 'dark' : 'light'}:hover { color: ${theme.text}; }
        .tab-btn-${darkMode ? 'dark' : 'light'}.active { 
          color: ${theme.text}; 
          border-bottom-color: ${theme.accent}; 
        }
        
        .node-group { cursor: grab; transition: transform 0.15s ease; }
        .node-group:active { cursor: grabbing; }
        
        .scrollable-panel-${darkMode ? 'dark' : 'light'} {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: ${theme.cardBorder} transparent;
        }
        .scrollable-panel-${darkMode ? 'dark' : 'light'}::-webkit-scrollbar { width: 6px; }
        .scrollable-panel-${darkMode ? 'dark' : 'light'}::-webkit-scrollbar-track { background: transparent; }
        .scrollable-panel-${darkMode ? 'dark' : 'light'}::-webkit-scrollbar-thumb { background: ${theme.cardBorder}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <header style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              letterSpacing: '0',
              margin: 0,
              color: theme.text,
              fontFamily: "'Georgia', serif",
            }}>
              Iran Political Landscape
            </h1>
            <span style={{
              padding: '3px 8px',
              backgroundColor: theme.accent,
              color: darkMode ? '#000' : '#fff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              borderRadius: '4px',
              fontFamily: 'Arial, sans-serif',
            }}>
              BETA
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: theme.textMuted,
            margin: 0,
            fontFamily: "Arial, sans-serif",
            lineHeight: '1.5',
          }}>
            Social Graph + Live Prediction Markets — January 2026
          </p>
        </div>
        
        {/* Back to Feed Button */}
        <button
          onClick={() => navigate('/trending/iran')}
          style={{
            padding: '8px 16px',
            background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${theme.cardBorder}`,
            color: theme.text,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "Arial, sans-serif",
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = theme.textMuted;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.borderColor = theme.cardBorder;
          }}
        >
          ← Back to Feed
        </button>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'opposition', 'reformist', 'regime', 'succession', 'external'].map(f => (
          <button key={f} className={`filter-btn-${darkMode ? 'dark' : 'light'} ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Graph Area */}
        <div style={{ flex: '1 1 600px', minWidth: '300px', position: 'relative' }}>
          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <button
              onClick={zoomIn}
              style={{
                width: '32px',
                height: '32px',
                background: theme.btnBg,
                border: `1px solid ${theme.btnBorder}`,
                color: theme.btnText,
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={zoomOut}
              style={{
                width: '32px',
                height: '32px',
                background: theme.btnBg,
                border: `1px solid ${theme.btnBorder}`,
                color: theme.btnText,
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Zoom out"
            >
              −
            </button>
            <button
              onClick={resetView}
              style={{
                width: '32px',
                height: '32px',
                background: theme.btnBg,
                border: `1px solid ${theme.btnBorder}`,
                color: theme.textMuted,
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "Arial, sans-serif",
              }}
              title="Reset view"
            >
              ⟲
            </button>
          </div>
          
          {/* Pan/Zoom hint - positioned over the SVG */}
          <div style={{
            position: 'absolute',
            bottom: '70px',
            left: '10px',
            zIndex: 10,
            fontSize: '10px',
            color: theme.textFaint,
            fontFamily: "Arial, sans-serif",
            background: theme.svgBg,
            padding: '6px 10px',
            borderRadius: '4px',
            border: `1px solid ${theme.cardBorder}`,
            pointerEvents: 'none',
          }}>
            Scroll to zoom • Drag background to pan • Drag nodes to move
          </div>
          
          <svg
            ref={svgRef}
            viewBox="0 0 800 560"
            style={{
              width: '100%',
              height: 'auto',
              background: theme.svgBg,
              border: `1px solid ${theme.svgBorder}`,
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleSvgMouseDown}
            onWheel={handleWheel}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={theme.textMuted} />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={theme.gridStroke} strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Pannable/Zoomable content group */}
            <g transform={`translate(${pan.x / zoom}, ${pan.y / zoom}) scale(${zoom})`}>

            {/* Edges */}
            {filteredEdges.map((edge, i) => {
              const source = nodePositions[edge.source];
              const target = nodePositions[edge.target];
              if (!source || !target) return null;
              
              const isConnected = activeNode && (edge.source === activeNode || edge.target === activeNode);
              const opacity = activeNode ? (isConnected ? 1 : 0.12) : 0.5;
              
              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.15;
              const cx = midX + (dy > 0 ? curve : -curve);
              const cy = midY + (dx > 0 ? -curve : curve);
              
              return (
                <g key={i}>
                  <path
                    d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                    fill="none"
                    stroke={edgeColors[edge.type] || '#444'}
                    strokeWidth={isConnected ? 2 : 1}
                    opacity={opacity}
                    strokeDasharray={edge.type === 'conflict' ? '4,4' : 'none'}
                    markerEnd="url(#arrowhead)"
                  />
                  {isConnected && (
                    <text x={cx} y={cy - 6} textAnchor="middle" fill="#888" fontSize="9" fontFamily="Arial, sans-serif">
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map(node => {
              const pos = nodePositions[node.id];
              const colors = groupColors[node.group];
              const isActive = node.id === activeNode;
              const isConnected = connectedToActive.has(node.id);
              const opacity = activeNode ? (isActive || isConnected ? 1 : 0.25) : 1;
              const scale = isActive ? 1.08 : 1;
              const radius = node.influence === 'critical' ? 32 : node.influence === 'high' ? 26 : 20;
              
              // Check if this entity has related markets
              const hasMarkets = predictionMarkets.some(m => m.linkedEntities.includes(node.id));
              
              return (
                <g
                  key={node.id}
                  className="node-group"
                  transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
                  opacity={opacity}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {isActive && (
                    <circle r={radius + 8} fill="none" stroke={colors.text} strokeWidth="2" opacity="0.3" filter="url(#glow)" />
                  )}
                  
                  <circle r={radius} fill={colors.bg} stroke={isActive ? colors.text : colors.border} strokeWidth={isActive ? 2 : 1} />
                  
                  {node.influence === 'critical' && (
                    <circle r={radius - 4} fill="none" stroke={colors.text} strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
                  )}
                  
                  {/* Market indicator */}
                  {hasMarkets && (
                    <circle cx={radius - 4} cy={-radius + 4} r="5" fill="#ffd54f" stroke="#000" strokeWidth="1" />
                  )}
                  
                  <text y={radius + 14} textAnchor="middle" fill={colors.text} fontSize="10" fontFamily="Arial, sans-serif" fontWeight="500">
                    {node.label}
                  </text>
                </g>
              );
            })}
            </g>
          </svg>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '12px',
            flexWrap: 'wrap',
            padding: '10px 12px',
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          }}>
            <div>
              <span style={{ color: theme.textFaint, marginRight: '8px' }}>GROUPS:</span>
              {Object.entries(groupColors).map(([group, colors]) => (
                <span key={group} style={{ marginRight: '12px' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors.bg, border: `1px solid ${colors.border}`, marginRight: 5 }} />
                  <span style={{ color: colors.text }}>{group}</span>
                </span>
              ))}
            </div>
            <div>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: theme.accent, marginRight: 5 }} />
              <span style={{ color: theme.textMuted }}>Has prediction markets</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${theme.cardBorder}`, marginBottom: '12px' }}>
            <button className={`tab-btn-${darkMode ? 'dark' : 'light'} ${activeTab === 'markets' ? 'active' : ''}`} onClick={() => setActiveTab('markets')}>
              Markets {selectedNode && `(${relatedMarkets.length})`}
            </button>
            <button className={`tab-btn-${darkMode ? 'dark' : 'light'} ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
              Map Info
            </button>
          </div>

          <div className={`scrollable-panel-${darkMode ? 'dark' : 'light'}`}>
            {activeTab === 'markets' ? (
              <>
                {/* Markets description */}
                <div style={{
                  padding: '12px',
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  marginBottom: '12px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: theme.textMuted,
                  fontFamily: 'Arial, sans-serif',
                }}>
                  <span style={{ color: theme.text }}>Live prediction market odds</span> from Polymarket and Kalshi. 
                  These represent real-money bets on future events related to entities in this graph. 
                  Click any market to view on the source platform.
                </div>

                {selectedNode && (
                  <div style={{
                    padding: '10px 12px',
                    background: darkMode ? 'rgba(255, 213, 79, 0.1)' : 'rgba(184, 134, 11, 0.1)',
                    border: `1px solid ${darkMode ? '#6a5a2a' : '#c9a227'}`,
                    marginBottom: '12px',
                    fontSize: '11px',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    <span style={{ color: theme.accent }}>Showing markets for:</span>
                    <span style={{ color: '#fff', marginLeft: 6 }}>{selectedNodeData?.label}</span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{
                        float: 'right',
                        background: 'none',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Clear ×
                    </button>
                  </div>
                )}
                
                {relatedMarkets.length > 0 ? (
                  relatedMarkets.map(market => (
                    <MarketCard 
                      key={market.id} 
                      market={market} 
                      isHighlighted={selectedNode && market.linkedEntities.includes(selectedNode)}
                      compact={true}
                      darkMode={darkMode}
                    />
                  ))
                ) : (
                  <div style={{ color: theme.textFaint, fontSize: '12px', padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    No prediction markets linked to this entity.
                  </div>
                )}

              </>
            ) : (
              <>
                {selectedNodeData ? (
                  <div style={{ padding: '16px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                    <div style={{
                      fontSize: '9px',
                      color: groupColors[selectedNodeData.group].text,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      marginBottom: '6px',
                      fontFamily: 'Arial, sans-serif',
                    }}>
                      {selectedNodeData.group}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 10px', color: theme.text, fontFamily: "'Georgia', serif" }}>
                      {selectedNodeData.label}
                    </h2>
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      background: selectedNodeData.influence === 'critical' ? (darkMode ? '#4a1a1a' : '#ffebee') : selectedNodeData.influence === 'high' ? (darkMode ? '#3a2a1a' : '#fff8e1') : (darkMode ? '#1a2a3a' : '#e3f2fd'),
                      color: selectedNodeData.influence === 'critical' ? '#ff6b6b' : selectedNodeData.influence === 'high' ? (darkMode ? '#ffd54f' : '#b8860b') : '#64b5f6',
                      fontSize: '9px',
                      fontFamily: "Arial, sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '12px',
                    }}>
                      {selectedNodeData.influence} influence
                    </div>
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: theme.textMuted, margin: 0, fontFamily: 'Arial, sans-serif' }}>
                      {selectedNodeData.description}
                    </p>
                    
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.cardBorder}` }}>
                      <div style={{ fontSize: '9px', color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>
                        Connections
                      </div>
                      {edges.filter(e => e.source === selectedNode || e.target === selectedNode).map((e, i) => {
                        const otherId = e.source === selectedNode ? e.target : e.source;
                        const other = nodes.find(n => n.id === otherId);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: edgeColors[e.type] }} />
                            <span style={{ color: theme.textMuted }}>{e.label}</span>
                            <span style={{ color: theme.text }}>→ {other?.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {relatedMarkets.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${theme.cardBorder}` }}>
                        <div style={{ fontSize: '9px', color: theme.accent, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>
                          Related Markets ({relatedMarkets.length})
                        </div>
                        <button
                          onClick={() => setActiveTab('markets')}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: darkMode ? 'rgba(255, 213, 79, 0.1)' : 'rgba(184, 134, 11, 0.1)',
                            border: `1px solid ${darkMode ? '#6a5a2a' : '#c9a227'}`,
                            color: theme.accent,
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          View Markets →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: theme.textFaint, fontSize: '12px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                    <p style={{ margin: '0 0 12px' }}>Click on an entity in the graph to view details.</p>
                    <p style={{ margin: 0, fontSize: '11px' }}>
                      Drag nodes to rearrange.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Note */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <div style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'Arial, sans-serif', fontWeight: '600' }}>
              Note
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.6, color: theme.text, margin: '0 0 10px 0', fontFamily: 'Arial, sans-serif' }}>
              Prediction markets currently price Khamenei leaving power at <strong style={{ color: theme.accent }}>58-61%</strong> by mid-2026. The succession process and potential political transitions remain uncertain.
            </p>
            <p style={{ fontSize: '11px', lineHeight: 1.6, color: theme.text, margin: 0, fontFamily: 'Arial, sans-serif' }}>
              For further reading and analysis, head over to the{' '}
              <span 
                onClick={() => navigate('/collections')}
                style={{ 
                  color: theme.accent, 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Collections page
              </span>
              {' '}to view various sources covering Iran.
            </p>
          </div>

          {/* Sources */}
        </div>
      </div>
    </div>
  );
}
