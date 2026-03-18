import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STRIKES = [
  // ── CONFIRMED (45) ──
  {id:1,n:"Supreme Leader's Compound (Pasteur District)",lat:35.700,lng:51.423,c:"confirmed",d:"Feb 28",
   t:"Khamenei's residence & office compound destroyed. Satellite confirms. Khamenei, family & Shamkhani killed.",
   s:["AP","CNN","CNN (satellite/Airbus)","Al Jazeera","BBC","Reuters","CBS","NPR","CTP-ISW"],cat:"Leadership"},
  {id:2,n:"IRGC HQ / Thar-Allah Headquarters (D11)",lat:35.696,lng:51.416,c:"confirmed",d:"Feb 28",
   t:"IDF levelled General Staff & Thar-Allah HQ.",
   s:["IDF","Fars News","Al Jazeera","Wikipedia"],cat:"Military"},
  {id:3,n:"University St / Jomhouri Area (D11)",lat:35.694,lng:51.405,c:"confirmed",d:"Feb 28",
   t:"Multiple missiles. Two students killed.",
   s:["Fars News","Al Jazeera","CNN","Wikipedia"],cat:"Mixed"},
  {id:4,n:"Ministry of Intelligence — ×10 sites (D12)",lat:35.689,lng:51.389,c:"confirmed",d:"Feb 28–Mar 1",
   t:"HQ struck. IDF hit 10 MoI sites + 1 Quds Force site at night. Baseri & Rezaeian killed.",
   s:["Al Jazeera","Fars News","IDF","Wikipedia"],cat:"Government"},
  {id:5,n:"Ministry of Defence (D4, Lavizan)",lat:35.735,lng:51.475,c:"confirmed",d:"Feb 28",
   t:"Defence Ministry complex targeted in initial wave.",
   s:["Al Jazeera","Fars News","Iranian state media"],cat:"Government"},
  {id:6,n:"Seyyed Khandan (D3)",lat:35.744,lng:51.440,c:"confirmed",d:"Feb 28",
   t:"Explosions confirmed by Tasnim.",
   s:["Tasnim News","Al Jazeera","Wikipedia"],cat:"Mixed"},
  {id:7,n:"Atomic Energy Org. of Iran (D6, Amirabad)",lat:35.720,lng:51.395,c:"confirmed",d:"Feb 28",
   t:"AEOI HQ targeted.",
   s:["Al Jazeera","Iranian media"],cat:"Nuclear"},
  {id:8,n:"State Radio & TV HQ — IRIB ×3+ (D3)",lat:35.715,lng:51.406,c:"confirmed",d:"Feb 28, Mar 1, Mar 3",
   t:"State broadcaster struck at least 3 times. IRIB switched to internet streaming after Mar 3 hit.",
   s:["Iranian media","Wikipedia","IDF","Al Jazeera","CNN (Pleitgen/Polglase)","Red Crescent"],cat:"Government"},
  {id:9,n:"Azadi Tower / Azadi Square (D2)",lat:35.700,lng:51.338,c:"confirmed",d:"Mar 1, Mar 6",
   t:"CNN verified explosion footage. New explosions Mar 6 (AJ video).",
   s:["CNN","Al Jazeera (video)","Wikipedia"],cat:"Landmark"},
  {id:10,n:"Azadi Complex Indoor Arena (D2)",lat:35.712,lng:51.336,c:"confirmed",d:"Mar 1–2",
   t:"12,000-seat arena destroyed. Used to station military forces.",
   s:["Wikipedia (2026 Iran war)"],cat:"Military/Civilian"},
  {id:11,n:"Azadi Stadium Area (D2)",lat:35.718,lng:51.334,c:"confirmed",d:"Mar 1",
   t:"Explosions near stadium.",
   s:["Wikipedia","Iranian media"],cat:"Landmark"},
  {id:12,n:"Gandhi Hospital (D3, Gandhi St)",lat:35.759,lng:51.410,c:"confirmed",d:"Mar 1",
   t:"Newborns evacuated. WHO condemned. CNN verified 2000lb bomb crater 100ft from hospital via satellite. ICRC visited. Red Crescent documented.",
   s:["Al Jazeera","Anadolu Agency","ISNA","Tasnim News","TRT World","Times of Israel","Globe and Mail","Middle East Eye","NDTV","Reuters","WHO","ICRC","CNN (satellite analysis)","Red Crescent"],cat:"Civilian/Medical"},
  {id:13,n:"Assembly of Experts Building (D12, Baharestan Sq)",lat:35.6919,lng:51.4278,c:"confirmed",d:"Mar 2–3",
   t:"Old parliament / Senate bldg now used by Assembly of Experts. Struck during session. Also hit in Qom.",
   s:["Fars News","Tasnim News","Iranian state media","Iran International","Critical Threats","Timeline wiki"],cat:"Government"},
  {id:14,n:"SNSC + Presidential Office (Pasteur complex, D11)",lat:35.700,lng:51.424,c:"confirmed",d:"Mar 3",
   t:"~100 jets, 250+ bombs on 'leadership complex'.",
   s:["IDF","Critical Threats","Times of Israel"],cat:"Leadership"},
  {id:15,n:"Expediency Discernment Council (D11, Pasteur area)",lat:35.700,lng:51.425,c:"confirmed",d:"Mar 3",
   t:"Destroyed alongside SNSC in same Pasteur complex strike wave.",
   s:["Wikipedia (2026 Iran war)","IDF"],cat:"Government"},
  {id:16,n:"'Minzadehei' Nuclear Compound (D4, outskirts)",lat:35.750,lng:51.550,c:"confirmed",d:"Mar 3",
   t:"Secret underground weapons facility destroyed.",
   s:["IDF","CNN","Times of Israel","JNS","Jerusalem Post","ABC","WION","Ynet","Critical Threats"],cat:"Nuclear"},
  {id:17,n:"Parchin Military Complex (Tehran Province, SE)",lat:35.520,lng:51.770,c:"confirmed",d:"Mar 3, 5, 7",
   t:"Hit multiple waves. Warhead factories, Taleghan 2. IDF: 'most central' production sites. CTP-ISW satellite confirms underground facility hit.",
   s:["IDF","Israeli analyst (sat imagery)","Critical Threats"],cat:"Military/Nuclear"},
  {id:18,n:"Niloofar Sq / Police Station 104 (D7, Abbas Abad)",lat:35.705,lng:51.435,c:"confirmed",d:"Mar 2",
   t:"Double-tap. 20+ civilians killed. Police Stn 104 was target. AJ/Anadolu published aftermath photos. Red Crescent rescue teams documented.",
   s:["Wikipedia","FDD","AP photo","AJ (Anadolu photos)","Red Crescent"],cat:"Civilian/Police"},
  {id:19,n:"Golestan Palace area — UNESCO (D12)",lat:35.680,lng:51.422,c:"confirmed",d:"Mar 1–2",
   t:"UNESCO World Heritage Site damaged. UNESCO officially verified. Iran Cultural Heritage Ministry: 56 cultural sites damaged in first 2 weeks.",
   s:["Wikipedia (2026 Iran war)","UNESCO","Iran Cultural Heritage Ministry","CBS","AP"],cat:"Heritage"},
  {id:20,n:"Basij Headquarters (D11/12)",lat:35.695,lng:51.415,c:"confirmed",d:"Mar 3–4",
   t:"Basij HQ struck. CTP-ISW Mar 9: 11+ Basij bases hit. 23 total exist. Alma Center: checkpoints + bases ongoing targets.",
   s:["Wikipedia","IDF","Al Jazeera","CTP-ISW","Alma Center"],cat:"Military"},
  {id:21,n:"Law Enforcement Command — FARAJA (D12)",lat:35.690,lng:51.400,c:"confirmed",d:"Mar 2",
   t:"FARAJA building destroyed.",
   s:["LiveUAMap","FDD"],cat:"Police"},
  {id:22,n:"Mehrabad International Airport (D9)",lat:35.689,lng:51.311,c:"confirmed",d:"Mar 7, 11, 12+",
   t:"IDF destroyed 16 Quds Force aircraft. Major domestic airport. Ongoing targeting confirmed by Alma Center.",
   s:["IDF","Al Jazeera","NDTV","Wikipedia","Alma Center"],cat:"Military/Transport"},
  {id:23,n:"Aghdasieh Oil Warehouse (D1/4, NE Tehran)",lat:35.790,lng:51.470,c:"confirmed",d:"Mar 7–8",
   t:"Named by AJ. Part of 4-facility oil strike. Black rain over Tehran.",
   s:["Al Jazeera","Fars News","AP (video)","TIME","NPR"],cat:"Oil/Energy"},
  {id:24,n:"Tehran Refinery (D20, south)",lat:35.590,lng:51.430,c:"confirmed",d:"Mar 7–8",
   t:"Major refinery struck. IDF: 'used to operate military infrastructure'.",
   s:["Al Jazeera","Fars News","AP","IDF"],cat:"Oil/Energy"},
  {id:25,n:"Shahran Oil Depot (D5, west)",lat:35.750,lng:51.330,c:"confirmed",d:"Mar 7–8",
   t:"Oil leaked into streets. Witnesses confirmed.",
   s:["Al Jazeera","Fars News","witnesses"],cat:"Oil/Energy"},
  {id:26,n:"IRGC Air Force Command Center (D6/11)",lat:35.710,lng:51.420,c:"confirmed",d:"Mar 7",
   t:"'Most central air defense operations room of IRGC air force'. Systems & warehouses nearby also hit.",
   s:["IDF","Times of Israel"],cat:"Military"},
  {id:27,n:"Ballistic Missile Production Sites ×2 (D11/12)",lat:35.700,lng:51.410,c:"confirmed",d:"Mar 5–7",
   t:"IDF: struck 'two most central' missile production sites. Incl. Quds Force weapons depot.",
   s:["IDF","Times of Israel"],cat:"Military"},
  {id:28,n:"Tehran Grand Bazaar area (D12)",lat:35.676,lng:51.423,c:"confirmed",d:"Mar 2–3",
   t:"Major historical bazaar reported damaged.",
   s:["Civilian sites list","Iranian media"],cat:"Heritage/Civilian"},
  {id:63,n:"Supreme Court + Prosecutor General (D12)",lat:35.692,lng:51.418,c:"confirmed",d:"Mar 3",
   t:"Satellite GIF confirms destruction. Part of Mar 3 judicial/govt wave.",
   s:["CTP-ISW (satellite GIF)","FT"],cat:"Government"},
  {id:64,n:"IRGC Missile Component Factory (D2/5, W. Tehran)",lat:35.695,lng:51.350,c:"confirmed",d:"Mar 3",
   t:"IRGC-affiliated site developing components for SSMs & SAMs.",
   s:["IDF","CTP-ISW"],cat:"Military/Industrial"},
  {id:65,n:"Chemical Plant, Garmdareh (Alborz Province)",lat:35.780,lng:51.200,c:"confirmed",d:"Mar 3",
   t:"Produces raw materials for solid-fuel missiles. West of Tehran in Alborz Province.",
   s:["IDF","CTP-ISW","Iran International"],cat:"Military/Industrial"},
  {id:66,n:"Ammonium Perchlorate Facility, Parand (SW Tehran)",lat:35.480,lng:51.020,c:"confirmed",d:"Mar 3",
   t:"IRGC facility processing ammonium perchlorate for solid-fuel missiles. ~4km from Malard missile site.",
   s:["IDF","CTP-ISW","anti-regime Iranian media"],cat:"Military/Industrial"},
  {id:67,n:"Imam Sajjad Missile Base (SW Tehran)",lat:35.550,lng:51.100,c:"confirmed",d:"Mar 3",
   t:"Named missile base struck by IDF. Southwest of Tehran.",
   s:["IDF","CTP-ISW","Fars News","AJ"],cat:"Military"},
  {id:68,n:"Imam Khomeini Intl Airport radar (S. Tehran)",lat:35.416,lng:51.152,c:"confirmed",d:"Mar 3",
   t:"Destroyed radar dome near IKIA airfield. Part of integrated air defense degradation. Separate from Mehrabad.",
   s:["IDF","CTP-ISW","CENTCOM"],cat:"Military/Transport"},
  {id:71,n:"IRGC Quds Force Headquarters (D11/12)",lat:35.698,lng:51.420,c:"confirmed",d:"Mar 4, Mar 9",
   t:"Extraterritorial arm of IRGC controlling all proxy militias. Hit twice. CTP-ISW: 'primary means of controlling Axis of Resistance'.",
   s:["anti-regime Iranian media","CTP-ISW","IDF"],cat:"Military"},
  {id:72,n:"Imam Hossein University — underground R&D (D4/8)",lat:35.730,lng:51.460,c:"confirmed",d:"Mar 9–10",
   t:"Underground tunnel for IRGC ballistic missile production research & testing. CENTCOM independently confirmed destroying IRGC command & control.",
   s:["IDF","CENTCOM","CTP-ISW","AJ","Iran International"],cat:"Military/Nuclear"},
  {id:81,n:"4th Tehran Karbala Basij Regional Base (D4, NE)",lat:35.770,lng:51.480,c:"confirmed",d:"Mar 9",
   t:"One of 23 Basij regional bases in Tehran. CTP-ISW: combined force struck 11+ Basij bases since Feb 28. Satellite imagery confirms.",
   s:["CTP-ISW (satellite imagery)","CTP-ISW"],cat:"Military"},
  {id:82,n:"Sahab Pardaz Company — internet censorship (D6/11)",lat:35.710,lng:51.425,c:"confirmed",d:"Mar 9",
   t:"Internet censorship/surveillance company. US-sanctioned Oct 2022. Strike came as internet blackout entered 10th day.",
   s:["CTP-ISW","US Treasury"],cat:"Government/Tech"},
  {id:85,n:"Strike near Al-Quds Day rally (D11/12, Ferdowsi Sq)",lat:35.694,lng:51.410,c:"confirmed",d:"Mar 13",
   t:"Explosion during annual rally with thousands present. Israel warned area in advance. Judiciary head Mohseni Ejei on state TV when strike hit. At least 1 woman killed. President Pezeshkian, FM Araghchi attended.",
   s:["CNN","PBS","AP","AJ","Iranian state TV","Alma Center","France24","Middle East Eye","Irish Independent"],cat:"Military/Civilian"},
  {id:90,n:"Kharg Island military assets (Persian Gulf)",lat:26.220,lng:50.330,c:"confirmed",d:"Mar 13–14",
   t:"CENTCOM struck ~90 military targets. Naval mine storage, missile storage, Kharg Airport, Air Defense Complex, Matla ul Fajr radar destroyed. Oil facilities spared. Not Tehran — off map.",
   s:["CENTCOM","CBS","CNN","Reuters","TIME","Military.com"],cat:"Oil/Military"},
  {id:91,n:"Iranian Space Research Center (Tehran)",lat:35.720,lng:51.390,c:"confirmed",d:"Mar 14",
   t:"IDF struck primary Space Agency research center. Strategic labs for military satellite R&D used to direct IRGC fire. US-sanctioned 2019.",
   s:["ISW","IDF","Iran International","CGTN","Xinhua","TASS"],cat:"Military/Nuclear"},
  {id:92,n:"LEC Station 108, Navab (D10)",lat:35.688,lng:51.388,c:"confirmed",d:"Mar 14",
   t:"Police station used to suppress Dec 2025–Jan 2026 protests. Part of anti-repression campaign targeting internal security apparatus.",
   s:["ISW","IDF","Israeli journalist"],cat:"Police"},
  {id:93,n:"LEC Station 148, Enghelab (D6/11)",lat:35.700,lng:51.398,c:"confirmed",d:"Mar 14",
   t:"Police station in Enghelab neighborhood. Same anti-repression wave as LEC 108.",
   s:["ISW","IDF","Israeli journalist"],cat:"Police"},
  {id:94,n:"Air defense production sites (W. Tehran / Karaj)",lat:35.730,lng:51.310,c:"confirmed",d:"Mar 14",
   t:"IDF struck 'a key factory used to produce air defense systems' plus several production facilities west of Karaj and western Tehran.",
   s:["IDF","ISW","Hegseth (DoD)"],cat:"Military/Industrial"},
  // ── LIKELY (45) ──
  {id:29,n:"Narmak / 72 Sq — Ahmadinejad area (D8)",lat:35.738,lng:51.487,c:"likely",d:"Feb 28",
   t:"Videos of strikes near Ahmadinejad residence. High school damaged, 2+ children killed. Ahmadinejad death reports later disputed — may be alive.",
   s:["Al Jazeera","local authorities","Wikipedia","Iranian state media"],cat:"Leadership"},
  {id:30,n:"IRGC Admin Building (D8, Narmak)",lat:35.740,lng:51.490,c:"likely",d:"Mar 2",
   t:"Separate IRGC admin building. Video shows missile strike.",
   s:["FDD (video)"],cat:"Military"},
  {id:31,n:"Khatam-al-Anbia Hospital (D6)",lat:35.702,lng:51.422,c:"likely",d:"Mar 1",
   t:"Military-affiliated hospital. BBC Verify confirmed damage. Red Crescent released aftermath video. ICRC head of delegation visited. Motahari & Valiasr hospitals also affected nearby.",
   s:["BBC Verify","NPR","Wikipedia","Red Crescent (video)","ICRC","WHO","AJ","CNN"],cat:"Civilian/Medical"},
  {id:32,n:"Tehran Revolutionary Court (D12)",lat:35.690,lng:51.410,c:"confirmed",d:"Feb 28–Mar 3",
   t:"Court destroyed. CTP-ISW satellite GIF confirms strike.",
   s:["Wikipedia","Iranian media","CTP-ISW (satellite GIF)","FT"],cat:"Government"},
  {id:33,n:"Milad Tower Area (D2)",lat:35.745,lng:51.375,c:"likely",d:"Mar 1",
   t:"Explosions near tallest tower.",
   s:["Wikipedia","Iranian media"],cat:"Landmark"},
  {id:34,n:"Ferdowsi Square (D12)",lat:35.6965,lng:51.4185,c:"likely",d:"Mar 2",
   t:"Named in IAF wave report.",
   s:["CGTN","Pravda (images)","IDF"],cat:"Downtown"},
  {id:35,n:"Tajrish (D1, N. Tehran)",lat:35.800,lng:51.434,c:"likely",d:"Mar 2",
   t:"Named alongside Ferdowsi Sq.",
   s:["CGTN"],cat:"Mixed"},
  {id:36,n:"IRGC Malek-Ashtar Building (D4, Lavizan)",lat:35.770,lng:51.505,c:"likely",d:"Mar 2",
   t:"Video: building completely destroyed.",
   s:["Iran International (video)","Wikipedia","FDD"],cat:"Military/Nuclear"},
  {id:37,n:"Central Prison Complex (D3, near IRIB)",lat:35.720,lng:51.412,c:"likely",d:"Mar 2",
   t:"AJ reported strikes near IRIB & central prison.",
   s:["Al Jazeera (video)"],cat:"Government"},
  {id:38,n:"Majlis / Parliament (D12, Baharestan Sq)",lat:35.6919,lng:51.4278,c:"likely",d:"Mar 1–2",
   t:"Fars reported explosions near parliament.",
   s:["Fars News","Iranian state media","JFeed"],cat:"Government"},
  {id:39,n:"Ba'ath Hospital area (D13/14, E. Tehran)",lat:35.700,lng:51.480,c:"likely",d:"Mar 4",
   t:"Columns of smoke. Mehr images.",
   s:["Tabnak","Entekhab","Mehr (images)"],cat:"Civilian/Medical"},
  {id:40,n:"Aryashahr Police Special Forces HQ (D2/5)",lat:35.700,lng:51.350,c:"likely",d:"Mar 2",
   t:"Police SF HQ reportedly destroyed.",
   s:["FDD"],cat:"Police"},
  {id:41,n:"Security Police building (D18, Yaftabad)",lat:35.660,lng:51.330,c:"likely",d:"Mar 2",
   t:"Images show building hit.",
   s:["FDD (images)"],cat:"Police"},
  {id:42,n:"Police Station 151 (D18, Yaftabad)",lat:35.658,lng:51.328,c:"likely",d:"Mar 2",
   t:"Completely destroyed. Second Yaftabad target.",
   s:["FDD"],cat:"Police"},
  {id:43,n:"Basij base (D16, Naziabad)",lat:35.655,lng:51.400,c:"likely",d:"Mar 2",
   t:"Basij base destroyed.",
   s:["FDD (videos)"],cat:"Military"},
  {id:44,n:"Police Station 140 (D5, Bagh-e Feyz)",lat:35.755,lng:51.360,c:"likely",d:"Mar 3",
   t:"Video shows ruins.",
   s:["FDD (video)"],cat:"Police"},
  {id:45,n:"Sohrevardi district positions (D7)",lat:35.715,lng:51.440,c:"likely",d:"Mar 2",
   t:"IR positions hit. Images circulated.",
   s:["FDD (images)"],cat:"Military"},
  {id:46,n:"Zero-Six Military Garrison (D3, Pasdaran)",lat:35.760,lng:51.460,c:"likely",d:"Mar 3",
   t:"Military garrison struck.",
   s:["Timeline wiki","FDD"],cat:"Military"},
  {id:47,n:"Basij / Internal Security (D2/5, W. Tehran wave)",lat:35.700,lng:51.360,c:"likely",d:"Mar 4",
   t:"IDF 'broad wave' targeting Basij & internal security.",
   s:["IDF","Al Jazeera"],cat:"Military"},
  {id:48,n:"Three-story bldg, Third Circle, Tehranpars (D4)",lat:35.745,lng:51.500,c:"likely",d:"Mar 2",
   t:"Residential building near Police Park area. Confirms D4 strike.",
   s:["Civilian sites list"],cat:"Residential"},
  {id:49,n:"Amneh Neonatal Care Center (D6/7)",lat:35.710,lng:51.430,c:"likely",d:"Mar 1–2",
   t:"Neonatal facility reported hit.",
   s:["Civilian sites list","Iranian media"],cat:"Civilian/Medical"},
  {id:50,n:"Shahid Rajaee Heart Hospital (D3/7)",lat:35.720,lng:51.450,c:"likely",d:"Mar 1–2",
   t:"Major cardiac hospital reported hit.",
   s:["Civilian sites list","Iranian media"],cat:"Civilian/Medical"},
  {id:51,n:"Maragheh residential area (D13/14)",lat:35.690,lng:51.450,c:"likely",d:"Mar 2",
   t:"27 killed in residential strike.",
   s:["Civilian sites list","Iranian media","WHO"],cat:"Residential"},
  {id:52,n:"Marzdaran Boulevard (D2/5)",lat:35.750,lng:51.350,c:"likely",d:"Mar 2–3",
   t:"Residential area on major W. Tehran boulevard.",
   s:["Civilian sites list"],cat:"Residential"},
  {id:53,n:"Shahid Falahi residential buildings (D11/12)",lat:35.700,lng:51.400,c:"likely",d:"Mar 5",
   t:"Residential buildings hit Mar 5.",
   s:["Civilian sites list"],cat:"Residential"},
  {id:54,n:"Mir Damad Boulevard residential (D3)",lat:35.750,lng:51.430,c:"likely",d:"Mar 3–5",
   t:"Residential buildings on major boulevard.",
   s:["Civilian sites list"],cat:"Residential"},
  {id:55,n:"Hospitals near Red Crescent building (D11/12)",lat:35.700,lng:51.415,c:"likely",d:"Mar 1",
   t:"Red Crescent: 'Direct attacks on vicinity of Red Crescent building, Khatam al-Anbiya Hospital, Welfare Organisation, and Motahari Hospital.' ICRC head of delegation visited & condemned.",
   s:["Red Crescent (video)","ICRC","AJ","Civilian sites list","Timeline wiki"],cat:"Civilian/Medical"},
  {id:56,n:"IRGC Compound — SE Tehran (ISW, Mar 4)",lat:35.665,lng:51.455,c:"likely",d:"Mar 4",
   t:"ISW: IDF struck compound housing IRGC Ground Forces, Navy, Quds Force, Basij & Intelligence HQs. Possibly IRGC Central Defense Command Center.",
   s:["ISW","IDF"],cat:"Military"},
  {id:61,n:"Narmak residential (D8, Iraaghi St)",lat:35.738,lng:51.490,c:"likely",d:"Mar 2",
   t:"Residential homes hit on named street in Narmak.",
   s:["Civilian sites list"],cat:"Residential"},
  {id:69,n:"Esteghlal Industrial Zone (D2/9, W. Tehran)",lat:35.700,lng:51.320,c:"likely",d:"Mar 3",
   t:"IDF evacuation order issued. Zone includes University of Applied Science & Farda Motors. Strike expected/likely occurred.",
   s:["CTP-ISW (satellite imagery)","Alma Center","Israeli analyst"],cat:"Industrial"},
  {id:70,n:"Karaj Helicopter Manufacturing Facility (Alborz)",lat:35.820,lng:50.980,c:"likely",d:"Mar 3",
   t:"IRGC-affiliated helicopter manufacturing facility. Near Payam Airport (also IDF evac warning).",
   s:["IDF","CTP-ISW","CNN"],cat:"Military/Industrial"},
  {id:73,n:"Special Forces HQ (D11/12, Mar 10 IDF wave)",lat:35.705,lng:51.415,c:"likely",d:"Mar 10",
   t:"Named by IDF in 80+ jet Mar 10 strike wave. Iran International independently named it as target.",
   s:["IDF","CTP-ISW","Iran International"],cat:"Military"},
  {id:74,n:"Ballistic Missile Fire Security Unit HQ (D11/12)",lat:35.700,lng:51.418,c:"likely",d:"Mar 10",
   t:"HQ of security unit responsible for ballistic missile fire. Named by IDF in Mar 10 strike wave.",
   s:["IDF","Times of Israel","CENTCOM","CTP-ISW"],cat:"Military"},
  {id:75,n:"Security Police Agency HQ (D11/12, Mar 10 wave)",lat:35.695,lng:51.412,c:"likely",d:"Mar 10",
   t:"Iran's Security Police agency headquarters. Named by IDF in Mar 10 strike wave.",
   s:["IDF","Times of Israel","CENTCOM","CTP-ISW"],cat:"Police"},
  {id:76,n:"Residential area strike — 40 killed (Mar 10)",lat:35.700,lng:51.420,c:"likely",d:"Mar 10",
   t:"40 killed in single residential strike — deadliest residential hit of the war. Red Crescent rescue teams in rubble. See also #88 for E. Tehran detail.",
   s:["IDF","Times of Israel","FDD","CNN (Polglase investigation)","Democracy Now","Reuters"],cat:"Residential"},
  {id:77,n:"Motahari Hospital — burn specialist (D6)",lat:35.702,lng:51.423,c:"likely",d:"Mar 1–2",
   t:"Burns specialist hospital. Red Crescent video names it directly. Damage reported, patients moved. Near Khatam & Red Crescent building.",
   s:["Red Crescent (video)","AJ","WANA/Reuters","Iran MFA"],cat:"Civilian/Medical"},
  {id:78,n:"Valiasr Hospital (D6)",lat:35.703,lng:51.421,c:"likely",d:"Mar 1–2",
   t:"Reported sustaining damage or moving patients out. Part of hospital cluster near Red Crescent building.",
   s:["AJ","Red Crescent","Iranian media"],cat:"Civilian/Medical"},
  {id:79,n:"Two schools in Parand (SW Tehran)",lat:35.480,lng:51.025,c:"likely",d:"Mar 5",
   t:"Fars shared photos of classroom damage and debris. Several nearby residential units also damaged. Near #66 ammonium perchlorate facility.",
   s:["Fars News","AJ","WANA/Reuters"],cat:"Civilian/Schools"},
  {id:80,n:"Welfare Organisation building (D6)",lat:35.702,lng:51.422,c:"likely",d:"Mar 1–2",
   t:"Named in Red Crescent video alongside Khatam Hospital, Motahari Hospital and Red Crescent building as strike-affected.",
   s:["Red Crescent (video)","AJ"],cat:"Government/Civilian"},
  {id:83,n:"Police Station 138, Jannat Abad (D5)",lat:35.755,lng:51.340,c:"likely",d:"Mar 3–5",
   t:"CNN investigation identified. Controversy: Red Crescent official caught labelling it as 'civilian' to ICRC visitors when it was a police station.",
   s:["CNN (Polglase investigation)","Red Crescent"],cat:"Police"},
  {id:84,n:"Shopping street strike (D11/12, central Tehran)",lat:35.695,lng:51.410,c:"likely",d:"Mar 6",
   t:"CNN's Fred Pleitgen reported from Tehran: state media reports a busy shopping street was hit. Day 8 — residents told CNN it was 'worst night' of airstrikes.",
   s:["CNN","Fars News"],cat:"Civilian"},
  {id:86,n:"Basij checkpoints — newly established (multiple districts)",lat:35.700,lng:51.410,c:"likely",d:"Mar 13",
   t:"IDF/IAF struck checkpoints and forces of Basij unit recently established in the city. New positions, not pre-existing bases. Part of Day 14 multi-location wave.",
   s:["Alma Center"],cat:"Military/Police"},
  {id:87,n:"Weapons & defense systems production (D11/12)",lat:35.700,lng:51.400,c:"likely",d:"Mar 12–13",
   t:"Alma: 'facilities used for production of weapons, defense systems, and components for ballistic missiles' struck alongside air defense base. Part of simultaneous 3-city wave.",
   s:["Alma Center","CTP-ISW"],cat:"Military/Industrial"},
  {id:88,n:"Three residential buildings (D4/8, E. Tehran)",lat:35.730,lng:51.470,c:"likely",d:"Mar 10",
   t:"Democracy Now: 'three residential buildings bombed simultaneously, missile struck nearby police station.' Survivors interviewed. More specific detail on 40-killed strike.",
   s:["Democracy Now","Reuters","AP","survivors"],cat:"Residential"},
  {id:89,n:"Air defense array central base (D6/11)",lat:35.710,lng:51.415,c:"likely",d:"Mar 13",
   t:"Alma: 'a central base of the regime's air defense array was targeted' in Tehran. May overlap with IRGC AF Command (#26) or separate facility.",
   s:["Alma Center"],cat:"Military"},
  {id:95,n:"Ballistic missile production near Malard (W. Tehran)",lat:35.660,lng:51.170,c:"likely",d:"Mar 15",
   t:"Israeli analyst citing IDF spokesperson: buildings linked to ballistic missile production west of Tehran near Malard Missile Launch Site. Iranian citizen confirmed 2 sites struck.",
   s:["ISW","IDF","Israeli analyst","Iranian OSINT"],cat:"Military/Industrial"},
  // ── UNVERIFIED (5) ──
  {id:57,n:"Farmanieh Street (D1)",lat:35.787,lng:51.463,c:"unverified",d:"Mar 2",
   t:"LiveUAMap only.",
   s:["LiveUAMap"],cat:"Unknown"},
  {id:58,n:"Sepah Square (D12)",lat:35.681,lng:51.421,c:"unverified",d:"Mar 2",
   t:"Single source. Civilian list corroborates residential damage nearby.",
   s:["Iranian media via LiveUAMap"],cat:"Unknown"},
  {id:59,n:"Khazaneh / Basij Bokharaei Base (D18)",lat:35.620,lng:51.440,c:"unverified",d:"Mar 2",
   t:"Presumably IRGC base.",
   s:["LiveUAMap"],cat:"Military"},
  {id:60,n:"Evin District — IDF evacuation warning (D1)",lat:35.805,lng:51.394,c:"unverified",d:"Mar 3–4",
   t:"IDF evacuation warning. Prison admin collapsed.",
   s:["IDF (evac warning)","NCRI"],cat:"Government/Prison"},
  {id:62,n:"Children's park, Tehran (D4/8)",lat:35.740,lng:51.500,c:"unverified",d:"Mar 2",
   t:"Reported hit. May overlap with Police Park misidentification or separate site.",
   s:["Civilian sites list"],cat:"Civilian"},
];

const TIER1=["AP","AP photo","AP (video)","Reuters","FT","WANA/Reuters","PBS"],TIER2=["CNN","CNN (satellite/Airbus)","CNN (satellite analysis)","CNN (Pleitgen/Polglase)","CNN (Polglase investigation)","BBC","BBC Verify","Al Jazeera","Al Jazeera (video)","AJ","AJ (Anadolu photos)","NPR","CBS","ABC","Anadolu Agency","TRT World","Times of Israel","Jerusalem Post","JNS","Globe and Mail","Middle East Eye","NDTV","WION","Ynet","TIME","ISW","Iran International","Iran International (video)","Critical Threats","CTP-ISW","CTP-ISW (satellite GIF)","CTP-ISW (satellite imagery)","Israeli analyst","Israeli analyst (sat imagery)","Israeli journalist","JFeed","UNESCO","WHO","ICRC","Red Crescent","Red Crescent (video)","Alma Center","US Treasury","France24","Irish Independent","Democracy Now","Military.com","Xinhua","TASS","CGTN"],TIER3=["Fars News","Tasnim News","Iranian state media","Iranian state TV","Iranian media","IRNA","ISNA","Iranian sources","NCRI","Mehr","Tabnak","Entekhab","Mehr (images)","Wikipedia","Wikipedia (2026 Iran war)","Timeline wiki","local authorities","witnesses","survivors","Civilian sites list","Anti-regime media","anti-regime Iranian media","Iran MFA","Iran Cultural Heritage Ministry","Iranian OSINT"],TIER4=["LiveUAMap","Iranian media via LiveUAMap","Pravda (images)","FDD","FDD (video)","FDD (images)","FDD (videos)"],OFFICIAL=["IDF","IDF (evac warning)","IDF (evacuation order)","CENTCOM","Hegseth (DoD)"];
const CONF={confirmed:{color:"#ef4444",label:"CONFIRMED",desc:"3+ independent major outlets corroborate"},likely:{color:"#f59e0b",label:"LIKELY",desc:"1–2 credible sources or verified video"},unverified:{color:"#10b981",label:"UNVERIFIED",desc:"Single source, often LiveUAMap only"}};
const counts={confirmed:45,likely:45,unverified:5};
const BOUNDS={minLat:35.40,maxLat:35.84,minLng:50.95,maxLng:51.80};
function toSVG(lat,lng){return{x:4+((lng-BOUNDS.minLng)/(BOUNDS.maxLng-BOUNDS.minLng))*92,y:4+((BOUNDS.maxLat-lat)/(BOUNDS.maxLat-BOUNDS.minLat))*67}}

const T = {
  dark: {
    bg:"#000000",srf:"#1a1a1a",srfAlt:"#222",tx:"#e0e0e0",tx2:"#888",tx3:"#888",tx4:"#555",hd:"#fff",
    bd:"#333",bd2:"#444",hvr:"rgba(40,40,50,0.9)",
    cBg:"#1a1a1a",cBd:"#333",
    btn:"#1a1a1a",btnA:"#333",
    mBg:"rgba(10,10,15,0.8)",mGr:"#1a1a1a",mLb:"#555",mLb2:"#888",
    mSt:"rgba(255,255,255,0.4)",mStS:"#fff",ttBg:"rgba(0,0,0,0.85)",ttLn:"#444",ttTx:"#fff",
    gBg:"rgba(99,102,241,0.1)",gBd:"rgba(99,102,241,0.3)",gTx:"#a5b4fc",
    wBg:"rgba(245,158,11,0.08)",wBd:"rgba(245,158,11,0.2)",wTx:"#fbbf24",
    tag:"#222",stBg:"#1a1a1a",
    s1:{bg:"rgba(34,197,94,0.18)",bd:"rgba(34,197,94,0.35)",tx:"#86efac"},
    s2:{bg:"rgba(59,130,246,0.15)",bd:"rgba(59,130,246,0.3)",tx:"#93c5fd"},
    s3:{bg:"rgba(245,158,11,0.12)",bd:"rgba(245,158,11,0.25)",tx:"#fcd34d"},
    s4:{bg:"rgba(239,68,68,0.12)",bd:"rgba(239,68,68,0.25)",tx:"#fca5a5"},
    sO:{bg:"rgba(168,85,247,0.15)",bd:"rgba(168,85,247,0.3)",tx:"#c4b5fd"},
    sD:{bg:"#222",bd:"#333",tx:"#888"},
    tC:["#86efac","#93c5fd","#fcd34d","#fca5a5","#c4b5fd"],
  },
  light: {
    bg:"rgb(240,238,231)",srf:"#f5f5f5",srfAlt:"#eeeeee",tx:"#333",tx2:"#666",tx3:"#888",tx4:"#999",hd:"#333",
    bd:"#d0d0d0",bd2:"#ccc",hvr:"#ebebeb",
    cBg:"#f5f5f5",cBd:"#d0d0d0",
    btn:"#f5f5f5",btnA:"#e8e8e8",
    mBg:"rgba(255,255,255,0.9)",mGr:"rgba(0,0,0,0.04)",mLb:"#999",mLb2:"#666",
    mSt:"rgba(0,0,0,0.2)",mStS:"#333",ttBg:"rgba(255,255,255,0.95)",ttLn:"rgba(0,0,0,0.15)",ttTx:"#333",
    gBg:"#eef2ff",gBd:"#a5b4fc",gTx:"#4f46e5",
    wBg:"#fffbeb",wBd:"#fcd34d",wTx:"#b45309",
    tag:"#ebebeb",stBg:"#f5f5f5",
    s1:{bg:"#dcfce7",bd:"#86efac",tx:"#166534"},
    s2:{bg:"#dbeafe",bd:"#93c5fd",tx:"#1e40af"},
    s3:{bg:"#fef3c7",bd:"#fcd34d",tx:"#92400e"},
    s4:{bg:"#fee2e2",bd:"#fca5a5",tx:"#991b1b"},
    sO:{bg:"#f3e8ff",bd:"#c4b5fd",tx:"#6b21a8"},
    sD:{bg:"#eeeeee",bd:"#d0d0d0",tx:"#666"},
    tC:["#166534","#1e40af","#92400e","#991b1b","#6b21a8"],
  }
};

function sC(src,t){if(TIER1.includes(src))return t.s1;if(TIER2.includes(src))return t.s2;if(TIER3.includes(src))return t.s3;if(TIER4.includes(src))return t.s4;if(OFFICIAL.includes(src))return t.sO;return t.sD;}

function formatBuildTime(iso){const d=new Date(iso);const mon=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];return `${mon} ${d.getUTCDate()}, ${d.getUTCFullYear()} — ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")} UTC`;}
function conflictDay(iso){const start=new Date("2026-02-28T00:00:00Z");return Math.floor((new Date(iso)-start)/86400000)+1;}
const BUILD_ISO=typeof __BUILD_TIMESTAMP__!=="undefined"?__BUILD_TIMESTAMP__:new Date().toISOString();
const LAST_UPDATED_STR=formatBuildTime(BUILD_ISO);
const CONFLICT_DAY=conflictDay(BUILD_ISO);

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
  const navigate = useNavigate();
  const mode = darkMode ? "dark" : "light";
  const t = T[mode]; const dk = darkMode;
  const list = flt==="all" ? STRIKES : STRIKES.filter(s=>s.c===flt);
  const s = sel ? STRIKES.find(x=>x.id===sel) : null;

  const tiers=[
    {n:"Tier 1 — Wire services",v:"AP, Reuters",d:"Gold standard. On-ground correspondents where possible"},
    {n:"Tier 2 — Major broadcasters / analysis",v:"CNN, BBC/BBC Verify, Al Jazeera, NPR, CBS, Anadolu, TRT World, Times of Israel, Jerusalem Post, Globe and Mail, Middle East Eye, NDTV, ISW, Iran International",d:"Independent geolocation, satellite analysis, verified footage"},
    {n:"Tier 3 — State/regional",v:"Fars, Tasnim, IRNA, ISNA, CGTN, Iranian sources, NCRI",d:"Reliable on confirming strikes occurred. May spin details politically"},
    {n:"Tier 4 — Aggregators (caution)",v:"LiveUAMap, MahsaAlert, Pravda (images)",d:"Crowdsourced or republished. Fast but not independently verified"},
    {n:"Official military claims",v:"IDF, CENTCOM",d:"First-party claims. Useful but inherently one-sided"},
  ];

  return (
    <div style={{background:t.bg,minHeight:"100vh",fontFamily:"Arial, sans-serif",color:t.tx,display:"flex",flexDirection:"column"}}>

      {/* Header */}
      <div style={{padding: isMobile ? '60px 16px 20px' : '20px 20px 24px 70px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:11,color:dk?'#ffd54f':'#8b6914',textTransform:'uppercase',letterSpacing:'1px',fontWeight:600,marginBottom:6,fontFamily:'Arial, sans-serif'}}>Trending: Geopolitics</div>
            <h1 style={{fontSize:22,fontWeight:'normal',color:dk?'#fff':'#1a1a1a',margin:0,fontFamily:'Georgia, serif'}}>
              Tehran Strike Map
            </h1>
            <p style={{fontSize:14,color:t.tx3,margin:'6px 0 0',fontFamily:'Arial, sans-serif'}}>
              Strike Verification Map — Updated {LAST_UPDATED_STR}
            </p>
          </div>
          <button
            onClick={()=>navigate('/trending/iran')}
            style={{padding:'8px 16px',background:dk?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)',border:`1px solid ${t.bd}`,color:t.tx,fontSize:12,cursor:'pointer',transition:'all 0.2s ease',fontFamily:'Arial, sans-serif',borderRadius:4}}
            onMouseEnter={e=>{e.currentTarget.style.background=dk?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.1)';e.currentTarget.style.borderColor=t.tx3}}
            onMouseLeave={e=>{e.currentTarget.style.background=dk?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)';e.currentTarget.style.borderColor=t.bd}}
          >
            ← Back to Feed
          </button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:14,marginTop:20,flexWrap:"wrap"}}>
          <div style={{background:t.stBg,border:`1px solid ${t.bd}`,padding:"10px 18px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 10px rgba(34,197,94,0.6)"}}/>
            <div>
              <div style={{fontSize:11,color:t.tx3,lineHeight:1,marginBottom:3}}>LAST UPDATED</div>
              <div style={{fontSize:15,color:t.hd,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{LAST_UPDATED_STR}</div>
            </div>
          </div>
          <div style={{background:t.stBg,border:`1px solid ${t.bd}`,padding:"10px 18px"}}>
            <div style={{fontSize:11,color:t.tx3,lineHeight:1,marginBottom:3}}>SITUATION</div>
            <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>ACTIVE — Strikes ongoing, new waves expected</div>
          </div>
          <span style={{background:"#dc2626",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",letterSpacing:1}}>DAY {CONFLICT_DAY}</span>
        </div>

        <div style={{display:"flex",gap:12,marginTop:20,flexWrap:"wrap"}}>
          <button onClick={()=>setConfModal(true)} style={{background:dk?"rgba(99,102,241,0.12)":"#eef2ff",border:`1px solid ${dk?"rgba(99,102,241,0.3)":"#a5b4fc"}`,color:dk?"#a5b4fc":"#4f46e5",padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            Confidence Statement
          </button>
          <button onClick={()=>{setSuggestModal(true);setSubmitSuccess(false)}} style={{background:dk?"rgba(16,185,129,0.12)":"#ecfdf5",border:`1px solid ${dk?"rgba(16,185,129,0.3)":"#6ee7b7"}`,color:dk?"#6ee7b7":"#065f46",padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
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
      <div style={{display:"flex",flexDirection: isMobile ? 'column' : 'row', padding: isMobile ? '0' : '0 20px 60px 70px', gap: isMobile ? 0 : 20, flexWrap:'wrap'}}>
        {/* Left Column — Map + Verification Guide */}
        <div style={{flex: isMobile ? '1' : '1 1 550px', minWidth: isMobile ? '100%' : 300, maxWidth: isMobile ? '100%' : '65%'}}>
        {/* Map */}
        <div style={{padding: isMobile ? "10px 12px 16px" : "8px", position: 'relative', background: dk ? t.mBg : 'rgba(255,255,255,0.9)', border:`1px solid ${t.bd}`, overflow:'hidden', maxHeight: isMobile ? 'none' : 'calc(100vh - 200px)'}}>
          <div style={{position:'absolute',top:12,right:12,zIndex:10,display:'flex',flexDirection:'column',gap:4}}>
            <button onClick={()=>setZoom(z=>Math.min(3,z+0.3))} title="Zoom in" style={{width:32,height:32,background:dk?'rgba(30,30,40,0.9)':'rgba(255,255,255,0.9)',border:`1px solid ${dk?'#444':'#ccc'}`,color:dk?'#fff':'#333',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            <button onClick={()=>setZoom(z=>Math.max(0.5,z-0.3))} title="Zoom out" style={{width:32,height:32,background:dk?'rgba(30,30,40,0.9)':'rgba(255,255,255,0.9)',border:`1px solid ${dk?'#444':'#ccc'}`,color:dk?'#fff':'#333',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
            <button onClick={()=>{setZoom(1);setPan({x:0,y:0})}} title="Reset view" style={{width:32,height:32,background:dk?'rgba(30,30,40,0.9)':'rgba(255,255,255,0.9)',border:`1px solid ${dk?'#444':'#ccc'}`,color:dk?'#fff':'#333',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>↺</button>
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

        {/* Verification Guide & Source Methodology — under map like analysis section */}
        <div style={{marginTop:12,padding:16,background:t.cBg,border:`1px solid ${t.bd}`}}>
          <div style={{fontSize:9,color:t.tx3,textTransform:'uppercase',letterSpacing:'1px',marginBottom:10,fontFamily:'Arial, sans-serif',fontWeight:600}}>
            Verification Guide &amp; Source Methodology
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
            {Object.entries(CONF).map(([k,c])=>(
              <div key={k} style={{flex:"1 1 140px",background:dk?`${c.color}11`:`${c.color}08`,border:`1px solid ${c.color}44`,padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:c.color}}/>
                  <span style={{fontSize:11,fontWeight:700,color:c.color,textTransform:'uppercase'}}>{c.label}</span>
                  <span style={{fontSize:18,fontWeight:800,color:c.color,marginLeft:"auto"}}>{counts[k]}</span>
                </div>
                <p style={{fontSize:11,color:t.tx2,lineHeight:1.4,margin:0}}>{c.desc}</p>
              </div>
            ))}
          </div>
          <div style={{fontSize:9,color:t.tx3,textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,fontFamily:'Arial, sans-serif',fontWeight:600}}>
            Source Reliability Ranking
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:12}}>
            {tiers.map((tr,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${t.bd}`}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:t.tC[i],marginTop:5,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <span style={{fontSize:12,fontWeight:700,color:t.tC[i]}}>{tr.n}</span>
                  <span style={{fontSize:12,color:t.tx2}}> — {tr.v}</span>
                  <p style={{fontSize:11,color:t.tx3,margin:"2px 0 0",lineHeight:1.4}}>{tr.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:t.wBg,border:`1px solid ${t.wBd}`,padding:"10px 14px",fontSize:12,color:t.wTx,lineHeight:1.5}}>
            <strong>Iran's internet is at ~1% connectivity</strong> since strikes began. This severely limits real-time verification, especially the Mar 2 morning reports.
          </div>
        </div>
        </div>

        {/* Right Panel — Tabs */}
        <div style={{flex: '1 1 380px', minWidth: isMobile ? '100%' : 320}}>
          {/* Tabs like Markets/Map Info */}
          <div style={{display:'flex',borderBottom:`1px solid ${t.bd}`,marginBottom:12}}>
            {[{k:"all",l:`All (${STRIKES.length})`},{k:"confirmed",l:`Confirmed (${counts.confirmed})`},{k:"likely",l:`Likely (${counts.likely})`},{k:"unverified",l:`Unverified (${counts.unverified})`}].map(tab=>(
              <button key={tab.k} onClick={()=>{setFlt(tab.k);setSel(null)}} style={{padding:'10px 16px',border:'none',background:'transparent',color:flt===tab.k?t.hd:t.tx3,fontSize:12,fontFamily:'Arial, sans-serif',cursor:'pointer',borderBottom:flt===tab.k?`2px solid ${dk?'#ffd54f':'#8b6914'}`:'2px solid transparent',transition:'all 0.2s ease',fontWeight:flt===tab.k?700:400,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                {tab.l}
              </button>
            ))}
          </div>

          <div style={{overflowY:'visible',padding: isMobile ? "0 16px 80px" : "0"}}>
          {s?(
            <div style={{padding:"16px",background:t.cBg,border:`1px solid ${t.bd}`,marginBottom:8}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:2,color:CONF[s.c].color,fontWeight:700,marginBottom:6}}>{CONF[s.c].label}</div>
              <h2 style={{fontSize:17,fontWeight:600,color:t.hd,margin:"0 0 10px",fontFamily:"'Georgia', serif"}}>{s.n}</h2>
              <div style={{display:"flex",gap:8,fontSize:11,color:t.tx3,marginBottom:14,alignItems:'center'}}>
                <span>{s.d}</span>
                <span style={{display:'inline-block',padding:"3px 8px",background:t.tag,border:`1px solid ${t.bd}`,fontSize:9,textTransform:'uppercase',letterSpacing:1}}>{s.cat}</span>
              </div>
              <p style={{fontSize:13,color:t.tx2,lineHeight:1.6,marginBottom:16,fontFamily:'Arial, sans-serif'}}>{s.t}</p>
              <div style={{marginBottom:14,paddingTop:12,borderTop:`1px solid ${t.bd}`}}>
                <div style={{fontSize:9,color:t.tx3,marginBottom:8,fontWeight:600,textTransform:'uppercase',letterSpacing:1}}>Sources ({s.s.length}) — {s.s.length>=3?"strong corroboration":s.s.length===2?"moderate corroboration":"single source"}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {s.s.map((src,i)=>{const sc=sC(src,t);return <span key={i} style={{fontSize:10,padding:"3px 10px",background:sc.bg,color:sc.tx,border:`1px solid ${sc.bd}`}}>{src}</span>})}
                </div>
              </div>
              {s.c==="unverified"&&(
                <div style={{background:t.wBg,border:`1px solid ${t.wBd}`,padding:"10px 12px",fontSize:11,color:t.wTx,marginBottom:14,lineHeight:1.4}}>
                  Single-source report. Iran's internet blackout (~1% connectivity) makes independent verification near-impossible.
                </div>
              )}
              <div style={{fontSize:11,color:t.tx4,padding:"8px 0",borderTop:`1px solid ${t.bd}`,fontFamily:'Arial, sans-serif'}}>
                {s.c==="confirmed"?"High confidence — independently verified by multiple major outlets":s.c==="likely"?"Medium confidence — credible but fewer independent verifications":"Low confidence — needs further corroboration"}
              </div>
              <button onClick={()=>setSel(null)} style={{marginTop:12,background:dk?'rgba(255,213,79,0.1)':'rgba(184,134,11,0.1)',border:`1px solid ${dk?'#6a5a2a':'#c9a227'}`,color:dk?'#ffd54f':'#b8860b',padding:"8px 14px",fontSize:11,cursor:"pointer",width:"100%",fontFamily:'Arial, sans-serif'}}>← Back to list</button>
            </div>
          ):(
            <>
              <div style={{padding:12,background:t.cBg,border:`1px solid ${t.bd}`,marginBottom:12,fontSize:11,lineHeight:1.5,color:t.tx3,fontFamily:'Arial, sans-serif'}}>
                <span style={{color:t.tx}}>Strike locations</span> cross-referenced from multiple outlets. Click any location for details and sources.
              </div>
              {(flt==="all"?["confirmed","likely","unverified"]:[flt]).map(lv=>{
                const items=STRIKES.filter(x=>x.c===lv);if(!items.length)return null;
                return items.map(st=>(
                  <div key={st.id} onClick={()=>setSel(st.id)} style={{padding:"10px 12px",cursor:"pointer",background:t.cBg,border:`1px solid ${t.bd}`,marginBottom:8,transition:"all .2s ease",fontFamily:'Arial, sans-serif'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=dk?'#666':'#999';e.currentTarget.style.background=dk?'rgba(40,40,50,0.9)':'#eee'}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.bd;e.currentTarget.style.background=t.cBg}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:CONF[st.c].color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,color:t.hd,fontWeight:600,lineHeight:1.4}}>{st.n}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:3}}>
                          <span style={{fontSize:11,color:t.tx3}}>{st.d}</span>
                          <span style={{fontSize:10,color:t.tx3,background:t.tag,padding:"2px 7px",border:`1px solid ${t.bd}`}}>{st.s.length} source{st.s.length!==1?"s":""}</span>
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

      {/* CONFIDENCE STATEMENT MODAL */}
      {confModal && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={()=>setConfModal(false)}>
          <div style={{background:dk?'#111':'#f5f5f5',border:`1px solid ${dk?'#333':'#ccc'}`,borderRadius:12,padding:24,maxWidth:620,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700,color:dk?'#fff':'#333',margin:0,fontFamily:"'Georgia', serif"}}>Confidence Statement</h2>
                <p style={{fontSize:11,color:dk?'#888':'#666',marginTop:2}}>Last updated: {LAST_UPDATED_STR}</p>
              </div>
              <button onClick={()=>setConfModal(false)} style={{background:"none",border:"none",color:dk?'#888':'#666',fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>

            <div style={{background:dk?'rgba(99,102,241,0.08)':'#eef2ff',border:`1px solid ${dk?'rgba(99,102,241,0.2)':'#c7d2fe'}`,borderRadius:8,padding:14,marginBottom:16}}>
              <p style={{fontSize:13,color:dk?'#e0e0e0':'#333',lineHeight:1.6,margin:0}}>
                This map compiles <strong style={{color:dk?'#fff':'#333'}}>{STRIKES.length} reported strike locations</strong> in Tehran from Feb 28, 2026 onward. It was built by cross-referencing multiple international news outlets, wire services, and open-source aggregators. It is <strong style={{color:dk?'#fff':'#333'}}>not exhaustive</strong> — Iran's near-total internet blackout (~1% connectivity) means many strikes likely remain unreported in English-language media.
              </p>
            </div>

            <h3 style={{fontSize:13,fontWeight:700,color:dk?'#fff':'#333',marginBottom:8,fontFamily:"'Georgia', serif"}}>Confidence by tier</h3>

            {[
              {label:"CONFIRMED",count:counts.confirmed,pct:"90%+",color:"#ef4444",
               text:"Backed by 3+ independent major outlets (AP, Reuters, CNN, BBC, Al Jazeera, etc). Satellite imagery or BBC Verify/CNN Verified corroboration where available. We are highly confident strikes occurred at these locations. Coordinates are approximate — placed by neighbourhood/street name, not geolocated footage, so markers may be off by several hundred metres."},
              {label:"LIKELY",count:counts.likely,pct:"60–75%",color:"#f59e0b",
               text:"Backed by 1–2 credible sources, verified video, or BBC Verify confirmation. Strong evidence but fewer independent sources. Some entries (e.g. Ferdowsi Square) come from a single state broadcaster (CGTN). Khatam-al-Anbia Hospital is the strongest in this tier and may be upgraded. Niloofar Square has a specific casualty figure but the underlying Iranian source couldn't be independently traced."},
              {label:"UNVERIFIED",count:counts.unverified,pct:"30–40%",color:"#10b981",
               text:"Sourced primarily from LiveUAMap (which returned a 403 error on the specific page linked) or Iranian social media. With Iran's internet at ~1%, these could be real strikes not yet picked up by major outlets, or they could be misidentified explosions, sonic booms, or air defence activity. No way to tell without further corroboration."},
            ].map((tier,i)=>(
              <div key={i} style={{background:dk?`${tier.color}11`:`${tier.color}15`,border:`1px solid ${tier.color}33`,borderRadius:8,padding:12,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:tier.color}}/>
                  <span style={{fontSize:12,fontWeight:700,color:tier.color}}>{tier.label} ({tier.count} sites)</span>
                  <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:tier.color}}>~{tier.pct} confidence</span>
                </div>
                <p style={{fontSize:11,color:dk?'#888':'#666',lineHeight:1.55,margin:0}}>{tier.text}</p>
              </div>
            ))}

            <h3 style={{fontSize:13,fontWeight:700,color:dk?'#fff':'#333',marginTop:16,marginBottom:8,fontFamily:"'Georgia', serif"}}>Key limitations</h3>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {title:"Location accuracy",text:"Markers placed by neighbourhood/street name, not GPS from geolocated footage. Some could be off by several hundred metres."},
                {title:"Coverage gaps",text:`Almost certainly missing Tehran strikes that haven't made it into English-language reporting. The ${STRIKES.length} sites are a floor, not a ceiling.`},
                {title:"Source access",text:"LiveUAMap returned 403 on the specific Farmanieh page. MahsaAlert was a JS-only dynamic map with no extractable text. Neither could be fully verified."},
                {title:"Source bias",text:"Iranian state media may overstate civilian impact for political purposes. IDF/CENTCOM confirm targets but won't acknowledge civilian harm. Truth likely lies in between."},
                {title:"Internet blackout",text:"Iran's internet at ~1% since strikes began. Severely limits real-time verification, especially for Mar 2 morning reports."},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 10px",background:dk?'#1a1a1a':'#f5f5f5',border:`1px solid ${dk?'#333':'#d0d0d0'}`,borderRadius:6}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:dk?'#fff':'#333'}}>{item.title}</div>
                    <p style={{fontSize:10,color:dk?'#888':'#666',margin:"2px 0 0",lineHeight:1.45}}>{item.text}</p>
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
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={()=>setSuggestModal(false)}>
          <div style={{background:dk?'#111':'#f5f5f5',border:`1px solid ${dk?'#333':'#ccc'}`,borderRadius:12,padding:24,maxWidth:520,width:"90%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:700,color:dk?'#fff':'#333',margin:0,fontFamily:"'Georgia', serif"}}>Suggest a Strike Location</h2>
                <p style={{fontSize:11,color:dk?'#888':'#666',marginTop:2}}>Submissions are reviewed before being added to the map</p>
              </div>
              <button onClick={()=>setSuggestModal(false)} style={{background:"none",border:"none",color:dk?'#888':'#666',fontSize:20,cursor:"pointer",padding:4}}>✕</button>
            </div>

            {submitSuccess ? (
              <div style={{textAlign:"center",padding:"30px 20px"}}>
                <h3 style={{fontSize:16,fontWeight:700,color:dk?'#fff':'#333',marginBottom:6}}>Submission Received</h3>
                <p style={{fontSize:12,color:dk?'#888':'#666',lineHeight:1.5,marginBottom:16}}>
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
                    <label style={{display:"block",fontSize:11,fontWeight:600,color:dk?'#e0e0e0':'#666',marginBottom:4}}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea value={suggestForm[field.key]} onChange={e=>setSuggestForm(p=>({...p,[field.key]:e.target.value}))}
                        placeholder={field.placeholder} rows={3}
                        style={{width:"100%",boxSizing:"border-box",background:dk?'#1a1a1a':'#fff',border:`1px solid ${dk?'#333':'#d0d0d0'}`,borderRadius:6,padding:"8px 10px",fontSize:12,color:dk?'#e0e0e0':'#333',resize:"vertical",fontFamily:"inherit",outline:"none"}}/>
                    ) : (
                      <input value={suggestForm[field.key]} onChange={e=>setSuggestForm(p=>({...p,[field.key]:e.target.value}))}
                        placeholder={field.placeholder} type="text"
                        style={{width:"100%",boxSizing:"border-box",background:dk?'#1a1a1a':'#fff',border:`1px solid ${dk?'#333':'#d0d0d0'}`,borderRadius:6,padding:"8px 10px",fontSize:12,color:dk?'#e0e0e0':'#333',fontFamily:"inherit",outline:"none"}}/>
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
                    style={{flex:1,background:(!suggestForm.location||!suggestForm.date||!suggestForm.description)?(dk?'#1a1a1a':'#f1f5f9'):(dk?"rgba(16,185,129,0.2)":"#ecfdf5"),border:`1px solid ${(!suggestForm.location||!suggestForm.date||!suggestForm.description)?(dk?'#333':'#ccc'):(dk?"rgba(16,185,129,0.4)":"#6ee7b7")}`,color:(!suggestForm.location||!suggestForm.date||!suggestForm.description)?(dk?'#555':'#999'):(dk?"#6ee7b7":"#065f46"),borderRadius:6,padding:"10px 16px",fontSize:12,fontWeight:700,cursor:(!suggestForm.location||!suggestForm.date||!suggestForm.description||submitting)?"not-allowed":"pointer"}}>
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </button>
                  <button onClick={()=>setSuggestModal(false)} style={{background:dk?'#1a1a1a':'#f5f5f5',border:`1px solid ${dk?'#333':'#ccc'}`,color:dk?'#888':'#666',borderRadius:6,padding:"10px 16px",fontSize:12,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>

                {submissions.length > 0 && (
                  <div style={{marginTop:16,borderTop:`1px solid ${dk?'#333':'#d0d0d0'}`,paddingTop:12}}>
                    <h4 style={{fontSize:11,fontWeight:700,color:dk?'#888':'#888',textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your submissions ({submissions.length})</h4>
                    {submissions.map(sub=>(
                      <div key={sub.id} style={{padding:"8px 10px",marginBottom:4,background:dk?'#1a1a1a':'#f5f5f5',border:`1px solid ${dk?'#333':'#d0d0d0'}`,borderRadius:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:12,fontWeight:600,color:dk?'#e0e0e0':'#333'}}>{sub.location}</span>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,background:dk?"rgba(245,158,11,0.12)":"#fef3c7",color:dk?"#fcd34d":"#92400e",border:`1px solid ${dk?"rgba(245,158,11,0.25)":"#fcd34d"}`}}>PENDING REVIEW</span>
                        </div>
                        <p style={{fontSize:10,color:dk?'#888':'#888',margin:"2px 0 0"}}>{sub.date} — {sub.description.slice(0,80)}{sub.description.length>80?"…":""}</p>
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
