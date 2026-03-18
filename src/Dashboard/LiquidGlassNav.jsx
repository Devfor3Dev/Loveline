/* ═══════════════════════════════════════════════════════════════
   LoveLine — Liquid Glass Navigation
   Ultra-realistic Apple liquid glass — transparent as a water drop
   Water-stretch morphing between tabs + text distortion
   ═══════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useTheme } from './useTheme.jsx';

const TABS = [
  {
    id: 'discover', label: 'Découvrir',
    icon: (active, T) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 20.5S3 14 3 8.5A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 9 4.5C21 14 12 20.5 12 20.5z"
          fill={active ? T.gold : 'none'}
          stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" strokeLinejoin="round" />
        {active && <circle cx="12" cy="9.5" r="2" fill={T.bg} />}
      </svg>
    ),
  },
  {
    id: 'explore', label: 'Explorer',
    icon: (active, T) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3"    y="3"    width="7.5" height="7.5" rx="2.5" fill={active ? T.gold+'25':'none'} stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" />
        <rect x="13.5" y="3"    width="7.5" height="7.5" rx="2.5" fill={active ? T.gold+'25':'none'} stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" />
        <rect x="3"    y="13.5" width="7.5" height="7.5" rx="2.5" fill={active ? T.gold+'25':'none'} stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.5" fill={active ? T.gold+'25':'none'} stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: 'likes', label: 'Likes',
    icon: (active, T, badge) => (
      <div style={{ position:'relative', display:'inline-flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 20.5S3 14 3 8.5A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 9 4.5C21 14 12 20.5 12 20.5z"
            fill={active ? T.rose+'BB':'none'} stroke={active ? T.rose : T.textSoft} strokeWidth="1.5" />
        </svg>
        {badge > 0 && (
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:500,damping:20}}
            style={{
              position:'absolute', top:-3, right:-3,
              minWidth:15, height:15, borderRadius:8,
              background: T.rose, color:'#fff',
              fontSize:8, fontWeight:800, fontFamily:"'DM Sans',sans-serif",
              display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
              boxShadow:`0 2px 6px ${T.rose}66`,
            }}>{badge>9?'9+':badge}</motion.div>
        )}
      </div>
    ),
  },
  {
    id: 'messages', label: 'Messages',
    icon: (active, T, badge) => (
      <div style={{ position:'relative', display:'inline-flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            fill={active ? T.gold+'22':'none'} stroke={active ? T.gold : T.textSoft} strokeWidth="1.5" strokeLinejoin="round" />
          {active && <>
            <circle cx="8.5"  cy="10.5" r="1" fill={T.gold}/>
            <circle cx="12"   cy="10.5" r="1" fill={T.gold}/>
            <circle cx="15.5" cy="10.5" r="1" fill={T.gold}/>
          </>}
        </svg>
        {badge > 0 && (
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:500,damping:20}}
            style={{
              position:'absolute', top:-3, right:-3,
              minWidth:15, height:15, borderRadius:8,
              background:T.gold, color:'#1A0812',
              fontSize:8, fontWeight:800, fontFamily:"'DM Sans',sans-serif",
              display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
              boxShadow:`0 2px 6px ${T.gold}66`,
            }}>{badge>9?'9+':badge}</motion.div>
        )}
      </div>
    ),
  },
  {
    id: 'profile', label: 'Profil',
    icon: (active, T, _badge, avatar) => (
      avatar
        ? <div style={{ width:26, height:26, borderRadius:'50%', overflow:'hidden', border:`2px solid ${active?T.gold:T.textSoft+'55'}`, transition:'border-color 0.25s' }}>
            <img src={avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
          </div>
        : <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill={active?T.gold+'22':'none'} stroke={active?T.gold:T.textSoft} strokeWidth="1.5" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active?T.gold:T.textSoft} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
    ),
  },
];

// ─── Water-drop sliding pill ──────────────────────────────────────────────────
function WaterPill({ prevPos, activePos, isTransitioning, T, isDark }) {
  const springX = useSpring(prevPos.left || 0, { stiffness: 320, damping: 28 });
  const springW = useSpring(prevPos.w    || 56, { stiffness: 320, damping: 28 });

  useEffect(() => {
    if (!activePos.left && activePos.left !== 0) return;
    if (isTransitioning) {
      const midX = Math.min(prevPos.left, activePos.left);
      const stretch = Math.abs(activePos.left - prevPos.left) + activePos.w;
      springX.set(midX);
      springW.set(stretch);
    } else {
      springX.set(activePos.left);
      springW.set(activePos.w);
    }
  }, [activePos, prevPos, isTransitioning]);

  return (
    <motion.div
      style={{
        position:'absolute',
        left: springX,
        width: springW,
        top:'50%', y:'-50%',
        height: 50,
        borderRadius: 25,
        // THE WATER DROP GLASS EFFECT
        background: isDark
          ? 'linear-gradient(140deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(212,175,55,0.07) 100%)'
          : 'linear-gradient(140deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 50%, rgba(212,175,55,0.06) 100%)',
        backdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.20)'
          : '1px solid rgba(255,255,255,0.96)',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.30), 0 4px 20px rgba(0,0,0,0.35)'
          : 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.07)',
        pointerEvents:'none',
        overflow:'hidden',
        zIndex:0,
      }}
    >
      {/* Top specular — makes it look like a real water drop */}
      <div style={{
        position:'absolute', top:'8%', left:'15%', width:'38%', height:'32%',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(255,255,255,0.30) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius:'50%', filter:'blur(1.5px)',
      }} />
      {/* Bottom secondary reflection */}
      <div style={{
        position:'absolute', bottom:'10%', right:'12%', width:'28%', height:'22%',
        background: isDark
          ? 'radial-gradient(ellipse, rgba(212,175,55,0.15) 0%, transparent 70%)'
          : 'radial-gradient(ellipse, rgba(255,255,255,0.65) 0%, transparent 70%)',
        borderRadius:'50%', filter:'blur(2px)',
      }} />
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function LiquidGlassNav({ activeTab, onTabChange, badges={}, userAvatar }) {
  const { T, isDark } = useTheme();
  const [prevTab,         setPrevTab]         = useState(activeTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navRef  = useRef(null);
  const tabRefs = useRef({});
  const [positions, setPositions] = useState({});

  const measure = useCallback(() => {
    if (!navRef.current) return;
    const navRect = navRef.current.getBoundingClientRect();
    const pos = {};
    TABS.forEach(t => {
      const el = tabRefs.current[t.id];
      if (el) {
        const r = el.getBoundingClientRect();
        pos[t.id] = { left: r.left - navRect.left, w: r.width };
      }
    });
    setPositions(pos);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, [measure]);

  const handleClick = useCallback((tabId) => {
    if (tabId === activeTab) { onTabChange(tabId); return; }
    setPrevTab(activeTab);
    setIsTransitioning(true);
    onTabChange(tabId);
    setTimeout(() => setIsTransitioning(false), 320);
  }, [activeTab, onTabChange]);

  const activePos = positions[activeTab] || { left:0, w:56 };
  const prevPos   = positions[prevTab]   || activePos;

  return (
    <>
      {/* SVG goo filter */}
      <svg style={{position:'fixed',width:0,height:0,overflow:'hidden',zIndex:-1}} aria-hidden="true">
        <defs>
          <filter id="ll-goo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:1000,
        padding:'0 10px',
        paddingBottom:'max(10px, env(safe-area-inset-bottom))',
      }}>
        {/* ── Frosted tray ── */}
        <div
          ref={navRef}
          style={{
            position:'relative',
            background: isDark
              ? 'rgba(16, 8, 18, 0.72)'
              : 'rgba(253, 246, 240, 0.72)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            borderRadius: 28,
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.90)',
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.55)'
              : 'inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(26,8,18,0.09), 0 2px 6px rgba(26,8,18,0.05)',
            padding:'6px 2px',
            // Goo filter unifies the sliding pill with the tray
            filter: 'url(#ll-goo)',
          }}
        >
          {/* Top glass edge highlight */}
          <div style={{
            position:'absolute', top:0, left:'8%', right:'8%', height:1,
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)',
            borderRadius:1, pointerEvents:'none', zIndex:5,
          }} />

          {/* Sliding water drop */}
          {Object.keys(positions).length > 0 && (
            <WaterPill
              prevPos={prevPos} activePos={activePos}
              isTransitioning={isTransitioning}
              T={T} isDark={isDark}
            />
          )}

          {/* Tab buttons */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around', position:'relative', zIndex:2 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const badge    = tab.id==='likes' ? badges.likes : tab.id==='messages' ? badges.messages : 0;
              return (
                <button
                  key={tab.id}
                  ref={el => { tabRefs.current[tab.id] = el; }}
                  onClick={() => handleClick(tab.id)}
                  style={{
                    flex:1, display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:2,
                    padding:'8px 2px', minHeight:54,
                    background:'none', border:'none', cursor:'pointer',
                    borderRadius:22, outline:'none',
                    WebkitTapHighlightColor:'transparent',
                  }}
                >
                  {/* Icon spring bounce */}
                  <motion.div
                    animate={isActive
                      ? { y:[0,-5,0], scale:[1,1.20,1] }
                      : { y:0, scale:1 }
                    }
                    transition={{ duration:0.30, ease:'easeOut' }}
                    style={{ lineHeight:0 }}
                  >
                    {tab.icon(isActive, T, badge, userAvatar)}
                  </motion.div>

                  {/* Animated label */}
                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 4,
                      height: isActive ? 11 : 0,
                    }}
                    transition={{ duration:0.20 }}
                    style={{
                      fontFamily:"'DM Sans',sans-serif",
                      fontSize:9, fontWeight:700,
                      letterSpacing:'0.06em', textTransform:'uppercase',
                      color: T.gold, whiteSpace:'nowrap', overflow:'hidden',
                      lineHeight:1,
                    }}
                  >
                    {tab.label}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>

        {/* iOS home indicator */}
        <div style={{
          width:130, height:4, borderRadius:2, margin:'6px auto 0',
          background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
        }} />
      </nav>
    </>
  );
}
