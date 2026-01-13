import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Prediction market data - linked to entities
const predictionMarkets = [
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
    timeframes: [
      { label: 'Before Apr 1, 2026', prob: 41 },
      { label: 'Before Jul 1, 2026', prob: 58 },
      { label: 'Before Sep 1, 2026', prob: 61 },
    ]
  },
  {
    id: 'khamenei-out-poly',
    title: 'Khamenei out as Supreme Leader by December 31, 2026?',
    probability: 52,
    previousProb: 48,
    volume: '$221K',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-december-31-2026',
    linkedEntities: ['khamenei', 'mojtaba', 'hassan_k'],
    trend: 'up',
  },
  {
    id: 'pahlavi-visit',
    title: 'Will Reza Pahlavi visit Iran this year?',
    probability: 57,
    previousProb: 34,
    volume: '$246',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxpahlavi',
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
    url: 'https://kalshi.com/markets/kxpahlavi-recognize',
    linkedEntities: ['pahlavi', 'trump'],
    trend: 'up',
  },
  {
    id: 'next-supreme-leader',
    title: 'Who will be the next Supreme Leader of Iran?',
    probability: null,
    volume: '$2.3K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxnextiranleader',
    linkedEntities: ['mojtaba', 'hassan_k', 'arafi', 'khamenei'],
    candidates: [
      { name: 'Mojtaba Khamenei', prob: 25 },
      { name: 'Gholam-Hossein M.', prob: 23 },
    ],
    trend: 'stable',
  },
  {
    id: 'israel-strikes-iran',
    title: 'Israel strikes Iran by January 31, 2026?',
    probability: 31,
    previousProb: 45,
    volume: '$5M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/israel-strikes-iran',
    linkedEntities: ['israel', 'irgc', 'khamenei'],
    trend: 'down',
  },
  {
    id: 'iran-nuclear-deal',
    title: 'New US-Iran nuclear deal this year?',
    probability: 49,
    previousProb: 35,
    volume: '$1.5K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxirannuke',
    linkedEntities: ['trump', 'khamenei', 'pezeshkian'],
    trend: 'up',
  },
  {
    id: 'strait-hormuz',
    title: 'Will Iran close the Strait of Hormuz this year?',
    probability: 31,
    previousProb: 22,
    volume: '$4.1K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxhormuz',
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
  { id: 'trump', label: 'Trump Admin', group: 'external', x: 200, y: 480, description: 'Current US administration. Has issued public statements regarding Iran protests and conducted military strikes on Iranian nuclear facilities in 2025.', influence: 'high' },
  { id: 'israel', label: 'Israel', group: 'external', x: 320, y: 520, description: 'State of Israel. Engaged in ongoing conflict with Iran including military strikes in 2025. No formal diplomatic relations with Iran.', influence: 'high' },
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
  opposition: { bg: '#1a472a', border: '#2d5a3d', text: '#7cb896' },
  reformist: { bg: '#2a3f5f', border: '#3d5a7f', text: '#8ab4f8' },
  regime: { bg: '#4a1a1a', border: '#6a2a2a', text: '#e57373' },
  succession: { bg: '#4a3a1a', border: '#6a5a2a', text: '#ffd54f' },
  external: { bg: '#3a1a4a', border: '#5a2a6a', text: '#ce93d8' },
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

const MarketCard = ({ market, isHighlighted, compact = false }) => {
  const change = market.previousProb ? market.probability - market.previousProb : 0;
  
  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: compact ? '10px 12px' : '14px 16px',
        background: isHighlighted ? 'rgba(255, 213, 79, 0.1)' : 'rgba(30, 30, 40, 0.8)',
        border: `1px solid ${isHighlighted ? '#ffd54f' : '#333'}`,
        marginBottom: '8px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#666';
        e.currentTarget.style.background = 'rgba(40, 40, 50, 0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHighlighted ? '#ffd54f' : '#333';
        e.currentTarget.style.background = isHighlighted ? 'rgba(255, 213, 79, 0.1)' : 'rgba(30, 30, 40, 0.8)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <PlatformLogo platform={market.platform} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? '11px' : '12px',
            color: '#e0e0e0',
            lineHeight: 1.4,
            marginBottom: '6px',
          }}>
            {market.title}
          </div>
          
          {market.probability !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: compact ? '18px' : '22px',
                fontWeight: 600,
                color: market.probability > 50 ? '#4caf50' : market.probability > 30 ? '#ffd54f' : '#e57373',
                fontFamily: "monospace",
              }}>
                {market.probability}%
              </div>
              {change !== 0 && (
                <div style={{
                  fontSize: '11px',
                  color: change > 0 ? '#4caf50' : '#f44336',
                  fontFamily: "monospace",
                }}>
                  {change > 0 ? '+' : ''}{change}%
                  <TrendArrow trend={market.trend} />
                </div>
              )}
            </div>
          ) : market.candidates && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {market.candidates.map((c, i) => (
                <div key={i} style={{ fontSize: '11px' }}>
                  <span style={{ color: '#888' }}>{c.name}:</span>
                  <span style={{ color: '#ffd54f', marginLeft: 4, fontFamily: "monospace" }}>{c.prob}%</span>
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            fontSize: '10px',
            color: '#555',
            marginTop: '6px',
            fontFamily: "monospace",
          }}>
            {market.volume} volume
          </div>
        </div>
      </div>
    </a>
  );
};

export default function IranPoliticalGraph() {
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
  const [activeTab, setActiveTab] = useState('markets');
  const svgRef = useRef(null);

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDragging(nodeId);
    setSelectedNode(nodeId);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setNodePositions(prev => ({
      ...prev,
      [dragging]: { x: Math.max(60, Math.min(740, x)), y: Math.max(40, Math.min(520, y)) }
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

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

  const relatedMarkets = selectedNode 
    ? predictionMarkets.filter(m => m.linkedEntities.includes(selectedNode))
    : predictionMarkets;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: '#e0e0e0',
      padding: '20px',
    }}>
      {/* Header with Back Button */}
      <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: '1px solid #333',
              color: '#888',
              padding: '6px 12px',
              fontSize: '11px',
              cursor: 'pointer',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'monospace',
            }}
          >
            ← Back to Home
          </button>
          <div style={{ fontSize: '10px', color: '#ffd54f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
            Media Reaction Finder — Beta Feature
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 300,
            letterSpacing: '1px',
            margin: 0,
            color: '#fff',
          }}>
            Iran Political Landscape
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#666',
            margin: '6px 0 0',
            fontFamily: "monospace",
          }}>
            Social Graph + Live Prediction Markets — January 2026
          </p>
        </div>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'opposition', 'reformist', 'regime', 'succession', 'external'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${filter === f ? '#fff' : '#333'}`,
              background: filter === f ? '#fff' : 'transparent',
              color: filter === f ? '#000' : '#888',
              fontSize: '11px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Graph Area */}
        <div style={{ flex: '1 1 600px', minWidth: '300px' }}>
          <svg
            ref={svgRef}
            viewBox="0 0 800 560"
            style={{
              width: '100%',
              height: 'auto',
              background: 'rgba(10, 10, 15, 0.8)',
              border: '1px solid #222',
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#444" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

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
                    <text x={cx} y={cy - 6} textAnchor="middle" fill="#888" fontSize="9" fontFamily="monospace">
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
              
              const hasMarkets = predictionMarkets.some(m => m.linkedEntities.includes(node.id));
              
              return (
                <g
                  key={node.id}
                  style={{ cursor: 'grab' }}
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
                  
                  {hasMarkets && (
                    <circle cx={radius - 4} cy={-radius + 4} r="5" fill="#ffd54f" stroke="#000" strokeWidth="1" />
                  )}
                  
                  <text y={radius + 14} textAnchor="middle" fill={colors.text} fontSize="10" fontFamily="monospace" fontWeight="500">
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '12px',
            flexWrap: 'wrap',
            padding: '10px 12px',
            background: 'rgba(20, 20, 30, 0.6)',
            border: '1px solid #222',
            fontSize: '10px',
          }}>
            <div>
              <span style={{ color: '#555', marginRight: '8px' }}>GROUPS:</span>
              {Object.entries(groupColors).map(([group, colors]) => (
                <span key={group} style={{ marginRight: '10px' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors.bg, border: `1px solid ${colors.border}`, marginRight: 4 }} />
                  <span style={{ color: colors.text }}>{group}</span>
                </span>
              ))}
            </div>
            <div>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ffd54f', marginRight: 4 }} />
              <span style={{ color: '#888' }}>Has prediction markets</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('markets')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'markets' ? '#fff' : '#666',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: activeTab === 'markets' ? '2px solid #ffd54f' : '2px solid transparent',
              }}
            >
              Markets {selectedNode && `(${relatedMarkets.length})`}
            </button>
            <button
              onClick={() => setActiveTab('info')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'info' ? '#fff' : '#666',
                fontSize: '12px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: activeTab === 'info' ? '2px solid #ffd54f' : '2px solid transparent',
              }}
            >
              Map Info
            </button>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {activeTab === 'markets' ? (
              <>
                <div style={{
                  padding: '12px',
                  background: 'rgba(20, 20, 30, 0.6)',
                  border: '1px solid #282830',
                  marginBottom: '12px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: '#888',
                }}>
                  <span style={{ color: '#aaa' }}>Live prediction market odds</span> from Polymarket and Kalshi. 
                  These represent real-money bets on future events. Click any market to view on the source platform.
                </div>

                {selectedNode && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(255, 213, 79, 0.1)',
                    border: '1px solid #6a5a2a',
                    marginBottom: '12px',
                    fontSize: '11px',
                  }}>
                    <span style={{ color: '#ffd54f' }}>Showing markets for:</span>
                    <span style={{ color: '#fff', marginLeft: 6 }}>{selectedNodeData?.label}</span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{
                        float: 'right',
                        background: 'none',
                        border: 'none',
                        color: '#888',
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
                    />
                  ))
                ) : (
                  <div style={{ color: '#555', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                    No prediction markets linked to this entity.
                  </div>
                )}
              </>
            ) : (
              <>
                {selectedNodeData ? (
                  <div style={{ padding: '16px', background: 'rgba(20, 20, 30, 0.95)', border: '1px solid #333' }}>
                    <div style={{
                      fontSize: '9px',
                      color: groupColors[selectedNodeData.group].text,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      marginBottom: '6px',
                    }}>
                      {selectedNodeData.group}
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 10px', color: '#fff' }}>
                      {selectedNodeData.label}
                    </h2>
                    <div style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      background: selectedNodeData.influence === 'critical' ? '#4a1a1a' : selectedNodeData.influence === 'high' ? '#3a2a1a' : '#1a2a3a',
                      color: selectedNodeData.influence === 'critical' ? '#ff6b6b' : selectedNodeData.influence === 'high' ? '#ffd54f' : '#64b5f6',
                      fontSize: '9px',
                      fontFamily: "monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '12px',
                    }}>
                      {selectedNodeData.influence} influence
                    </div>
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#aaa', margin: 0 }}>
                      {selectedNodeData.description}
                    </p>
                    
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                      <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                        Connections
                      </div>
                      {edges.filter(e => e.source === selectedNode || e.target === selectedNode).map((e, i) => {
                        const otherId = e.source === selectedNode ? e.target : e.source;
                        const other = nodes.find(n => n.id === otherId);
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: edgeColors[e.type] }} />
                            <span style={{ color: '#666' }}>{e.label}</span>
                            <span style={{ color: '#ccc' }}>→ {other?.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {relatedMarkets.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #333' }}>
                        <div style={{ fontSize: '9px', color: '#ffd54f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                          Related Markets ({relatedMarkets.length})
                        </div>
                        <button
                          onClick={() => setActiveTab('markets')}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: 'rgba(255, 213, 79, 0.1)',
                            border: '1px solid #6a5a2a',
                            color: '#ffd54f',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontFamily: "monospace",
                          }}
                        >
                          View Markets →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '20px', color: '#555', fontSize: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 12px' }}>Click on an entity in the graph to view details.</p>
                    <p style={{ margin: 0, fontSize: '11px', fontFamily: "monospace" }}>
                      Drag nodes to rearrange.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Key Insight */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            background: 'rgba(74, 26, 26, 0.3)',
            border: '1px solid #6a2a2a',
          }}>
            <div style={{ fontSize: '9px', color: '#e57373', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Key Insight
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.5, color: '#ccc', margin: 0 }}>
              Markets price Khamenei leaving power at <strong style={{ color: '#ffd54f' }}>58-61%</strong> by mid-2026. 
              The opposition lacks unified leadership — a "Bonaparte" may emerge from within.
            </p>
          </div>

          {/* Sources */}
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            background: 'rgba(20, 20, 30, 0.6)',
            border: '1px solid #222',
            fontSize: '9px',
            color: '#444',
          }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Sources: </span>
            <span style={{ color: '#666' }}>Euronews, Atlantic Council, Iran International, CNN, Polymarket, Kalshi</span>
          </div>
        </div>
      </div>
    </div>
  );
}

