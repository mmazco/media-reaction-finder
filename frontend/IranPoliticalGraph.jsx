import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Prediction market data - linked to entities (updated Mar 8 2026)
const predictionMarkets = [
  {
    id: 'us-strikes-iran-resolved',
    title: 'US strikes Iran — RESOLVED YES (Feb 28)',
    probability: 100,
    previousProb: 63,
    volume: '$529M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/us-strikes-iran-by',
    linkedEntities: ['trump', 'israel', 'irgc', 'khamenei'],
    trend: 'up',
    resolved: true,
  },
  {
    id: 'khamenei-out-feb28',
    title: 'Khamenei out by February 28? — RESOLVED YES',
    probability: 100,
    previousProb: 99,
    volume: '$104M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-february-28',
    linkedEntities: ['khamenei', 'mojtaba', 'hassan_k', 'assembly', 'ali_larijani', 'sadegh_larijani'],
    trend: 'up',
    resolved: true,
  },
  {
    id: 'khamenei-out-mar31',
    title: 'Khamenei out by March 31? — RESOLVED YES',
    probability: 100,
    previousProb: 99,
    volume: '$58.5M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-march-31',
    linkedEntities: ['khamenei', 'mojtaba', 'hassan_k', 'assembly', 'ali_larijani', 'sadegh_larijani'],
    trend: 'up',
    resolved: true,
  },
  {
    id: 'next-supreme-leader-pm',
    title: 'Next Supreme Leader of Iran?',
    probability: null,
    volume: '$37M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/who-will-be-next-supreme-leader-of-iran-515',
    linkedEntities: ['mojtaba', 'hassan_k', 'arafi', 'ali_larijani', 'sadegh_larijani', 'assembly'],
    candidates: [
      { name: 'Mojtaba Khamenei', prob: 100 },
      { name: 'Alireza Arafi', prob: 0 },
      { name: 'Hassan Khomeini', prob: 0 },
      { name: 'Ali Larijani', prob: 0 },
      { name: 'Sadegh Larijani', prob: 0 },
      { name: 'Position abolished', prob: 0 },
    ],
    trend: 'up',
  },
  {
    id: 'announce-leader-date',
    title: 'Iran announces new Supreme Leader on...?',
    probability: null,
    volume: '$5.4M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/iran-announces-new-supreme-leader-on',
    linkedEntities: ['mojtaba', 'assembly', 'hassan_k', 'arafi'],
    candidates: [
      { name: 'March 9', prob: 98 },
      { name: 'March 8', prob: 2 },
    ],
    trend: 'up',
    isNew: true,
  },
  {
    id: 'new-leader-timeline',
    title: 'New Supreme Leader named by...? — RESOLVING YES',
    probability: null,
    volume: '$7M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-iran-name-a-successor-to-khamenei-by',
    linkedEntities: ['mojtaba', 'hassan_k', 'arafi', 'ali_larijani', 'sadegh_larijani', 'assembly'],
    candidates: [
      { name: 'By March 8', prob: 100 },
      { name: 'By March 15', prob: 100 },
      { name: 'By March 31', prob: 100 },
    ],
    trend: 'up',
    resolved: true,
  },
  {
    id: 'iran-leader-eoy',
    title: 'Who will lead Iran at end of 2026?',
    probability: null,
    volume: '$1.2M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/iran-leader-end-of-2026',
    linkedEntities: ['mojtaba', 'pahlavi', 'pezeshkian', 'ali_larijani', 'sadegh_larijani', 'arafi', 'hassan_k'],
    candidates: [
      { name: 'Mojtaba Khamenei', prob: 33 },
      { name: 'Reza Pahlavi', prob: 17 },
      { name: 'Masoud Pezeshkian', prob: 12 },
      { name: 'Ali Larijani', prob: 5 },
      { name: 'Sadegh Larijani', prob: 4 },
      { name: 'Alireza Arafi', prob: 4 },
      { name: 'No Head of State', prob: 3 },
    ],
    trend: 'up',
    isNew: true,
  },
  {
    id: 'regime-fall-2026',
    title: 'Will the Iranian regime fall before 2027?',
    probability: 44,
    previousProb: 50,
    volume: '$8.6M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-the-iranian-regime-fall-by-the-end-of-2026',
    linkedEntities: ['khamenei', 'irgc', 'pezeshkian', 'ghalibaf', 'mojtaba'],
    trend: 'down',
  },
  {
    id: 'regime-fall-mar31',
    title: 'Will the Iranian regime fall by March 31?',
    probability: 9,
    previousProb: 17,
    volume: '$25.6M',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-the-iranian-regime-fall-by-march-31',
    linkedEntities: ['khamenei', 'irgc', 'pezeshkian', 'ghalibaf', 'mojtaba'],
    trend: 'down',
  },
  {
    id: 'regime-survive-strikes',
    title: 'Will the Iranian regime survive US strikes?',
    probability: 68,
    previousProb: 65,
    volume: '$308K',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-the-iranian-regime-survive-us-military-strikes-741',
    linkedEntities: ['trump', 'irgc', 'khamenei', 'mojtaba'],
    trend: 'up',
  },
  {
    id: 'iran-coup-jun30',
    title: 'Iran coup attempt by June 30?',
    probability: 32,
    previousProb: 40,
    volume: '$210K',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/iran-coup-attempt-by-june-30',
    linkedEntities: ['irgc', 'khamenei', 'assembly', 'mojtaba'],
    trend: 'down',
  },
  {
    id: 'us-recognize-pahlavi-pm',
    title: 'US recognizes Reza Pahlavi as leader of Iran in 2026?',
    probability: 19,
    previousProb: null,
    volume: '$379K',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/us-recognizes-reza-pahlavi-as-leader-of-iran-in2026',
    linkedEntities: ['pahlavi', 'trump'],
    trend: 'up',
    isNew: true,
  },
  {
    id: 'iran-presidential-election',
    title: 'Will Iran hold a presidential election by June 30?',
    probability: 14,
    previousProb: null,
    volume: '$57K',
    platform: 'polymarket',
    url: 'https://polymarket.com/event/will-iran-hold-a-presidential-election-by-june-30',
    linkedEntities: ['pezeshkian', 'mojtaba', 'assembly'],
    trend: 'down',
    isNew: true,
  },
  {
    id: 'pahlavi-visit',
    title: 'Will Reza Pahlavi visit Iran this year?',
    probability: 32,
    previousProb: 57,
    volume: '$2K+',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxpahlavivisita/will-reza-pahlavi-enter-iran-before-september/kxpahlavivisita',
    linkedEntities: ['pahlavi'],
    trend: 'down',
  },
  {
    id: 'us-recognize-pahlavi',
    title: 'Will the United States recognize Reza Pahlavi?',
    probability: 37,
    previousProb: 36,
    volume: '$1.2K+',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxrecogpersoniran/recognize-reza-pahlavi/kxrecogpersoniran-26',
    linkedEntities: ['pahlavi', 'trump'],
    trend: 'up',
  },
  {
    id: 'next-supreme-leader',
    title: "Who will be Khamenei's successor? (Kalshi)",
    probability: null,
    volume: '$70K+',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxnextiranleader/who-will-be-khameneis-successor/kxnextiranleader-45jan01',
    linkedEntities: ['mojtaba', 'hassan_k', 'arafi', 'khamenei', 'assembly'],
    candidates: [
      { name: 'Alireza Arafi', prob: 19 },
      { name: 'Hassan Khomeini', prob: 17 },
      { name: 'Position abolished', prob: 15 },
      { name: 'Mojtaba Khamenei', prob: 10 },
      { name: 'Sadeq Amoli Larijani', prob: 10 },
    ],
    trend: 'up',
    divergence: true,
  },
  {
    id: 'iran-nuclear-deal',
    title: 'US-Iran nuclear deal before 2027?',
    probability: 55,
    previousProb: 49,
    volume: '$470K',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxusairanagreement/us-iran-nuclear-deal/kxusairanagreement-27',
    linkedEntities: ['trump', 'khamenei', 'pezeshkian', 'mojtaba'],
    trend: 'up',
  },
  {
    id: 'strait-hormuz',
    title: 'Will Iran close the Strait of Hormuz before 2027?',
    probability: 40,
    previousProb: 31,
    volume: '$5K+',
    platform: 'kalshi',
    url: 'https://kalshi.com/markets/kxclosehormuz/strait-of-hormuz/kxclosehormuz-27jan',
    linkedEntities: ['irgc', 'khamenei', 'mojtaba'],
    trend: 'up',
  },
];

const nodes = [
  // Opposition / External Candidates
  { id: 'pahlavi', label: 'Reza Pahlavi', group: 'opposition', x: 150, y: 140, description: 'Exiled son of the last Shah, in the US since 1978. Most visible diaspora opposition figure. Advocates for referendum on Iran\'s future. Has no political party or verified organizational presence inside Iran. Actual domestic support unclear.', influence: 'medium' },
  { id: 'rajavi', label: 'Maryam Rajavi', group: 'opposition', x: 100, y: 280, description: 'NCRI President-elect, leads parliament-in-exile. Has 10-point plan backed by US Congress members. MEK/NCRI is controversial with limited verified support inside Iran.', influence: 'low' },
  { id: 'tajzadeh', label: 'Mostafa Tajzadeh', group: 'reformist', x: 300, y: 70, description: 'Imprisoned reformist at Evin Prison, former Deputy Interior Minister. Advocates constituent assembly and peaceful transition. Publishes political analysis via Telegram. Intellectually active but operationally constrained.', influence: 'low' },
  { id: 'mousavi', label: 'Mir-Hossein Mousavi', group: 'reformist', x: 400, y: 140, description: 'Green Movement leader (2009), under house arrest since 2011. Called for referendum to end clerical rule in 2023. Symbolic figure but severely constrained after 14 years of isolation.', influence: 'low' },
  
  // Current Regime
  { id: 'khamenei', label: 'Ali Khamenei', group: 'regime', x: 550, y: 220, description: 'Supreme Leader of Iran since 1989. 86 years old. Holds ultimate authority over military, judiciary, and major state decisions under Iran\'s constitutional structure.', influence: 'critical' },
  { id: 'pezeshkian', label: 'Masoud Pezeshkian', group: 'regime', x: 450, y: 310, description: 'President of Iran since 2024. Reformist-aligned. Executive authority is constitutionally subordinate to the Supreme Leader.', influence: 'medium' },
  { id: 'ghalibaf', label: 'Mohammad Ghalibaf', group: 'regime', x: 650, y: 120, description: 'Speaker of the Iranian Parliament. Former mayor of Tehran and IRGC commander. Considered a conservative political figure.', influence: 'high' },
  
  // Succession Candidates
  { id: 'mojtaba', label: 'Mojtaba Khamenei', group: 'succession', x: 700, y: 290, description: 'Son of Supreme Leader Ali Khamenei. Mid-ranking cleric. Never held formal government position. Polymarket successor market: 100% — expected to be announced as next Supreme Leader on March 9. End-of-2026 leadership odds: 33%.', influence: 'critical' },
  { id: 'hassan_k', label: 'Hassan Khomeini', group: 'succession', x: 600, y: 380, description: 'Grandson of Ayatollah Ruhollah Khomeini, founder of the Islamic Republic. Cleric based in Qom. Generally associated with reformist positions. Successor market: <1% (was 21%).', influence: 'medium' },
  { id: 'arafi', label: 'Alireza Arafi', group: 'succession', x: 750, y: 200, description: 'Deputy Chairman of the Assembly of Experts. Member of the Guardian Council. Friday prayer leader of Qom. Successor market: <1% (was 19%).', influence: 'medium' },
  { id: 'ali_larijani', label: 'Ali Larijani', group: 'succession', x: 350, y: 350, description: 'Former Speaker of Parliament (2008–2020) and former Secretary of the Supreme National Security Council. Pragmatic conservative. End-of-2026 leadership odds: 5%.', influence: 'medium' },
  { id: 'sadegh_larijani', label: 'Sadegh Larijani', group: 'succession', x: 430, y: 420, description: 'Former Head of the Judiciary (2009–2019) and current member of the Guardian Council and Expediency Discernment Council. Brother of Ali Larijani. Hardline conservative cleric. End-of-2026 leadership odds: 4%.', influence: 'medium' },
  
  // External Actors
  { id: 'trump', label: 'Donald Trump', group: 'external', x: 200, y: 400, description: 'President of the United States. Has issued public statements regarding Iran protests and authorized military strikes on Iranian nuclear facilities in 2025.', influence: 'high' },
  { id: 'israel', label: 'Benjamin Netanyahu', group: 'external', x: 320, y: 440, description: 'Prime Minister of Israel. Has overseen military operations against Iran and Iranian-backed groups during ongoing regional conflict.', influence: 'high' },
  { id: 'irgc', label: 'IRGC', group: 'regime', x: 500, y: 120, description: 'Islamic Revolutionary Guard Corps. Branch of Iran\'s military reporting directly to the Supreme Leader. Also involved in economic and intelligence activities.', influence: 'critical' },
  
  // Organizations
  { id: 'ncri', label: 'NCRI / MEK', group: 'opposition', x: 80, y: 350, description: 'National Council of Resistance of Iran. Parliament-in-exile led by Rajavi. Controversial, limited internal support.', influence: 'low' },
  { id: 'assembly', label: 'Assembly of Experts', group: 'regime', x: 750, y: 380, description: 'Body of 88 elected clerics constitutionally responsible for selecting, monitoring, and if necessary dismissing the Supreme Leader.', influence: 'medium' },
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
  { source: 'ali_larijani', target: 'assembly', label: 'Candidate', type: 'succession' },
  { source: 'ali_larijani', target: 'khamenei', label: 'Close ally', type: 'alliance' },
  { source: 'ali_larijani', target: 'ghalibaf', label: 'Rival', type: 'conflict' },
  { source: 'ali_larijani', target: 'sadegh_larijani', label: 'Brothers', type: 'family' },
  { source: 'sadegh_larijani', target: 'assembly', label: 'Candidate', type: 'succession' },
  { source: 'sadegh_larijani', target: 'khamenei', label: 'Ally', type: 'alliance' },
  { source: 'trump', target: 'khamenei', label: 'Threatens', type: 'conflict' },
  { source: 'israel', target: 'irgc', label: 'War', type: 'conflict' },
  { source: 'israel', target: 'khamenei', label: 'Assassination threat', type: 'conflict' },
];

const groupColors = {
  opposition: { bg: '#22c55e', border: '#16a34a', text: '#22c55e' },
  reformist: { bg: '#3b82f6', border: '#2563eb', text: '#3b82f6' },
  regime: { bg: '#ef4444', border: '#dc2626', text: '#ef4444' },
  succession: { bg: '#eab308', border: '#ca8a04', text: '#eab308' },
  external: { bg: '#a855f7', border: '#9333ea', text: '#a855f7' },
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}>
            <span>{market.title}</span>
            {market.resolved && (
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#ef4444', color: '#fff', fontWeight: 700, letterSpacing: '0.3px' }}>RESOLVED</span>
            )}
            {market.isNew && (
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 700, letterSpacing: '0.3px' }}>NEW</span>
            )}
            {market.paused && (
              <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#f59e0b', color: '#000', fontWeight: 700, letterSpacing: '0.3px' }}>PAUSED</span>
            )}
          </div>
          
          {market.probability !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                fontSize: compact ? '18px' : '22px',
                fontWeight: 600,
                color: market.resolved ? '#ef4444' : market.probability > 50 ? '#4caf50' : market.probability > 30 ? accent : '#e57373',
                fontFamily: "Arial, sans-serif",
              }}>
                {market.resolved ? 'YES' : `${market.probability}%`}
              </div>
              {change !== 0 && (
                <div style={{
                  fontSize: '11px',
                  color: change > 0 ? '#4caf50' : '#f44336',
                  fontFamily: "Arial, sans-serif",
                }}>
                  {market.resolved ? '$529M vol' : `${change > 0 ? '+' : ''}${change}%`}
                  {!market.resolved && <TrendArrow trend={market.trend} />}
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

export default function IranPoliticalGraph({ darkMode = true, isMobile = false }) {
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
      const scaleY = 520 / svgHeight / zoom;
      
      const x = (e.clientX - rect.left) * scaleX - pan.x / zoom;
      const y = (e.clientY - rect.top) * scaleY - pan.y / zoom;
      
      setNodePositions(prev => ({
        ...prev,
        [dragging]: { x: Math.max(60, Math.min(740, x)), y: Math.max(40, Math.min(480, y)) }
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
  
  // Scroll zoom disabled to prevent accidental zoom
  const handleWheel = useCallback((e) => {
    // intentionally disabled
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
      padding: isMobile ? '60px 16px 80px 16px' : '20px 20px 120px 70px',
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
          overflow-y: visible;
        }
        
        @media (max-width: 768px) {
          .iran-graph-layout {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .iran-graph-area {
            max-width: 100% !important;
            min-width: 0 !important;
            flex: 1 1 auto !important;
            max-height: none !important;
          }
          .iran-right-panel {
            flex: 1 1 auto !important;
            min-width: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Header - matches /trending/iran style */}
      <header style={{
        marginBottom: '0',
        padding: isMobile ? '0' : '0 0 20px 0',
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
              color: theme.accent,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px',
              fontWeight: '600',
              fontFamily: 'Arial, sans-serif'
            }}>
              Trending: Geopolitics
            </div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 'normal',
              color: darkMode ? '#fff' : '#1a1a1a',
              margin: 0,
              fontFamily: 'Georgia, serif'
            }}>
              Iran Political Landscape
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.textMuted,
              margin: '6px 0 0',
              fontFamily: 'Arial, sans-serif'
            }}>
              Social Graph + Live Prediction Markets — Updated Mar 8, 2026
            </p>
          </div>
          
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
        </div>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {['all', 'opposition', 'reformist', 'regime', 'succession', 'external'].map(f => (
          <button key={f} className={`filter-btn-${darkMode ? 'dark' : 'light'} ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="iran-graph-layout" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', marginTop: '16px' }}>
        
        {/* Graph Area */}
        <div className="iran-graph-area" style={{ flex: '1 1 550px', minWidth: '300px', maxWidth: '70%', position: 'relative', maxHeight: 'calc(100vh - 200px)' }}>
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
          
          <svg
            ref={svgRef}
            viewBox="0 0 800 520"
            style={{
              width: '100%',
              maxHeight: 'calc(100vh - 280px)',
              background: theme.svgBg,
              border: `1px solid ${theme.svgBorder}`,
              cursor: isPanning ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleSvgMouseDown}
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
            
            {/* Hint text inside SVG */}
            {!isMobile && (
              <text x="10" y="510" fill={theme.textFaint} fontSize="9" fontFamily="Arial, sans-serif" opacity="0.7">
                Drag background to pan • Drag nodes to move • Use +/− to zoom
              </text>
            )}
            
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

          {/* Mobile hint - below SVG, above legend */}
          {isMobile && (
            <div style={{
              fontSize: '10px',
              color: theme.textFaint,
              fontFamily: 'Arial, sans-serif',
              background: theme.svgBg,
              padding: '6px 10px',
              borderRadius: '4px',
              border: `1px solid ${theme.cardBorder}`,
              marginTop: '12px',
              display: 'inline-block',
            }}>
              Pinch to zoom • Drag to pan
            </div>
          )}

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

          {/* Prediction Market Analysis */}
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <div style={{ fontSize: '9px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontFamily: 'Arial, sans-serif', fontWeight: '600' }}>
              Prediction Market Analysis
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.6, color: theme.text, margin: '0 0 12px 0', fontFamily: 'Arial, sans-serif' }}>
              <strong style={{ color: '#ef4444' }}>March 8 update:</strong> Succession is settled. Polymarket's $37M "Next Supreme Leader" market has <strong>Mojtaba Khamenei at 100%</strong> — up from 7% on Mar 2. Announcement expected March 9 (98% on $5.4M market). The question is now whether he holds power through 2026.
            </p>

            <div style={{ fontSize: '11px', fontFamily: 'Arial, sans-serif', lineHeight: 1.7, color: theme.text }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#22c55e', fontSize: '13px' }}>&#9673;</span>
                <span><strong>Next Supreme Leader</strong> — <strong style={{ color: '#22c55e' }}>Mojtaba Khamenei 100%</strong>. $37M volume (was $4.8M). All other candidates collapsed to &lt;1%. Announcement on March 9 at 98%.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#eab308', fontSize: '13px' }}>&#9733;</span>
                <span><strong>Iran leader end of 2026</strong> — New $1.2M market. Mojtaba only <strong style={{ color: theme.accent }}>33%</strong> to still lead by Dec 31. Pahlavi <strong style={{ color: theme.accent }}>17%</strong>, Pezeshkian <strong style={{ color: theme.accent }}>12%</strong>. Market prices significant instability ahead.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>&#9660;</span>
                <span><strong>Regime fall by Mar 31</strong> — dropped further to <strong style={{ color: theme.accent }}>9%</strong> <span style={{ color: theme.textMuted }}>(was 17%)</span>. By end of 2026 eased to <strong style={{ color: theme.accent }}>44%</strong> <span style={{ color: theme.textMuted }}>(was 50%)</span>. Regime survive strikes up to <strong style={{ color: theme.accent }}>68%</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#ef4444', fontSize: '13px' }}>&#9660;</span>
                <span><strong>Coup attempt by June 30</strong> — down to <strong style={{ color: theme.accent }}>32%</strong> <span style={{ color: theme.textMuted }}>(was 40%)</span>. Presidential election by June 30 at only <strong style={{ color: theme.accent }}>14%</strong>. US recognizes Pahlavi at <strong style={{ color: theme.accent }}>19%</strong>.</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', fontFamily: 'Arial, sans-serif', lineHeight: 1.7, color: theme.text, marginTop: '12px', padding: '10px 12px', background: darkMode ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', border: `1px solid ${darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
              <div style={{ fontSize: '9px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: '600' }}>Platform Divergence</div>
              <span>Polymarket ($37M vol) has Mojtaba at <strong style={{ color: '#22c55e' }}>100%</strong>. Kalshi ($70K vol) has Arafi <strong style={{ color: theme.accent }}>19%</strong>, Khomeini <strong style={{ color: theme.accent }}>17%</strong>, "position abolished" <strong style={{ color: theme.accent }}>15%</strong>, Mojtaba only <strong style={{ color: theme.accent }}>10%</strong>. Kalshi's lower liquidity and slower settlement may explain the gap — or Kalshi traders see a contested succession.</span>
            </div>
            <p style={{ fontSize: '11px', lineHeight: 1.6, color: theme.textMuted, margin: '10px 0 10px 0', fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>
              Polymarket says it's settled: Mojtaba. But Kalshi traders are far less convinced, still pricing four viable outcomes. Both agree on near-term regime survival (fall by Mar 31 at 9%) and longer-term instability (fall before 2027 at 44%). Kalshi sees 55% chance of a nuclear deal before 2027 and 40% on Hormuz closure.
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
        </div>

        {/* Right Panel */}
        <div className="iran-right-panel" style={{ flex: '0 0 340px', minWidth: '300px' }}>
          
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

          {/* Sources */}
        </div>
      </div>
    </div>
  );
}
