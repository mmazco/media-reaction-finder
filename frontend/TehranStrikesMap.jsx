import { useState } from "react";

const STRIKES = [
  {id:1,n:"Supreme Leader's Compound (Pasteur District)",lat:35.700,lng:51.423,c:"confirmed",d:"Feb 28",
   t:"Khamenei's residence & office compound destroyed. Satellite imagery (Airbus) confirms severe damage. Khamenei, family members & security chief Shamkhani killed.",
   s:["AP","CNN","Al Jazeera","BBC","Reuters","CBS","NPR"],cat:"Leadership"},
  {id:2,n:"IRGC HQ / Thar-Allah HQ",lat:35.696,lng:51.416,c:"confirmed",d:"Feb 28",
   t:"IDF stated it levelled the General Staff of internal security forces & Thar-Allah HQ. Fars confirmed strikes near IRGC HQ.",
   s:["IDF","Fars News","Al Jazeera","Wikipedia"],cat:"Military"},
  {id:3,n:"University St / Jomhouri Area",lat:35.694,lng:51.405,c:"confirmed",d:"Feb 28",
   t:"Multiple missiles hit University Street & Jomhouri area. Two students killed at nearby school east of the capital.",
   s:["Fars News","Al Jazeera","CNN","Wikipedia"],cat:"Mixed"},
  {id:4,n:"Ministry of Intelligence",lat:35.689,lng:51.389,c:"confirmed",d:"Feb 28",
   t:"Intelligence Ministry HQ struck. Official Mohammad Baseri killed. FARAJA intelligence chief Rezaeian also killed.",
   s:["Al Jazeera","Fars News","Wikipedia","Iranian state media"],cat:"Government"},
  {id:5,n:"Ministry of Defence",lat:35.735,lng:51.475,c:"confirmed",d:"Feb 28",
   t:"Defence Ministry complex targeted in initial strike wave. Confirmed across multiple Iranian and international outlets.",
   s:["Al Jazeera","Fars News","Iranian state media"],cat:"Government"},
  {id:6,n:"Seyyed Khandan (North Tehran)",lat:35.744,lng:51.440,c:"confirmed",d:"Feb 28",
   t:"Explosions in northern Tehran district confirmed by semi-official Tasnim News Agency and cross-referenced by Al Jazeera.",
   s:["Tasnim News","Al Jazeera","Wikipedia"],cat:"Mixed"},
  {id:7,n:"Atomic Energy Org. of Iran",lat:35.720,lng:51.395,c:"confirmed",d:"Feb 28",
   t:"AEOI HQ targeted. Confirmed in Al Jazeera's verified mapping report alongside other government ministry strikes.",
   s:["Al Jazeera","Iranian media"],cat:"Nuclear"},
  {id:8,n:"State Radio & TV HQ (IRIB)",lat:35.715,lng:51.406,c:"confirmed",d:"Feb 28–Mar 1",
   t:"State broadcasting HQ struck. IDF confirmed targeting regime communications infrastructure.",
   s:["Iranian media","Wikipedia","IDF"],cat:"Government"},
  {id:9,n:"Azadi Tower / Azadi Square",lat:35.700,lng:51.338,c:"confirmed",d:"Mar 1",
   t:"Video confirmed massive explosions around iconic Azadi Tower during Israel's second wave on Sunday. CNN verified footage.",
   s:["CNN","Al Jazeera (video)","Wikipedia"],cat:"Landmark"},
  {id:10,n:"Azadi Stadium Area",lat:35.718,lng:51.334,c:"confirmed",d:"Mar 1",
   t:"Explosions near Azadi Stadium, confirmed alongside Azadi Square strikes in same wave.",
   s:["Wikipedia","Iranian media"],cat:"Landmark"},
  {id:11,n:"Narmak / 72 Sq (Ahmadinejad area)",lat:35.738,lng:51.487,c:"likely",d:"Feb 28",
   t:"Multiple videos show strikes near Ahmadinejad's residence at 72 Square. School damaged, 2+ children killed. Ahmadinejad later confirmed dead by state media.",
   s:["Al Jazeera","local authorities","Wikipedia"],cat:"Leadership"},
  {id:12,n:"Khatam-al-Anbia Hospital",lat:35.702,lng:51.422,c:"likely",d:"Mar 1",
   t:"Government-linked hospital reportedly hit. BBC Verify confirmed damage. Iran FM told NPR: 'they hit hospitals in the centre of Tehran.' Military-affiliated facility.",
   s:["BBC Verify","NPR","Wikipedia"],cat:"Civilian/Medical"},
  {id:13,n:"Tehran Revolutionary Court",lat:35.690,lng:51.410,c:"likely",d:"Feb 28–Mar 1",
   t:"Court building reportedly destroyed per Iranian media. No major wire service independently confirmed exact target yet.",
   s:["Wikipedia","Iranian media"],cat:"Government"},
  {id:14,n:"Milad Tower Area",lat:35.745,lng:51.375,c:"likely",d:"Mar 1",
   t:"Explosions near Iran's tallest tower in NW Tehran. Fewer independent confirmations than other sites.",
   s:["Wikipedia","Iranian media"],cat:"Landmark"},
  {id:15,n:"Farmanieh Street",lat:35.787,lng:51.463,c:"unverified",d:"Mar 2 AM",
   t:"Explosion near Farmanieh Street, upscale residential NE Tehran. Target unknown. LiveUAMap page returned 403 — headline scraped from homepage only.",
   s:["LiveUAMap"],cat:"Unknown"},
  {id:16,n:"Sepah Square",lat:35.681,lng:51.421,c:"unverified",d:"Mar 2",
   t:"Iranian media reported explosion near Sepah Square in central Tehran. Aggregated by LiveUAMap.",
   s:["Iranian media via LiveUAMap"],cat:"Unknown"},
  {id:17,n:"Khazaneh / Basij Bokharaei Base (S. Tehran)",lat:35.620,lng:51.440,c:"unverified",d:"Mar 2",
   t:"Airstrike near Khazaneh area, presumably IRGC Basij Bokharaei base. Not mentioned by any major wire service yet.",
   s:["LiveUAMap"],cat:"Military"},
  {id:18,n:"Gandhi Hospital (Gandhi St, N. Tehran)",lat:35.759,lng:51.410,c:"confirmed",d:"Mar 1",
   t:"Major private hospital on South Gandhi Street struck during Sunday wave. State TV showed structural damage, shattered windows. Nurses evacuated newborns from incubators. Iran Health Ministry confirmed. Located near IRIB transmitter that was also hit. WHO Director-General condemned the strike.",
   s:["Al Jazeera","Anadolu Agency","ISNA","Tasnim News","TRT World","Times of Israel","Globe and Mail","Middle East Eye","NDTV","Reuters"],cat:"Civilian/Medical"},
  {id:19,n:"Ferdowsi Square (Downtown Tehran)",lat:35.6965,lng:51.4185,c:"likely",d:"Mar 2",
   t:"Explosions reported at Ferdowsi Square in central Tehran during IAF's latest large-scale wave. CGTN named it alongside Tajrish and the Foreign Police Station area as targets.",
   s:["CGTN","Pravda (images)","IDF (confirmed new Tehran wave)"],cat:"Downtown"},
  {id:20,n:"Tajrish (N. Tehran)",lat:35.800,lng:51.434,c:"likely",d:"Mar 2",
   t:"Explosions reported in the Tajrish area of far northern Tehran, named alongside Ferdowsi Square in CGTN reporting of IAF's latest wave.",
   s:["CGTN"],cat:"Mixed"},
  {id:21,n:"Niloofar Square",lat:35.705,lng:51.435,c:"likely",d:"Mar 2",
   t:"20 civilians killed at Niloofar Square on March 2, per Wikipedia citing Iranian sources. One of the deadliest single incidents in Tehran.",
   s:["Wikipedia","Iranian sources"],cat:"Civilian"},
];

const TIER1=["AP","Reuters"],TIER2=["CNN","BBC","BBC Verify","Al Jazeera","Al Jazeera (video)","NPR","CBS"],TIER3=["Fars News","Tasnim News","Iranian state media","Iranian media","IRNA"],TIER4=["LiveUAMap","Iranian media via LiveUAMap"],OFFICIAL=["IDF"];
const CONF={confirmed:{color:"#ef4444",label:"CONFIRMED",desc:"3+ independent major outlets corroborate"},likely:{color:"#f59e0b",label:"LIKELY",desc:"1–2 credible sources or verified video"},unverified:{color:"#10b981",label:"UNVERIFIED — MAR 2",desc:"Single source, often LiveUAMap only"}};
const counts={confirmed:11,likely:7,unverified:3};
const BOUNDS={minLat:35.59,maxLat:35.81,minLng:51.29,maxLng:51.53};
function toSVG(lat,lng){return{x:4+((lng-BOUNDS.minLng)/(BOUNDS.maxLng-BOUNDS.minLng))*92,y:4+((BOUNDS.maxLat-lat)/(BOUNDS.maxLat-BOUNDS.minLat))*67}}

const T = {
  dark: {
    bg:"#0b1120",srf:"#0f172a",srfAlt:"rgba(15,23,42,0.8)",tx:"#e0e6ed",tx2:"#94a3b8",tx3:"#64748b",tx4:"#475569",hd:"#fff",
    bd:"rgba(255,255,255,0.06)",bd2:"rgba(255,255,255,0.1)",hvr:"rgba(255,255,255,0.06)",
    cBg:"rgba(255,255,255,0.02)",cBd:"rgba(255,255,255,0.04)",
    btn:"rgba(255,255,255,0.03)",btnA:"rgba(255,255,255,0.1)",
    mBg:"#0f172a",mGr:"rgba(255,255,255,0.02)",mLb:"#1e293b",mLb2:"#334155",
    mSt:"rgba(255,255,255,0.4)",mStS:"#fff",ttBg:"rgba(0,0,0,0.75)",ttLn:"rgba(255,255,255,0.25)",ttTx:"#fff",
    gBg:"rgba(99,102,241,0.1)",gBd:"rgba(99,102,241,0.3)",gTx:"#a5b4fc",
    wBg:"rgba(245,158,11,0.08)",wBd:"rgba(245,158,11,0.2)",wTx:"#fbbf24",
    tag:"rgba(255,255,255,0.04)",stBg:"rgba(255,255,255,0.06)",
    s1:{bg:"rgba(34,197,94,0.18)",bd:"rgba(34,197,94,0.35)",tx:"#86efac"},
    s2:{bg:"rgba(59,130,246,0.15)",bd:"rgba(59,130,246,0.3)",tx:"#93c5fd"},
    s3:{bg:"rgba(245,158,11,0.12)",bd:"rgba(245,158,11,0.25)",tx:"#fcd34d"},
    s4:{bg:"rgba(239,68,68,0.12)",bd:"rgba(239,68,68,0.25)",tx:"#fca5a5"},
    sO:{bg:"rgba(168,85,247,0.15)",bd:"rgba(168,85,247,0.3)",tx:"#c4b5fd"},
    sD:{bg:"rgba(255,255,255,0.05)",bd:"rgba(255,255,255,0.1)",tx:"#94a3b8"},
    tC:["#86efac","#93c5fd","#fcd34d","#fca5a5","#c4b5fd"],
  },
  light: {
    bg:"#f8fafc",srf:"#ffffff",srfAlt:"#f1f5f9",tx:"#1e293b",tx2:"#475569",tx3:"#64748b",tx4:"#94a3b8",hd:"#0f172a",
    bd:"#e2e8f0",bd2:"#cbd5e1",hvr:"#f1f5f9",
    cBg:"#ffffff",cBd:"#e2e8f0",
    btn:"#f1f5f9",btnA:"#e2e8f0",
    mBg:"#f1f5f9",mGr:"rgba(0,0,0,0.04)",mLb:"#94a3b8",mLb2:"#64748b",
    mSt:"rgba(0,0,0,0.2)",mStS:"#0f172a",ttBg:"rgba(255,255,255,0.95)",ttLn:"rgba(0,0,0,0.15)",ttTx:"#0f172a",
    gBg:"#eef2ff",gBd:"#a5b4fc",gTx:"#4f46e5",
    wBg:"#fffbeb",wBd:"#fcd34d",wTx:"#b45309",
    tag:"#f1f5f9",stBg:"#f1f5f9",
    s1:{bg:"#dcfce7",bd:"#86efac",tx:"#166534"},
    s2:{bg:"#dbeafe",bd:"#93c5fd",tx:"#1e40af"},
    s3:{bg:"#fef3c7",bd:"#fcd34d",tx:"#92400e"},
    s4:{bg:"#fee2e2",bd:"#fca5a5",tx:"#991b1b"},
    sO:{bg:"#f3e8ff",bd:"#c4b5fd",tx:"#6b21a8"},
    sD:{bg:"#f1f5f9",bd:"#e2e8f0",tx:"#475569"},
    tC:["#166534","#1e40af","#92400e","#991b1b","#6b21a8"],
  }
};

function sC(src,t){if(TIER1.includes(src))return t.s1;if(TIER2.includes(src))return t.s2;if(TIER3.includes(src))return t.s3;if(TIER4.includes(src))return t.s4;if(OFFICIAL.includes(src))return t.sO;return t.sD;}

const AIRTABLE_URL = "/api/submit-strike";

async function submitToAirtable(data) {
  try {
    const res = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function TehranStrikesMap({ darkMode = true, isMobile = false }) {
  const [sel, setSel] = useState(null);
  const [flt, setFlt] = useState("all");
  const [confModal, setConfModal] = useState(false);
  const [suggestModal, setSuggestModal] = useState(false);
  const [suggestForm, setSuggestForm] = useState({ location: "", date: "", description: "", sources: "", contact: "" });
  const [submissions, setSubmissions] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x:0,y:0});
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({x:0,y:0});
  const mode = darkMode ? "dark" : "light";
  const t = T[mode]; const dk = darkMode;
  const list = flt==="all" ? STRIKES : STRIKES.filter(s=>s.c===flt);
  const s = sel ? STRIKES.find(x=>x.id===sel) : null;

  const tiers=[
    {n:"Tier 1 — Wire services",v:"AP, Reuters",d:"Gold standard. On-ground correspondents where possible"},
    {n:"Tier 2 — Major broadcasters",v:"CNN, BBC/BBC Verify, Al Jazeera, NPR, CBS",d:"Independent geolocation, satellite analysis, verified footage"},
    {n:"Tier 3 — Iranian state media",v:"Fars, Tasnim, IRNA",d:"Reliable on confirming strikes occurred. May spin details politically"},
    {n:"Tier 4 — Aggregators (caution)",v:"LiveUAMap, MahsaAlert",d:"Crowdsourced. Fast but not independently verified"},
    {n:"Official military claims",v:"IDF, CENTCOM",d:"First-party claims. Useful but inherently one-sided"},
  ];

  return (
    <div style={{background:dk ? '#000' : 'rgb(240,238,231)',minHeight:"100vh",fontFamily:"Arial, sans-serif",color:t.tx,display:"flex",flexDirection:"column"}}>

      {/* Header */}
      <div style={{padding: isMobile ? '60px 16px 20px' : '20px 28px 24px 70px'}}>
        <div style={{fontSize:11,color:dk?'#b8860b':'#8b6914',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600,marginBottom:6,fontFamily:'Arial, sans-serif'}}>Trending: Geopolitics</div>
        <h1 style={{fontSize:22,fontWeight:'normal',color:dk?'#fff':'#1a1a1a',margin:0,fontFamily:'Georgia, serif'}}>
          Tehran Strike Map
        </h1>
        <p style={{fontSize:14,color:t.tx3,margin:'6px 0 0',fontFamily:'Arial, sans-serif'}}>
          Strike Verification Map — Updated Mar 2, 2026
        </p>

        <div style={{display:"flex",alignItems:"center",gap:14,marginTop:20,flexWrap:"wrap"}}>
          <div style={{background:t.stBg,border:`1px solid ${t.bd2}`,borderRadius:8,padding:"10px 18px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 10px rgba(34,197,94,0.6)"}}/>
            <div>
              <div style={{fontSize:11,color:t.tx3,lineHeight:1,marginBottom:3}}>LAST UPDATED</div>
              <div style={{fontSize:15,color:t.hd,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>Mar 2, 2026 — 15:15 UTC</div>
            </div>
          </div>
          <div style={{background:t.stBg,border:`1px solid ${t.bd2}`,borderRadius:8,padding:"10px 18px"}}>
            <div style={{fontSize:11,color:t.tx3,lineHeight:1,marginBottom:3}}>SITUATION</div>
            <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>ACTIVE — Strikes ongoing, new waves expected</div>
          </div>
          <span style={{background:"#dc2626",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:4,letterSpacing:1}}>DAY 3</span>
        </div>

        <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}>
          <button onClick={()=>setConfModal(true)} style={{background:dk?"rgba(99,102,241,0.12)":"#eef2ff",border:`1px solid ${dk?"rgba(99,102,241,0.3)":"#a5b4fc"}`,color:dk?"#a5b4fc":"#4f46e5",borderRadius:6,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            Confidence Statement
          </button>
          <button onClick={()=>{setSuggestModal(true);setSubmitSuccess(false)}} style={{background:dk?"rgba(16,185,129,0.12)":"#ecfdf5",border:`1px solid ${dk?"rgba(16,185,129,0.3)":"#6ee7b7"}`,color:dk?"#6ee7b7":"#065f46",borderRadius:6,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            + Suggest a Strike Location
          </button>
          {submissions.length > 0 && (
            <span style={{fontSize:12,color:t.tx3,alignSelf:"center"}}>{submissions.length} pending suggestion{submissions.length!==1?"s":""}</span>
          )}
        </div>

        <p style={{fontSize:13,color:t.tx4,marginTop:16,marginBottom:0,lineHeight:1.5}}>
          Sources: Al Jazeera, CNN, NPR, AP, BBC Verify, Fars/Tasnim, CBS, Wikipedia, LiveUAMap · {STRIKES.length} locations tracked
        </p>
      </div>

      {/* Main — Map + Right Panel */}
      <div style={{display:"flex",flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '0' : '16px 20px 0 70px', gap: isMobile ? 0 : 32, flexWrap:'wrap'}}>
        {/* Map */}
        <div style={{flex: isMobile ? '1' : '1 1 550px', minWidth: isMobile ? '100%' : 300, maxWidth: isMobile ? '100%' : '70%', padding: isMobile ? "10px 12px 16px" : "8px", position: 'relative', background:t.mBg, borderRadius:10, border:`1px solid ${t.bd}`, overflow:'hidden', maxHeight: isMobile ? 'none' : 'calc(100vh - 200px)'}}>
          <div style={{position:'absolute',top:12,right:12,zIndex:10,display:'flex',flexDirection:'column',gap:4}}>
            <button onClick={()=>setZoom(z=>Math.min(3,z+0.3))} title="Zoom in" style={{width:32,height:32,background:dk?'rgba(255,255,255,0.08)':'#fff',border:`1px solid ${dk?'rgba(255,255,255,0.15)':'#d1d5db'}`,color:dk?'#e0e6ed':'#374151',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.3))} title="Zoom out" style={{width:32,height:32,background:dk?'rgba(255,255,255,0.08)':'#fff',border:`1px solid ${dk?'rgba(255,255,255,0.15)':'#d1d5db'}`,color:dk?'#e0e6ed':'#374151',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <button onClick={()=>{setZoom(1);setPan({x:0,y:0})}} title="Reset view" style={{width:32,height:32,background:dk?'rgba(255,255,255,0.08)':'#fff',border:`1px solid ${dk?'rgba(255,255,255,0.15)':'#d1d5db'}`,color:t.tx3,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>↺</button>
          </div>
          <svg viewBox="0 0 100 75" style={{width:"100%",maxHeight:'calc(100vh - 280px)',cursor:isPanning?'grabbing':'grab'}}
            onMouseDown={e=>{if(e.target.closest('g[style*="pointer"]'))return;setIsPanning(true);setPanStart({x:e.clientX-pan.x,y:e.clientY-pan.y})}}
            onMouseMove={e=>{if(isPanning){setPan({x:e.clientX-panStart.x,y:e.clientY-panStart.y})}}}
            onMouseUp={()=>setIsPanning(false)}
            onMouseLeave={()=>setIsPanning(false)}
          >
            <g transform={`translate(${pan.x/(zoom*14)}, ${pan.y/(zoom*14)}) scale(${zoom})`} style={{transformOrigin:'50px 37.5px'}}>
            {[10,20,30,40,50,60,70,80,90].map(x=><line key={`gx${x}`} x1={x} y1={0} x2={x} y2={75} stroke={t.mGr} strokeWidth={0.12}/>)}
            {[10,20,30,40,50,60,70].map(y=><line key={`gy${y}`} x1={0} y1={y} x2={100} y2={y} stroke={t.mGr} strokeWidth={0.12}/>)}
            <text x={3} y={4.5} fontSize={1.8} fill={t.mLb2} fontWeight={700}>N</text>
            <text x={50} y={3.5} fontSize={1.4} fill={t.mLb} textAnchor="middle" fontWeight={600}>NORTHERN TEHRAN</text>
            <text x={50} y={73} fontSize={1.4} fill={t.mLb} textAnchor="middle" fontWeight={600}>SOUTHERN TEHRAN</text>
            <text x={3} y={38} fontSize={1.3} fill={t.mLb}>W</text>
            <text x={97} y={38} fontSize={1.3} fill={t.mLb} textAnchor="end">E</text>
            <text x={50} y={44} fontSize={1.1} fill={t.mLb} textAnchor="middle" fontStyle="italic">— Central Tehran —</text>
            {list.map(st=>{
              const p=toSVG(st.lat,st.lng);const col=CONF[st.c].color;const iS=sel===st.id;
              return(
                <g key={st.id} onClick={()=>setSel(st.id)} style={{cursor:"pointer"}}>
                  {st.c==="unverified"&&(<circle cx={p.x} cy={p.y} r={2} fill="none" stroke={col} strokeWidth={0.15} opacity={0.6}><animate attributeName="r" from="1.5" to="5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite"/></circle>)}
                  <circle cx={p.x} cy={p.y} r={iS?4.5:2.8} fill={col} opacity={iS?0.25:0.12}/>
                  <circle cx={p.x} cy={p.y} r={iS?1.8:1.15} fill={col} stroke={iS?t.mStS:t.mSt} strokeWidth={iS?0.3:0.18}/>
                  {iS&&(<><line x1={p.x} y1={p.y-2.5} x2={p.x} y2={p.y-4.5} stroke={t.ttLn} strokeWidth={0.1}/><rect x={p.x-16} y={p.y-7} width={32} height={2.8} rx={0.6} fill={t.ttBg} stroke={col} strokeWidth={0.08}/><text x={p.x} y={p.y-5} fontSize={1.35} fill={t.ttTx} textAnchor="middle" fontWeight={700}>{st.n.length>38?st.n.slice(0,36)+"…":st.n}</text></>)}
                </g>
              );
            })}
            </g>
            {zoom===1&&pan.x===0&&pan.y===0&&(
              <text x={50} y={74} fontSize={0.9} fill={t.tx4} textAnchor="middle">Drag to pan · Use +/− to zoom</text>
            )}
          </svg>
        </div>

        {/* Right Panel — Tabs */}
        <div style={{flex: '0 0 340px', minWidth: isMobile ? '100%' : 300}}>
          {/* Tabs like Markets/Map Info */}
          <div style={{display:'flex',borderBottom:`1px solid ${t.bd}`,marginBottom:12}}>
            {[{k:"all",l:`All (${STRIKES.length})`},{k:"confirmed",l:`Confirmed (${counts.confirmed})`},{k:"likely",l:`Likely (${counts.likely})`},{k:"unverified",l:`Unverified (${counts.unverified})`}].map(tab=>(
              <button key={tab.k} onClick={()=>{setFlt(tab.k);setSel(null)}} style={{padding:'8px 16px',border:'none',background:'transparent',color:flt===tab.k?t.hd:t.tx3,fontSize:12,fontFamily:'Arial, sans-serif',cursor:'pointer',borderBottom:flt===tab.k?`2px solid ${dk?'#b8860b':'#8b6914'}`:'2px solid transparent',transition:'all 0.2s ease',fontWeight:flt===tab.k?600:400}}>
                {tab.l}
              </button>
            ))}
          </div>

          <div style={{overflowY:'auto',maxHeight: isMobile ? 'none' : 'calc(100vh - 260px)',padding: isMobile ? "0 16px 80px" : "0"}}>
          {s?(
            <div style={{padding:"16px",background:t.cBg,border:`1px solid ${t.cBd}`}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:CONF[s.c].color,fontWeight:700,marginBottom:6}}>{CONF[s.c].label}</div>
              <h2 style={{fontSize:18,fontWeight:600,color:t.hd,margin:"0 0 10px",fontFamily:"'Georgia', serif"}}>{s.n}</h2>
              <div style={{display:"flex",gap:8,fontSize:11,color:t.tx3,marginBottom:14}}>
                <span>{s.d}</span>
                <span style={{display:'inline-block',padding:"3px 8px",background:t.tag,borderRadius:3,border:`1px solid ${t.cBd}`,fontSize:9,textTransform:'uppercase',letterSpacing:1}}>{s.cat}</span>
              </div>
              <p style={{fontSize:12,color:t.tx2,lineHeight:1.6,marginBottom:16,fontFamily:'Arial, sans-serif'}}>{s.t}</p>
              <div style={{marginBottom:14,paddingTop:12,borderTop:`1px solid ${t.bd}`}}>
                <div style={{fontSize:9,color:t.tx3,marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>Sources ({s.s.length}) — {s.s.length>=3?"strong corroboration":s.s.length===2?"moderate corroboration":"single source"}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {s.s.map((src,i)=>{const sc=sC(src,t);return <span key={i} style={{fontSize:10,padding:"3px 10px",borderRadius:4,background:sc.bg,color:sc.tx,border:`1px solid ${sc.bd}`}}>{src}</span>})}
                </div>
              </div>
              {s.c==="unverified"&&(
                <div style={{background:t.wBg,border:`1px solid ${t.wBd}`,borderRadius:6,padding:"10px 12px",fontSize:11,color:t.wTx,marginBottom:14,lineHeight:1.4}}>
                  Single-source report. Iran's internet blackout (~1% connectivity) makes independent verification near-impossible.
                </div>
              )}
              <div style={{fontSize:11,color:t.tx4,padding:"8px 0",borderTop:`1px solid ${t.bd}`,fontFamily:'Arial, sans-serif'}}>
                {s.c==="confirmed"?"High confidence — independently verified by multiple major outlets":s.c==="likely"?"Medium confidence — credible but fewer independent verifications":"Low confidence — needs further corroboration"}
              </div>
              <button onClick={()=>setSel(null)} style={{marginTop:12,background:t.btn,border:`1px solid ${t.bd2}`,color:t.tx2,borderRadius:0,padding:"8px 14px",fontSize:11,cursor:"pointer",width:"100%",fontFamily:'Arial, sans-serif'}}>Back to list</button>
            </div>
          ):(
            <>
              <div style={{padding:12,background:t.cBg,border:`1px solid ${t.cBd}`,marginBottom:12,fontSize:11,lineHeight:1.5,color:t.tx3,fontFamily:'Arial, sans-serif'}}>
                <span style={{color:t.tx}}>Strike locations</span> cross-referenced from multiple outlets. Click any location to view details and sources. Click map markers for the same.
              </div>
              {(flt==="all"?["confirmed","likely","unverified"]:[flt]).map(lv=>{
                const items=STRIKES.filter(x=>x.c===lv);if(!items.length)return null;
                return items.map(st=>(
                  <div key={st.id} onClick={()=>setSel(st.id)} style={{padding:"12px",marginBottom:1,cursor:"pointer",background:t.cBg,border:`1px solid ${t.cBd}`,transition:"background .15s",fontFamily:'Arial, sans-serif'}}
                    onMouseEnter={e=>{e.currentTarget.style.background=t.hvr}} onMouseLeave={e=>{e.currentTarget.style.background=t.cBg}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:CONF[st.c].color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:t.tx,fontWeight:600}}>{st.n}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:2}}>
                          <span style={{fontSize:11,color:t.tx3}}>{st.d}</span>
                          <span style={{fontSize:10,color:t.tx3,background:t.tag,padding:"2px 7px",borderRadius:3}}>{st.s.length} source{st.s.length!==1?"s":""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Verification Guide & Source Methodology — below map like analysis section */}
      <div style={{padding: isMobile ? '16px' : '12px 20px 40px 70px', marginTop:12}}>
        <div style={{background:t.cBg,border:`1px solid ${t.cBd}`,padding:16}}>
          <div style={{fontSize:9,color:t.tx3,textTransform:'uppercase',letterSpacing:1,marginBottom:10,fontFamily:'Arial, sans-serif',fontWeight:600}}>
            Verification Guide & Source Methodology
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
            {Object.entries(CONF).map(([k,c])=>(
              <div key={k} style={{flex:"1 1 200px",background:dk?`${c.color}11`:`${c.color}15`,border:`1px solid ${c.color}44`,borderRadius:8,padding:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:c.color,boxShadow:`0 0 6px ${c.color}66`}}/>
                  <span style={{fontSize:13,fontWeight:700,color:c.color}}>{c.label}</span>
                  <span style={{fontSize:20,fontWeight:800,color:c.color,marginLeft:"auto"}}>{counts[k]}</span>
                </div>
                <p style={{fontSize:12,color:t.tx2,lineHeight:1.5,margin:0}}>{c.desc}</p>
              </div>
            ))}
          </div>
          <div style={{fontSize:9,color:t.tx3,textTransform:'uppercase',letterSpacing:1,marginBottom:8,fontFamily:'Arial, sans-serif',fontWeight:600}}>
            Source Reliability Ranking
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:14}}>
            {tiers.map((tr,i)=>(
              <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"8px 12px",background:t.srfAlt,border:`1px solid ${t.cBd}`,borderRadius:4}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:t.tC[i],marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,fontWeight:700,color:t.tC[i]}}>{tr.n}</span>
                  <span style={{fontSize:12,color:t.tx2}}> — {tr.v}</span>
                  <p style={{fontSize:11,color:t.tx3,margin:"2px 0 0",lineHeight:1.4}}>{tr.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:t.wBg,border:`1px solid ${t.wBd}`,borderRadius:6,padding:12,fontSize:12,color:t.wTx,lineHeight:1.5}}>
            <strong>Iran's internet is at ~1% connectivity</strong> since strikes began. This severely limits real-time verification, especially the Mar 2 morning reports.
          </div>
        </div>
      </div>

      {/* CONFIDENCE STATEMENT MODAL */}
      {confModal && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={()=>setConfModal(false)}>
          <div style={{background:t.srf,border:`1px solid ${t.bd2}`,borderRadius:12,padding:24,maxWidth:620,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700,color:t.hd,margin:0,fontFamily:"'Georgia', serif"}}>Confidence Statement</h2>
                <p style={{fontSize:11,color:t.tx3,marginTop:2}}>Last updated: Mar 2, 2026 — 15:15 UTC</p>
              </div>
              <button onClick={()=>setConfModal(false)} style={{background:"none",border:"none",color:t.tx3,fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>

            <div style={{background:dk?"rgba(99,102,241,0.08)":"#eef2ff",border:`1px solid ${dk?"rgba(99,102,241,0.2)":"#c7d2fe"}`,borderRadius:8,padding:14,marginBottom:16}}>
              <p style={{fontSize:13,color:t.tx,lineHeight:1.6,margin:0}}>
                This map compiles <strong style={{color:t.hd}}>21 reported strike locations</strong> in Tehran from Feb 28 – Mar 2, 2026. It was built by cross-referencing multiple international news outlets, wire services, and open-source aggregators. It is <strong style={{color:t.hd}}>not exhaustive</strong> — Iran's near-total internet blackout (~1% connectivity) means many strikes likely remain unreported in English-language media.
              </p>
            </div>

            <h3 style={{fontSize:13,fontWeight:700,color:t.hd,marginBottom:8,fontFamily:"'Georgia', serif"}}>Confidence by tier</h3>

            {[
              {label:"CONFIRMED",count:11,pct:"90%+",color:"#ef4444",
               text:"Backed by 3+ independent major outlets (AP, Reuters, CNN, BBC, Al Jazeera, etc). Satellite imagery or BBC Verify/CNN Verified corroboration where available. We are highly confident strikes occurred at these locations. Coordinates are approximate — placed by neighbourhood/street name, not geolocated footage, so markers may be off by several hundred metres."},
              {label:"LIKELY",count:7,pct:"60–75%",color:"#f59e0b",
               text:"Backed by 1–2 credible sources, verified video, or BBC Verify confirmation. Strong evidence but fewer independent sources. Some entries (e.g. Ferdowsi Square) come from a single state broadcaster (CGTN). Khatam-al-Anbia Hospital is the strongest in this tier and may be upgraded. Niloofar Square has a specific casualty figure but the underlying Iranian source couldn't be independently traced."},
              {label:"UNVERIFIED",count:3,pct:"30–40%",color:"#10b981",
               text:"Sourced primarily from LiveUAMap (which returned a 403 error on the specific page linked) or Iranian social media. With Iran's internet at ~1%, these could be real strikes not yet picked up by major outlets, or they could be misidentified explosions, sonic booms, or air defence activity. No way to tell without further corroboration."},
            ].map((tier,i)=>(
              <div key={i} style={{background:dk?`${tier.color}11`:`${tier.color}15`,border:`1px solid ${tier.color}33`,borderRadius:8,padding:12,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:tier.color}}/>
                  <span style={{fontSize:12,fontWeight:700,color:tier.color}}>{tier.label} ({tier.count} sites)</span>
                  <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:tier.color}}>~{tier.pct} confidence</span>
                </div>
                <p style={{fontSize:11,color:t.tx2,lineHeight:1.55,margin:0}}>{tier.text}</p>
              </div>
            ))}

            <h3 style={{fontSize:13,fontWeight:700,color:t.hd,marginTop:16,marginBottom:8,fontFamily:"'Georgia', serif"}}>Key limitations</h3>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {title:"Location accuracy",text:"Markers placed by neighbourhood/street name, not GPS from geolocated footage. Some could be off by several hundred metres."},
                {title:"Coverage gaps",text:"Almost certainly missing Tehran strikes that haven't made it into English-language reporting. The 21 sites are a floor, not a ceiling."},
                {title:"Source access",text:"LiveUAMap returned 403 on the specific Farmanieh page. MahsaAlert was a JS-only dynamic map with no extractable text. Neither could be fully verified."},
                {title:"Source bias",text:"Iranian state media may overstate civilian impact for political purposes. IDF/CENTCOM confirm targets but won't acknowledge civilian harm. Truth likely lies in between."},
                {title:"Internet blackout",text:"Iran's internet at ~1% since strikes began. Severely limits real-time verification, especially for Mar 2 morning reports."},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 10px",background:t.cBg,border:`1px solid ${t.cBd}`,borderRadius:6}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:t.hd}}>{item.title}</div>
                    <p style={{fontSize:10,color:t.tx2,margin:"2px 0 0",lineHeight:1.45}}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:16,padding:12,background:t.wBg,border:`1px solid ${t.wBd}`,borderRadius:8}}>
              <p style={{fontSize:11,color:t.wTx,lineHeight:1.5,margin:0}}>
                <strong>This map is a snapshot, not a live feed.</strong> The conflict is actively evolving with new strike waves expected. Locations may be upgraded, downgraded, or added as new information emerges. If you have information about a strike not listed here, please use the "Suggest a Strike Location" button to submit it for verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUGGEST A STRIKE MODAL */}
      {suggestModal && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={()=>setSuggestModal(false)}>
          <div style={{background:t.srf,border:`1px solid ${t.bd2}`,borderRadius:12,padding:24,maxWidth:520,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700,color:t.hd,margin:0,fontFamily:"'Georgia', serif"}}>Suggest a Strike Location</h2>
                <p style={{fontSize:11,color:t.tx3,marginTop:2}}>Submissions are reviewed before being added to the map</p>
              </div>
              <button onClick={()=>setSuggestModal(false)} style={{background:"none",border:"none",color:t.tx3,fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>

            {submitSuccess ? (
              <div style={{textAlign:"center",padding:"30px 20px"}}>
                <h3 style={{fontSize:16,fontWeight:700,color:t.hd,marginBottom:6}}>Submission Received</h3>
                <p style={{fontSize:12,color:t.tx2,lineHeight:1.5,marginBottom:16}}>
                  Thank you. Your suggestion has been logged and will be reviewed against available sources before being added to the map. Submissions with verifiable source links are prioritised.
                </p>
                <button onClick={()=>setSuggestModal(false)} style={{background:dk?"rgba(16,185,129,0.15)":"#ecfdf5",border:`1px solid ${dk?"rgba(16,185,129,0.3)":"#6ee7b7"}`,color:dk?"#6ee7b7":"#065f46",borderRadius:6,padding:"8px 20px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div style={{background:t.wBg,border:`1px solid ${t.wBd}`,borderRadius:6,padding:10,marginBottom:16,fontSize:10,color:t.wTx,lineHeight:1.5}}>
                  <strong>Verification process:</strong> All submissions are reviewed before display. We cross-reference against wire services, major broadcasters, and wider media coverage. Submissions with direct source links (news articles, verified video, satellite imagery) are prioritised. Unverifiable reports will be held pending corroboration.
                </div>

                {[
                  {key:"location",label:"Location name / area *",placeholder:"e.g. Vanak Square, northern Tehran",type:"text"},
                  {key:"date",label:"Date & approximate time *",placeholder:"e.g. Mar 2, ~08:30 local time",type:"text"},
                  {key:"description",label:"What happened? *",placeholder:"Describe what was reported — explosion, smoke, structural damage, etc.",type:"textarea"},
                  {key:"sources",label:"Source links (crucial for verification)",placeholder:"Paste URLs to news articles, social media posts, video links, satellite imagery...",type:"textarea"},
                  {key:"contact",label:"Your contact (optional, for follow-up)",placeholder:"Email or social handle — completely optional",type:"text"},
                ].map(field=>(
                  <div key={field.key} style={{marginBottom:12}}>
                    <label style={{display:"block",fontSize:11,fontWeight:600,color:t.tx2,marginBottom:4}}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea value={suggestForm[field.key]} onChange={e=>setSuggestForm(p=>({...p,[field.key]:e.target.value}))}
                        placeholder={field.placeholder} rows={3}
                        style={{width:"100%",boxSizing:"border-box",background:t.cBg,border:`1px solid ${t.cBd}`,borderRadius:6,padding:"8px 10px",fontSize:12,color:t.tx,resize:"vertical",fontFamily:"inherit",outline:"none"}}/>
                    ) : (
                      <input value={suggestForm[field.key]} onChange={e=>setSuggestForm(p=>({...p,[field.key]:e.target.value}))}
                        placeholder={field.placeholder} type="text"
                        style={{width:"100%",boxSizing:"border-box",background:t.cBg,border:`1px solid ${t.cBd}`,borderRadius:6,padding:"8px 10px",fontSize:12,color:t.tx,fontFamily:"inherit",outline:"none"}}/>
                    )}
                  </div>
                ))}

                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button
                    onClick={async ()=>{
                      if(!suggestForm.location||!suggestForm.date||!suggestForm.description){return}
                      setSubmitting(true);
                      const sent = await submitToAirtable(suggestForm);
                      setSubmissions(prev=>[...prev,{...suggestForm,id:Date.now(),status:"pending",submitted:new Date().toISOString()}]);
                      setSuggestForm({location:"",date:"",description:"",sources:"",contact:""});
                      setSubmitSuccess(true);
                      setSubmitting(false);
                    }}
                    disabled={!suggestForm.location||!suggestForm.date||!suggestForm.description||submitting}
                    style={{flex:1,background:(!suggestForm.location||!suggestForm.date||!suggestForm.description)?(dk?"rgba(255,255,255,0.03)":"#f1f5f9"):(dk?"rgba(16,185,129,0.2)":"#ecfdf5"),border:`1px solid ${(!suggestForm.location||!suggestForm.date||!suggestForm.description)?t.bd2:(dk?"rgba(16,185,129,0.4)":"#6ee7b7")}`,color:(!suggestForm.location||!suggestForm.date||!suggestForm.description)?t.tx4:(dk?"#6ee7b7":"#065f46"),borderRadius:6,padding:"10px 16px",fontSize:12,fontWeight:700,cursor:(!suggestForm.location||!suggestForm.date||!suggestForm.description||submitting)?"not-allowed":"pointer"}}>
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </button>
                  <button onClick={()=>setSuggestModal(false)} style={{background:t.btn,border:`1px solid ${t.bd2}`,color:t.tx3,borderRadius:6,padding:"10px 16px",fontSize:12,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>

                {submissions.length > 0 && (
                  <div style={{marginTop:16,borderTop:`1px solid ${t.bd}`,paddingTop:12}}>
                    <h4 style={{fontSize:11,fontWeight:700,color:t.tx3,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your submissions ({submissions.length})</h4>
                    {submissions.map(sub=>(
                      <div key={sub.id} style={{padding:"8px 10px",marginBottom:4,background:t.cBg,border:`1px solid ${t.cBd}`,borderRadius:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:12,fontWeight:600,color:t.tx}}>{sub.location}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,background:dk?"rgba(245,158,11,0.12)":"#fef3c7",color:dk?"#fcd34d":"#92400e",border:`1px solid ${dk?"rgba(245,158,11,0.25)":"#fcd34d"}`}}>PENDING REVIEW</span>
                        </div>
                        <p style={{fontSize:10,color:t.tx3,margin:"2px 0 0"}}>{sub.date} — {sub.description.slice(0,80)}{sub.description.length>80?"…":""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
