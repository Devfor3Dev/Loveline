/**
 * ProfileCompletion.jsx  ·  LoveLine  ·  Université de Kara
 * ──────────────────────────────────────────────────────────
 * World-class dating app profile setup wizard.
 * Theme: Premium, Professional (Cream, Lavender, RoseDeep, Gold)
 * Typography: Outfit (display) + Inter (body)
 * Flow: Genre → Birthday → Academics → Interests → Bio → Photo → Preview
 */
import React, {
    useState, useEffect, useRef, useCallback, useMemo,
    useLayoutEffect, forwardRef, useImperativeHandle
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    motion, AnimatePresence, useMotionValue, useTransform,
    useSpring, useScroll, LayoutGroup, animate
} from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger }    from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import confetti from 'canvas-confetti';
import {
    Heart, ChevronRight, ChevronLeft, Camera, User, Calendar,
    Music, Plane, Coffee, Code2, Palette, BookOpen, Gamepad2,
    Film, Dumbbell, Utensils, Leaf, Check, Sparkles, Eye,
    Star, ArrowRight, GraduationCap, X, Globe, MapPin, Shield,
    RefreshCw, Feather, Award, Mic, Phone, Lock, ZoomIn, Crop
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Navbar from '../pages/nav_bar.jsx';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// PART 1 — tokens + config (Updated for a Professional Look)
const T = {
    white: '#FFFFFF',
    cream: '#FDF6F0',
    creamDark: '#F5EDE5',
    beige: '#F0EAD6',
    lavender: '#E6E6FA',
    lavenderSoft: '#F3F3FF',
    dark: '#1A0812',
    darkMid: '#2D1020',
    text: '#1A0812',
    textMid: '#4A3B42',
    textSoft: '#8F8BA3',
    textGhost: '#C4BFCF',
    roseDeep: '#880E4F',   // Main professional dark accent
    accent: '#E91E63',
    gold: '#D4AF37',
    goldDark: '#B8942E',
    goldSoft: '#FFF8E1',
    glass: 'rgba(255, 255, 255, 0.85)',
    glassDark: 'rgba(26, 8, 18, 0.7)',
    border: 'rgba(136, 14, 79, 0.15)',
    borderDark: 'rgba(136, 14, 79, 0.3)',
    shadow: '0 24px 80px rgba(136, 14, 79, 0.08)',
    shadowHigh: '0 40px 120px rgba(136, 14, 79, 0.15)',
    r4:'4px', r8:'8px', r12:'12px', r16:'16px', r20:'20px',
    r24:'24px', r28:'28px', r32:'32px', r48:'48px', r64:'64px',
    sp4:'4px', sp8:'8px', sp12:'12px', sp16:'16px', sp20:'20px',
    sp24:'24px', sp28:'28px', sp32:'32px', sp40:'40px', sp48:'48px',
    fontDisplay: "'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
};

// Added Academics step, adjusted percentages for 7 steps
const STEPS = [
    { id:'genre',     title:'Je suis…',            subtitle:'Dis-nous qui tu es',            icon:User,          pct:0   },
    { id:'birthday',  title:'Date de naissance',   subtitle:'Pour mieux te connaître',       icon:Calendar,      pct:16  },
    { id:'academics', title:'Mes études',          subtitle:'Ton parcours à l\'Université',   icon:BookOpen,      pct:33  },
    { id:'interests', title:'Mes passions',        subtitle:'Ce qui fait battre ton cœur',   icon:Heart,         pct:50  },
    { id:'bio',       title:'Mon histoire',        subtitle:'Raconte-toi en quelques mots',  icon:Sparkles,      pct:66  },
    { id:'photo',     title:'Ma photo',            subtitle:'Montre ton plus beau sourire',  icon:Camera,        pct:83  },
    { id:'preview',   title:'Mon profil',          subtitle:'Voilà qui tu es !',             icon:Eye,           pct:100 },
];

const INTERESTS_LIST = [
    { id:'music',    label:'Musique',           icon:Music,         c:'#6B6282' },
    { id:'travel',   label:'Voyages',           icon:Plane,         c:'#2563EB' },
    { id:'coffee',   label:'Café & Social',     icon:Coffee,        c:'#92400E' },
    { id:'coding',   label:'Coding',            icon:Code2,         c:'#059669' },
    { id:'art',      label:'Art & Design',      icon:Palette,       c:'#DC2626' },
    { id:'books',    label:'Lecture',           icon:BookOpen,      c:'#B45309' },
    { id:'gaming',   label:'Gaming',            icon:Gamepad2,      c:'#6B6282' },
    { id:'cinema',   label:'Cinéma',            icon:Film,          c:'#880E4F' },
    { id:'fitness',  label:'Sport & Fitness',   icon:Dumbbell,      c:'#DC2626' },
    { id:'cooking',  label:'Cuisine',           icon:Utensils,      c:'#D97706' },
    { id:'nature',   label:'Nature',            icon:Leaf,          c:'#16A34A' },
    { id:'dance',    label:'Danse',             icon:Sparkles,      c:'#880E4F' },
    { id:'photo',    label:'Photographie',      icon:Camera,        c:'#0891B2' },
    { id:'uni',      label:'Vie universitaire', icon:GraduationCap, c:'#880E4F' },
    { id:'football', label:'Football',          icon:Star,          c:'#16A34A' },
    { id:'globe',    label:'Culture mondiale',  icon:Globe,         c:'#0369A1' },
    { id:'poetry',   label:'Poésie',            icon:Feather,       c:'#B45309' },
    { id:'awards',   label:'Compétitions',      icon:Award,         c:'#D4AF37' },
];

const PLAN_LIST = [
    {
        name:'Étincelle', nameEn:'Free', price:0, period:'', highlight:false, gold:false, badge:null,
        desc:'Pour découvrir LoveLine et faire tes premiers pas.',
        features:['5 swipes par jour','Voir les profils du campus','1 message par match','Profil de base','Événements publics'],
        cta:'Commencer gratuitement',
    },
    {
        name:'Flamme', nameEn:'Premium', price:2500, period:'/ mois', highlight:true, gold:false, badge:'Le plus populaire',
        desc:'Pour ceux qui prennent les rencontres au sérieux.',
        features:['Swipes illimités','Voir qui t\'a liké','Messages illimités','Profil mis en avant','Filtres avancés','Événements exclusifs','1 Boost / semaine'],
        cta:'Commencer maintenant',
    },
    {
        name:'Éternité', nameEn:'VIP', price:5000, period:'/ mois', highlight:false, gold:true, badge:'Exclusif',
        desc:'L\'expérience LoveLine la plus complète et exclusive.',
        features:['Tout Flamme inclus','Badge VIP vérifié','Boosts illimités','Accès prioritaire','Messagerie vocale','Matching personnalisé','Soirées VIP campus'],
        cta:'Devenir VIP',
    },
];

const MAX_BIO_WORDS = 80;
const MIN_INTERESTS = 3;
const MAX_INTERESTS = 6;
const MIN_AGE = 16;

function countWords(str) { return str.trim().split(/\s+/).filter(Boolean).length; }
function calculateAge(d) {
    if (!d) return null;
    const t = new Date(), b = new Date(d);
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a;
}

// PART 2 — AnimatedMesh, FloatingHearts, ProgressIndicator

function useParticleCanvas(ref) {
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf, W, H;
        function resize() { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; }
        resize();
        const pts = Array.from({length:80}, () => ({
            x: Math.random()*W, y: Math.random()*H,
            vx:(Math.random()-.5)*.32, vy:(Math.random()-.5)*.32,
            r: Math.random()*1.8+.3, o: Math.random()*.38+.06,
            hue: Math.random()>.7?212:340,
        }));
        function drawLine(a,b) {
            const d = Math.hypot(a.x-b.x, a.y-b.y);
            if(d>80) return;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
            ctx.strokeStyle = `rgba(136,14,79,${(1-d/80)*0.055})`; ctx.lineWidth=.5; ctx.stroke();
        }
        function draw() {
            ctx.clearRect(0,0,W,H);
            pts.forEach(p => {
                p.x+=p.vx; p.y+=p.vy;
                if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
            });
            for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) drawLine(pts[i],pts[j]);
            pts.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
                ctx.fillStyle = p.hue===340?`rgba(136,14,79,${p.o})`:`rgba(212,175,55,${p.o*.7})`; ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        }
        draw();
        const ro = new ResizeObserver(resize); ro.observe(canvas);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, [ref]);
}

const AnimatedMesh = React.memo(function AnimatedMesh() {
    const canvasRef = useRef(null);
    useParticleCanvas(canvasRef);
    return (
        <div style={{position:'fixed',inset:0,zIndex:0,overflow:'hidden',pointerEvents:'none'}}>
            <motion.div animate={{x:[0,50,-25,0],y:[0,-40,25,0],scale:[1,1.12,.94,1]}} transition={{duration:20,repeat:Infinity,ease:'easeInOut'}}
                        style={{position:'absolute',top:'-12%',left:'-8%',width:'65vw',height:'65vw',borderRadius:'50%',
                            background:'radial-gradient(circle,rgba(230,230,250,.6) 0%,transparent 70%)',filter:'blur(44px)'}}/>
            <motion.div animate={{x:[0,-35,22,0],y:[0,48,-15,0],scale:[1,.88,1.14,1]}} transition={{duration:25,repeat:Infinity,ease:'easeInOut',delay:4}}
                        style={{position:'absolute',bottom:'-12%',right:'-8%',width:'55vw',height:'55vw',borderRadius:'50%',
                            background:'radial-gradient(circle,rgba(212,175,55,.08) 0%,transparent 70%)',filter:'blur(52px)'}}/>
            <motion.div animate={{x:[0,25,-35,0],y:[0,-25,35,0],scale:[1,1.08,.92,1]}} transition={{duration:17,repeat:Infinity,ease:'easeInOut',delay:9}}
                        style={{position:'absolute',top:'35%',left:'38%',width:'32vw',height:'32vw',borderRadius:'50%',
                            background:'radial-gradient(circle,rgba(136,14,79,.06) 0%,transparent 70%)',filter:'blur(32px)'}}/>
            <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.65}}/>
            <div style={{position:'absolute',inset:0,
                backgroundImage:'linear-gradient(rgba(136,14,79,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(136,14,79,0.02) 1px,transparent 1px)',
                backgroundSize:'40px 40px'}}/>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 50%,transparent 50%,rgba(253,246,240,.6) 100%)'}}/>
        </div>
    );
});

const FloatingHearts = React.memo(function FloatingHearts() {
    const hearts = useMemo(()=>Array.from({length:6},(_,i)=>({
        id:i, left:`${10+i*16}%`, size:[10,14,8,12,16,9][i],
        delay:i*1.8, duration:14+i*3, opacity:[.06,.1,.05,.08,.12,.06][i],
    })),[]);
    return (
        <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',overflow:'hidden'}}>
            {hearts.map(h=>(
                <motion.div key={h.id}
                            animate={{y:['100vh','-20vh'],x:[0,Math.sin(h.id)*30,0],rotate:[0,15,-15,0],opacity:[0,h.opacity,h.opacity,0]}}
                            transition={{duration:h.duration,delay:h.delay,repeat:Infinity,ease:'linear'}}
                            style={{position:'absolute',left:h.left,bottom:0}}>
                    <Heart size={h.size} color={T.roseDeep} fill={T.roseDeep}/>
                </motion.div>
            ))}
        </div>
    );
});

const ProgressIndicator = React.memo(function ProgressIndicator({stepIndex, pct}) {
    const circ = 2*Math.PI*28;
    const [displayed, setDisplayed] = useState(0);
    useEffect(()=>{
        const c = animate(displayed, pct, {duration:1, onUpdate: v=>setDisplayed(Math.round(v))});
        return c.stop;
    },[pct]);

    return (
        <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
            <div style={{position:'relative',width:76,height:76,flexShrink:0}}>
                <svg width={76} height={76} style={{transform:'rotate(-90deg)',overflow:'visible'}}>
                    <defs>
                        <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={T.roseDeep}/>
                            <stop offset="100%" stopColor={T.gold}/>
                        </linearGradient>
                        <filter id="gf"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <circle cx={38} cy={38} r={28} fill="none" stroke="rgba(136,14,79,0.1)" strokeWidth={4}/>
                    <motion.circle cx={38} cy={38} r={28} fill="none" stroke="url(#cg)" strokeWidth={4} strokeLinecap="round"
                                   strokeDasharray={circ} animate={{strokeDashoffset:circ-(pct/100)*circ}} transition={{duration:.9,ease:'easeOut'}} filter="url(#gf)"/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontFamily:T.fontBody,fontSize:13,fontWeight:700,
              background:`linear-gradient(135deg,${T.roseDeep},${T.gold})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            {displayed}%
          </span>
                </div>
            </div>
            <div style={{flex:1,minWidth:200}}>
                <div style={{display:'flex',gap:5,marginBottom:10,alignItems:'center'}}>
                    {STEPS.map((s,i)=>(
                        <motion.div key={s.id} layout
                                    animate={{
                                        background: i<stepIndex?`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`:i===stepIndex?`linear-gradient(135deg,${T.roseDeep},${T.gold})`:'rgba(136,14,79,0.08)',
                                        flex: i===stepIndex?2.2:1, height: i===stepIndex?8:6,
                                    }} transition={{duration:.45}} style={{borderRadius:99}}/>
                    ))}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <motion.div key={stepIndex} initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
                                style={{width:20,height:20,borderRadius:'50%',
                                    background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    boxShadow:`0 2px 8px rgba(136,14,79,0.3)`}}>
                        {React.createElement(STEPS[stepIndex].icon,{size:11,color:'white'})}
                    </motion.div>
                    <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,margin:0,letterSpacing:'.05em'}}>
                        Étape <strong style={{color:T.roseDeep}}>{stepIndex+1}</strong> / {STEPS.length} — {STEPS[stepIndex]?.title}
                    </p>
                </div>
            </div>
        </div>
    );
});

// PART 3 — RewardOverlay

function RewardOverlay({show, onComplete, stepIndex}) {
    const overlayRef = useRef(null);
    const cardRef = useRef(null);
    const raysRef = useRef([]);
    const orbitRef = useRef([]);

    const messages = [
        {title:'Parfait !',        sub:'On sait qui tu es   ✦'},
        {title:'Superbe !',        sub:'Ton âge est noté   ✦'},
        {title:'Excellent !',      sub:'Parcours académique validé   ✦'},
        {title:'Magnifique !',     sub:'Tes passions nous inspirent   ✦'},
        {title:'Éloquent·e !',     sub:'Ta bio est captivante   ✦'},
        {title:'Tu rayonnes !',    sub:'Ta photo est enregistrée   ✦'},
    ];
    const msg = messages[stepIndex] || {title:'Bravo !', sub:'Continue ainsi   ✦'};

    useEffect(()=>{
        if(!show||!overlayRef.current) return;
        const tl = gsap.timeline({onComplete});

        tl.fromTo(overlayRef.current, {opacity:0},{opacity:1,duration:.35,ease:'power2.out'});

        raysRef.current.forEach((r,i)=>{
            if(!r) return;
            gsap.fromTo(r,
                {opacity:0,scale:.3,rotate:i*30},
                {opacity:[0,.6,0],scale:[.3,1,.3],rotate:`+=${360+i*15}`,
                    duration:1.6,delay:i*.04,ease:'power2.inOut'},
            );
        });

        orbitRef.current.forEach((p,i)=>{
            if(!p) return;
            const angle = (i/orbitRef.current.length)*Math.PI*2;
            gsap.fromTo(p,
                {x:0,y:0,opacity:0,scale:0},
                {x:Math.cos(angle)*140, y:Math.sin(angle)*140,
                    opacity:[0,1,0], scale:[0,1.3,0],
                    duration:1.4, delay:i*.05, ease:'power2.out'},
            );
        });

        tl.fromTo(cardRef.current,
            {y:60,opacity:0,scale:.75,rotateX:-25},
            {y:0,opacity:1,scale:1,rotateX:0,duration:.65,ease:'back.out(2)'},
            '-=1.1',
        );

        tl.to(overlayRef.current,
            {opacity:0,duration:.5,delay:1.2,ease:'power2.in'});

    },[show, stepIndex]);

    if(!show) return null;

    const RAY_COUNT   = 14;
    const ORBIT_COUNT = 12;

    return (
        <div ref={overlayRef} style={{
            position:'fixed',inset:0,zIndex:9999,
            background:'rgba(26,8,18,.75)',backdropFilter:'blur(28px)',
            display:'flex',alignItems:'center',justifyContent:'center',
            perspective:'800px',
        }}>
            {Array.from({length:RAY_COUNT}).map((_,i)=>(
                <div key={i} ref={el=>raysRef.current[i]=el} style={{
                    position:'absolute',top:'50%',left:'50%',
                    width:3, height:'40vmin',
                    background:`linear-gradient(to bottom,${i%2===0?T.roseDeep:T.gold},transparent)`,
                    transformOrigin:'0% 0%',
                    transform:`translateX(-50%) rotate(${i*(360/RAY_COUNT)}deg)`,
                    opacity:0,
                }}/>
            ))}

            {Array.from({length:ORBIT_COUNT}).map((_,i)=>(
                <div key={i} ref={el=>orbitRef.current[i]=el} style={{
                    position:'absolute',top:'50%',left:'50%',
                    width: i%3===0?12:8, height: i%3===0?12:8,
                    borderRadius:'50%',
                    background: i%3===0?T.roseDeep:i%3===1?T.gold:'rgba(255,255,255,.8)',
                    marginTop:-5,marginLeft:-5,opacity:0,
                    boxShadow:`0 0 12px ${i%2===0?T.roseDeep:T.gold}`,
                }}/>
            ))}

            {[60,100,150,210,280].map((sz,i)=>(
                <motion.div key={i} animate={{scale:[.3,2],opacity:[.8,0]}} transition={{duration:1.4,delay:i*.1,ease:'easeOut'}}
                            style={{position:'absolute',width:sz,height:sz,borderRadius:'50%',
                                border:`${i<2?2:1}px solid ${i%2?T.gold:T.roseDeep}`,
                                top:'50%',left:'50%',transform:'translate(-50%,-50%)',
                            }}/>
            ))}

            <div ref={cardRef} style={{
                background:'rgba(255,255,255,.1)',backdropFilter:'blur(36px)',
                border:'1px solid rgba(255,255,255,.22)',borderRadius:T.r32,
                padding:'52px 72px',textAlign:'center',
                boxShadow:`0 40px 120px rgba(136,14,79,.4), 0 0 80px rgba(212,175,55,.15)`,
                position:'relative',zIndex:2,maxWidth:380,
            }}>
                <div style={{position:'absolute',inset:0,borderRadius:T.r32,
                    background:'radial-gradient(circle at 50% 30%,rgba(136,14,79,.2),transparent 70%)',
                    pointerEvents:'none'}}/>
                <motion.div animate={{x:['200%','-200%']}} transition={{duration:2.5,repeat:Infinity,ease:'linear'}}
                            style={{position:'absolute',inset:0,borderRadius:T.r32,
                                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)',
                                pointerEvents:'none'}}/>

                <motion.div animate={{rotate:[0,15,-15,0],scale:[1,1.2,1]}} transition={{duration:.7,delay:.2,ease:'backOut'}}
                            style={{fontSize:56,marginBottom:20,display:'block',
                                filter:`drop-shadow(0 0 20px ${T.roseDeep}) drop-shadow(0 0 40px ${T.gold})`}}>
                    ✦
                </motion.div>

                <h2 style={{fontFamily:T.fontDisplay,fontSize:'clamp(28px,5vw,44px)',fontWeight:700,color:T.white,
                    margin:`0 0 10px`,textShadow:`0 0 40px rgba(136,14,79,.8),0 0 80px rgba(136,14,79,.4)`}}>
                    {msg.title}
                </h2>
                <p style={{fontFamily:T.fontBody,fontSize:16,color:'rgba(255,255,255,.8)',margin:0,letterSpacing:'.04em'}}>
                    {msg.sub}
                </p>

                <motion.div animate={{scaleX:[0,1]}} transition={{duration:.9,delay:.35}}
                            style={{height:2,marginTop:28,borderRadius:99,transformOrigin:'left',
                                background:`linear-gradient(90deg,transparent,${T.roseDeep},${T.gold},transparent)`}}/>
            </div>
        </div>
    );
}

// PART 4 — Steps Components

function StepGenre({value, onChange}) {
    const opts = [
        {id:'homme',label:'Un homme',sub:'Étudiant à l\'UK 🎓',emoji:'👨‍🎓',
            grad:`linear-gradient(135deg,#1A237E,#3949AB 50%,#1E88E5)`,glow:'rgba(57,73,171,.38)'},
        {id:'femme',label:'Une femme',sub:'Étudiante à l\'UK 🌸',emoji:'👩‍🎓',
            grad:`linear-gradient(135deg,${T.roseDeep},${T.accent} 50%,#D81B60)`,glow:`rgba(136,14,79,.38)`},
    ];
    return (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,maxWidth:560,margin:'0 auto'}}>
            {opts.map((opt,i)=>{
                const sel = value===opt.id;
                return (
                    <motion.button key={opt.id}
                                   initial={{opacity:0,y:36,scale:.9}} animate={{opacity:1,y:0,scale:1}}
                                   transition={{delay:i*.14,type:'spring',stiffness:200,damping:20}}
                                   whileHover={{y:-10,scale:1.04}} whileTap={{scale:.96}}
                                   onClick={()=>onChange(opt.id)}
                                   style={{border:'none',cursor:'pointer',borderRadius:T.r32,padding:'44px 24px',
                                       background:sel?opt.grad:T.glass,backdropFilter:'blur(20px)',
                                       outline:sel?`3px solid rgba(255,255,255,.5)`:`2px solid ${T.border}`,
                                       outlineOffset:sel?3:0,
                                       boxShadow:sel?`0 28px 72px ${opt.glow},0 0 0 1px rgba(255,255,255,.1) inset`:`0 8px 32px rgba(136,14,79,.05)`,
                                       display:'flex',flexDirection:'column',alignItems:'center',gap:16,
                                       transition:'all .4s cubic-bezier(.34,1.56,.64,1)',position:'relative',overflow:'hidden'}}>
                        {sel&&(
                            <motion.div animate={{x:['200%','-200%']}} transition={{duration:2,repeat:Infinity,ease:'linear'}}
                                        style={{position:'absolute',inset:0,pointerEvents:'none',
                                            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)'}}/>
                        )}
                        {sel&&(
                            <motion.div animate={{scale:[1,1.3,1],opacity:[.5,.0,.5]}} transition={{duration:2,repeat:Infinity}}
                                        style={{position:'absolute',inset:-4,borderRadius:T.r32,
                                            border:`2px solid ${opt.glow}`,pointerEvents:'none'}}/>
                        )}
                        <motion.span animate={sel?{scale:[1,1.08,1]}:{scale:1}} transition={{duration:.6,repeat:sel?Infinity:0,repeatDelay:3}}
                                     style={{fontSize:68,lineHeight:1,filter:sel?`drop-shadow(0 0 20px ${opt.glow})`:'none'}}>
                            {opt.emoji}
                        </motion.span>
                        <div>
                            <div style={{fontFamily:T.fontDisplay,fontSize:22,fontWeight:600,
                                color:sel?T.white:T.text,marginBottom:4}}>{opt.label}</div>
                            <div style={{fontFamily:T.fontBody,fontSize:13,color:sel?'rgba(255,255,255,.8)':T.textSoft}}>
                                {opt.sub}</div>
                        </div>
                        {sel&&(
                            <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:300}}
                                        style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.28)',
                                            display:'flex',alignItems:'center',justifyContent:'center',
                                            boxShadow:'0 4px 12px rgba(0,0,0,.2)'}}>
                                <Check size={18} color="white" strokeWidth={2.5}/>
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

function StepBirthday({value, onChange}) {
    const age = useMemo(()=>calculateAge(value),[value]);
    const maxDate = new Date(Date.now()-MIN_AGE*365.25*86400000).toISOString().split('T')[0];
    return (
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} style={{maxWidth:420,margin:'0 auto'}}>
            <div style={{background:T.glass,backdropFilter:'blur(28px)',
                border:`1px solid ${T.border}`,borderRadius:T.r24,padding:'44px 36px',
                boxShadow:T.shadow,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,
                    background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`,borderRadius:`${T.r24} ${T.r24} 0 0`}}/>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
                    <div style={{width:48,height:48,borderRadius:T.r12,
                        background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:`0 8px 24px rgba(136,14,79,.25)`}}>
                        <Calendar size={24} color="white"/>
                    </div>
                    <div>
                        <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,margin:0,letterSpacing:'.06em',textTransform:'uppercase'}}>Date de naissance</p>
                        <p style={{fontFamily:T.fontDisplay,fontSize:18,fontWeight:600,color:T.text,margin:0}}>Quand es-tu né·e ?</p>
                    </div>
                </div>
                <input type="date" value={value} onChange={e=>onChange(e.target.value)} max={maxDate}
                       style={{width:'100%',padding:'16px 20px',border:`1.5px solid ${value?T.roseDeep:T.border}`,
                           borderRadius:T.r16,fontFamily:T.fontBody,fontSize:16,color:T.text,
                           background:'rgba(255,255,255,.9)',outline:'none',boxSizing:'border-box',
                           boxShadow:value?`0 0 0 3px rgba(136,14,79,.1)`:'none',
                           transition:'all .3s ease',cursor:'pointer'}}/>
                <AnimatePresence>
                    {age!==null&&age>=MIN_AGE&&(
                        <motion.div initial={{opacity:0,y:14,scale:.88}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-12}}
                                    style={{marginTop:20,background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                                        borderRadius:T.r16,padding:'16px 24px',display:'flex',alignItems:'center',gap:12,
                                        boxShadow:`0 8px 32px rgba(136,14,79,.2)`}}>
                            <span style={{fontSize:32,filter:'drop-shadow(0 2px 8px rgba(0,0,0,.3))'}}>🎂</span>
                            <div>
                                <p style={{fontFamily:T.fontBody,fontSize:12,color:'rgba(255,255,255,.7)',margin:0}}>Ton âge</p>
                                <p style={{fontFamily:T.fontDisplay,fontSize:32,fontWeight:700,color:T.white,margin:0}}>{age} ans</p>
                            </div>
                            <motion.div animate={{rotate:360}} transition={{duration:8,repeat:Infinity,ease:'linear'}} style={{marginLeft:'auto'}}>
                                <Sparkles size={22} color="rgba(255,255,255,.65)"/>
                            </motion.div>
                        </motion.div>
                    )}
                    {age!==null&&age<MIN_AGE&&(
                        <motion.p initial={{opacity:0}} animate={{opacity:1}}
                                  style={{fontFamily:T.fontBody,fontSize:13,color:'#DC2626',marginTop:12,textAlign:'center',
                                      background:'rgba(220,38,38,.08)',borderRadius:T.r12,padding:'12px 16px'}}>
                            Tu dois avoir au moins {MIN_AGE} ans pour rejoindre LoveLine 💙
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// NEW STEP: Academics
function StepAcademics({value, onChange}) {
    const facultes = ['FAST (Sciences)', 'FDSP (Droit)', 'FLESH (Lettres)', 'FSS (Santé)', 'FA (Agronomie)', 'ISMA', 'ENSI', 'Autre'];
    const niveaux = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat'];

    const handleFac = f => onChange({...value, faculte: f});
    const handleNiv = n => onChange({...value, niveau: n});

    return (
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} style={{maxWidth:600,margin:'0 auto'}}>
            <div style={{background:T.glass,backdropFilter:'blur(28px)',
                border:`1px solid ${T.border}`,borderRadius:T.r24,padding:'40px',
                boxShadow:T.shadow,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,
                    background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`,borderRadius:`${T.r24} ${T.r24} 0 0`}}/>

                {/* Faculte Selection */}
                <div style={{marginBottom:32}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                        <BookOpen size={20} color={T.roseDeep} />
                        <h3 style={{fontFamily:T.fontDisplay,fontSize:18,fontWeight:600,color:T.text,margin:0}}>
                            Dans quelle Faculté es-tu ?
                        </h3>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                        {facultes.map(fac => {
                            const sel = value.faculte === fac;
                            return (
                                <motion.button key={fac} whileHover={{scale:1.03}} whileTap={{scale:.97}}
                                               onClick={() => handleFac(fac)}
                                               style={{
                                                   padding:'10px 18px', borderRadius:T.r48, border:`1px solid ${sel ? T.roseDeep : T.border}`,
                                                   background: sel ? `linear-gradient(135deg,${T.roseDeep},${T.accent})` : 'rgba(255,255,255,.6)',
                                                   color: sel ? T.white : T.textMid, fontFamily:T.fontBody, fontSize:13, fontWeight:500,
                                                   cursor:'pointer', boxShadow: sel ? `0 4px 12px rgba(136,14,79,.25)` : 'none',
                                                   transition:'all .3s'
                                               }}>
                                    {fac}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Niveau Selection */}
                <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                        <GraduationCap size={20} color={T.roseDeep} />
                        <h3 style={{fontFamily:T.fontDisplay,fontSize:18,fontWeight:600,color:T.text,margin:0}}>
                            En quelle année ?
                        </h3>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                        {niveaux.map(niv => {
                            const sel = value.niveau === niv;
                            return (
                                <motion.button key={niv} whileHover={{scale:1.03}} whileTap={{scale:.97}}
                                               onClick={() => handleNiv(niv)}
                                               style={{
                                                   padding:'10px 18px', borderRadius:T.r48, border:`1px solid ${sel ? T.goldDark : T.border}`,
                                                   background: sel ? `linear-gradient(135deg,${T.gold},${T.goldDark})` : 'rgba(255,255,255,.6)',
                                                   color: sel ? T.white : T.textMid, fontFamily:T.fontBody, fontSize:13, fontWeight:500,
                                                   cursor:'pointer', boxShadow: sel ? `0 4px 12px rgba(212,175,55,.3)` : 'none',
                                                   transition:'all .3s'
                                               }}>
                                    {niv}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </motion.div>
    );
}

function StepInterests({value, onChange}) {
    const toggle = useCallback(id=>{
        if(value.includes(id)) onChange(value.filter(x=>x!==id));
        else if(value.length<MAX_INTERESTS) onChange([...value,id]);
        else toast(`Maximum ${MAX_INTERESTS} passions !`,{icon:'✦',
                style:{background:T.dark,color:T.white,fontFamily:T.fontBody,borderRadius:T.r12,border:`1px solid ${T.roseDeep}`}});
    },[value,onChange]);

    const pct = (value.length/MAX_INTERESTS)*100;

    return (
        <div style={{maxWidth:620,margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
                <div>
                    <p style={{fontFamily:T.fontBody,fontSize:15,color:T.text,margin:0,fontWeight:500}}>
                        Choisis jusqu'à <strong style={{color:T.roseDeep}}>{MAX_INTERESTS} passions</strong>
                    </p>
                    <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,margin:'4px 0 0'}}>
                        Minimum {MIN_INTERESTS} pour continuer
                    </p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:80,height:6,borderRadius:99,background:'rgba(136,14,79,.1)',overflow:'hidden'}}>
                        <motion.div animate={{width:`${pct}%`}} transition={{duration:.4}}
                                    style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`}}/>
                    </div>
                    <motion.span animate={{color:value.length>=MIN_INTERESTS?T.roseDeep:T.textSoft}}
                                 style={{fontFamily:T.fontBody,fontSize:12,fontWeight:700}}>
                        {value.length} / {MAX_INTERESTS}
                    </motion.span>
                </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))',gap:12}}>
                {INTERESTS_LIST.map((item,i)=>{
                    const sel = value.includes(item.id);
                    const IC = item.icon;
                    return (
                        <motion.button key={item.id}
                                       initial={{opacity:0,scale:.8,y:16}} animate={{opacity:1,scale:1,y:0}}
                                       transition={{delay:i*.035,type:'spring',stiffness:260,damping:22}}
                                       whileHover={{scale:1.06,y:-4,boxShadow:sel?`0 12px 32px ${item.c}44`:`0 8px 24px rgba(136,14,79,.08)`}}
                                       whileTap={{scale:.94}}
                                       onClick={()=>toggle(item.id)}
                                       style={{border:`1.5px solid ${sel?item.c:T.border}`,borderRadius:T.r16,
                                           padding:'16px 12px',
                                           background:sel?`linear-gradient(135deg,${item.c}1A,${item.c}0D)`:T.glass,
                                           backdropFilter:'blur(12px)',cursor:'pointer',
                                           display:'flex',alignItems:'center',gap:8,
                                           boxShadow:sel?`0 8px 24px ${item.c}33,0 0 0 1px ${item.c}22`:T.shadow.replace('0.08)','0.03)'),
                                           transition:'all .3s ease',position:'relative',overflow:'hidden'}}>
                            {sel&&(
                                <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:350}}
                                            style={{position:'absolute',top:6,right:6,width:18,height:18,borderRadius:'50%',
                                                background:item.c,display:'flex',alignItems:'center',justifyContent:'center',
                                                boxShadow:`0 2px 8px ${item.c}66`}}>
                                    <Check size={10} color="white" strokeWidth={3}/>
                                </motion.div>
                            )}
                            <motion.div animate={sel?{rotate:[0,10,-10,0]}:{rotate:0}} transition={{duration:.4}}
                                        style={{width:34,height:34,borderRadius:T.r8,
                                            background:sel?item.c:`${item.c}1A`,display:'flex',alignItems:'center',justifyContent:'center',
                                            flexShrink:0,transition:'all .3s ease',
                                            boxShadow:sel?`0 4px 12px ${item.c}44`:'none'}}>
                                <IC size={17} color={sel?T.white:item.c}/>
                            </motion.div>
                            <span style={{fontFamily:T.fontBody,fontSize:12,fontWeight:sel?600:400,
                                color:sel?T.text:T.textMid,lineHeight:1.3,textAlign:'left'}}>
                {item.label}
              </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

function StepBio({value, onChange}) {
    const words = useMemo(()=>countWords(value),[value]);
    const pct   = Math.min((words/MAX_BIO_WORDS)*100,100);
    const circ  = 2*Math.PI*22;
    const isOver = words>MAX_BIO_WORDS;
    const ringColor = isOver?'#DC2626':pct>80?'#D97706':T.roseDeep;
    const [focused, setFocused] = useState(false);

    return (
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} style={{maxWidth:540,margin:'0 auto'}}>
            <div style={{background:T.glass,backdropFilter:'blur(28px)',
                border:`1.5px solid ${isOver?'#DC2626':focused?T.roseDeep:T.border}`,borderRadius:T.r24,
                padding:'36px 32px',boxShadow:focused?`${T.shadow},0 0 0 3px rgba(136,14,79,.1)`:T.shadow,
                transition:'all .3s ease',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,
                    background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`,
                    borderRadius:`${T.r24} ${T.r24} 0 0`}}/>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                    <div>
                        <p style={{fontFamily:T.fontDisplay,fontSize:20,fontWeight:600,color:T.text,margin:0}}>Ta bio</p>
                        <p style={{fontFamily:T.fontBody,fontSize:13,color:T.textSoft,margin:'4px 0 0'}}>Dis quelque chose d'unique sur toi</p>
                    </div>
                    <div style={{position:'relative',width:60,height:60}}>
                        <svg width={60} height={60} style={{transform:'rotate(-90deg)'}}>
                            <circle cx={30} cy={30} r={22} fill="none" stroke="rgba(136,14,79,.08)" strokeWidth={3.5}/>
                            <motion.circle cx={30} cy={30} r={22} fill="none" stroke={ringColor} strokeWidth={3.5}
                                           strokeLinecap="round" strokeDasharray={circ}
                                           animate={{strokeDashoffset:circ-(pct/100)*circ}} transition={{duration:.3}}/>
                        </svg>
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontFamily:T.fontBody,fontSize:11,fontWeight:700,
                  color:isOver?'#DC2626':T.textSoft}}>
                {MAX_BIO_WORDS-words}
              </span>
                        </div>
                    </div>
                </div>

                <textarea value={value} onChange={e=>onChange(e.target.value)} rows={6}
                          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                          placeholder="Ex : Étudiant en Droit à l'UK, passionné de musique et de voyages. Je cherche quelqu'un avec qui partager des discussions profondes et des éclats de rire sincères…"
                          style={{width:'100%',boxSizing:'border-box',padding:'16px 20px',
                              border:`1.5px solid ${isOver?'#DC2626':focused?T.roseDeep:'rgba(136,14,79,.15)'}`,borderRadius:T.r16,
                              fontFamily:T.fontBody,fontSize:14,color:T.text,
                              background:'rgba(255,255,255,.9)',resize:'vertical',outline:'none',lineHeight:1.75,
                              boxShadow:focused?`0 0 0 3px rgba(136,14,79,.08)`:'none',
                              transition:'all .3s ease',minHeight:140}}/>

                <div style={{marginTop:12}}>
                    <div style={{height:4,borderRadius:99,background:'rgba(136,14,79,.08)',overflow:'hidden'}}>
                        <motion.div animate={{width:`${pct}%`}} transition={{duration:.3}}
                                    style={{height:'100%',borderRadius:99,background:isOver?'#DC2626':pct>80?'#D97706':`linear-gradient(90deg,${T.roseDeep},${T.gold})`}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            <span style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft}}>
              {words} mot{words!==1?'s':''}
            </span>
                        <motion.span animate={{color:isOver?'#DC2626':T.textSoft}}
                                     style={{fontFamily:T.fontBody,fontSize:12}}>
                            max {MAX_BIO_WORDS} mots
                        </motion.span>
                    </div>
                </div>
            </div>

            <div style={{marginTop:20}}>
                <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,marginBottom:10}}>Besoin d'inspiration ?</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {['Ma passion principale','Mon plat préféré','Un rêve de voyage','Ce qui me fait rire'].map(pr=>(
                        <motion.button key={pr} whileHover={{scale:1.04,y:-2}} whileTap={{scale:.97}}
                                       onClick={()=>onChange(value+(value?' ':'')+pr+'…')}
                                       style={{fontFamily:T.fontBody,fontSize:11,color:T.roseDeep,
                                           background:'rgba(136,14,79,.05)',border:`1px solid rgba(136,14,79,.15)`,
                                           borderRadius:T.r48,padding:'6px 14px',cursor:'pointer',transition:'all .2s ease'}}>
                            + {pr}
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function StepPhoto({value, onChange}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);
    const [rawImg, setRawImg] = useState(null);
    const [zoom, setZoom] = useState(1);

    const handleFile = useCallback(f=>{
        if(!f||!f.type.startsWith('image/')) { toast.error('Choisis une image valide.'); return; }
        if(f.size>5*1024*1024) { toast.error('Image trop grande (max 5MB).'); return; }
        const r = new FileReader();
        r.onload = e => setRawImg(e.target.result);
        r.readAsDataURL(f);
    },[]);

    // Mini cropping handler
    const applyCrop = () => {
        if(!rawImg) return;
        const canvas = document.createElement('canvas');
        canvas.width = 400; canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            // Draw center cropped
            ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
            onChange(canvas.toDataURL('image/jpeg', 0.9));
            setRawImg(null); // Close cropper
        };
        img.src = rawImg;
    };

    if(rawImg) {
        return (
            <div style={{maxWidth:500,margin:'0 auto',background:T.glass,padding:32,borderRadius:T.r24,boxShadow:T.shadow}}>
                <h3 style={{fontFamily:T.fontDisplay,fontSize:18,margin:'0 0 16px',color:T.text,textAlign:'center'}}>Recadre ta photo</h3>
                <div style={{position:'relative',width:'100%',height:300,borderRadius:T.r16,overflow:'hidden',background:'#000',marginBottom:16}}>
                    <img src={rawImg} alt="crop" style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${zoom})`,transition:'transform 0.1s'}} />
                    <div style={{position:'absolute',inset:0,border:`2px dashed rgba(255,255,255,.5)`,pointerEvents:'none'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
                    <ZoomIn size={18} color={T.textMid}/>
                    <input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))} style={{flex:1,accentColor:T.roseDeep}}/>
                </div>
                <div style={{display:'flex',gap:12}}>
                    <button onClick={()=>setRawImg(null)} style={{flex:1,padding:'12px',borderRadius:T.r16,border:`1px solid ${T.border}`,background:'transparent',fontFamily:T.fontBody,cursor:'pointer',color:T.textMid}}>Annuler</button>
                    <button onClick={applyCrop} style={{flex:1,padding:'12px',borderRadius:T.r16,border:'none',background:`linear-gradient(135deg,${T.roseDeep},${T.gold})`,fontFamily:T.fontBody,fontWeight:700,color:'white',cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                        <Crop size={16}/> Valider
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{maxWidth:500,margin:'0 auto'}}>
            <motion.div
                animate={{
                    borderColor:dragging?T.roseDeep:T.border,
                    background:dragging?'rgba(136,14,79,.03)':T.glass,
                    scale:dragging?1.02:1,
                    boxShadow:dragging?`${T.shadowHigh}`:T.shadow,
                }}
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
                onClick={()=>!value&&inputRef.current?.click()}
                style={{border:`2px dashed ${T.border}`,borderRadius:T.r24,minHeight:260,
                    backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',gap:16,
                    cursor:value?'default':'pointer',position:'relative',overflow:'hidden',
                    transition:'all .3s ease'}}>
                <input ref={inputRef} type="file" accept="image/*"
                       onChange={e=>handleFile(e.target.files[0])} style={{display:'none'}}/>

                <AnimatePresence mode="wait">
                    {value?(
                        <motion.div key="prev" initial={{opacity:0,scale:.88}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.88}}
                                    style={{width:'100%',position:'relative'}}>
                            <img src={value} alt="Aperçu" style={{width:'100%',height:300,objectFit:'cover',borderRadius:T.r24}}/>
                            <div style={{position:'absolute',inset:0,borderRadius:T.r24,
                                background:'linear-gradient(to top,rgba(26,8,18,.65) 0%,transparent 45%)'}}/>
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:.95}}
                                           onClick={e=>{e.stopPropagation();onChange(null);}}
                                           style={{position:'absolute',top:12,right:12,background:'rgba(26,8,18,.75)',
                                               border:'none',borderRadius:T.r48,padding:'8px 16px',color:T.white,
                                               fontFamily:T.fontBody,fontSize:12,cursor:'pointer',
                                               display:'flex',alignItems:'center',gap:6,backdropFilter:'blur(10px)',
                                               boxShadow:'0 4px 16px rgba(0,0,0,.4)'}}>
                                <RefreshCw size={13}/> Changer
                            </motion.button>
                            <div style={{position:'absolute',bottom:16,left:0,right:0,textAlign:'center'}}>
                <span style={{fontFamily:T.fontBody,fontSize:12,color:'rgba(255,255,255,.9)',
                    background:'rgba(0,0,0,.4)',padding:'5px 14px',borderRadius:T.r48,
                    backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.2)'}}>
                  ✦ Photo principale
                </span>
                            </div>
                        </motion.div>
                    ):(
                        <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
                                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,padding:48}}>
                            <motion.div
                                animate={dragging?{scale:[1,1.1,1],rotate:[0,-5,5,0]}:{y:[0,-6,0]}}
                                transition={dragging?{duration:.4}:{duration:3,repeat:Infinity,ease:'easeInOut'}}
                                style={{width:80,height:80,borderRadius:T.r20,
                                    background:`linear-gradient(135deg,${T.roseDeep}1A,${T.roseDeep}33)`,
                                    border:`2px solid rgba(136,14,79,.2)`,
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    boxShadow:`0 8px 28px rgba(136,14,79,.08)`}}>
                                <Camera size={36} color={T.roseDeep}/>
                            </motion.div>
                            <div style={{textAlign:'center'}}>
                                <p style={{fontFamily:T.fontDisplay,fontSize:20,fontWeight:600,color:T.text,margin:0}}>
                                    {dragging?'Dépose ici !':'Ajoute ta photo'}
                                </p>
                                <p style={{fontFamily:T.fontBody,fontSize:13,color:T.textSoft,margin:'6px 0 0'}}>
                                    Glisse-dépose ou clique pour parcourir (recadrage intégré)
                                </p>
                            </div>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
                                {['JPG, PNG, WEBP','Max 5MB','Haute qualité'].map(t=>(
                                    <span key={t} style={{fontFamily:T.fontBody,fontSize:11,color:T.textSoft,
                                        background:'rgba(136,14,79,.05)',border:`1px solid rgba(136,14,79,.12)`,
                                        borderRadius:T.r48,padding:'4px 12px'}}>{t}</span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div style={{marginTop:20,display:'flex',gap:12,flexWrap:'wrap'}}>
                {[{e:'☀️',t:'Bonne lumière naturelle'},{e:'😊',t:'Sourire naturel'},{e:'🎯',t:'Toi seul·e au 1er plan'}].map(tip=>(
                    <motion.div key={tip.t} whileHover={{y:-2}}
                                style={{display:'flex',alignItems:'center',gap:8,background:T.glass,
                                    border:`1px solid ${T.border}`,borderRadius:T.r12,padding:'8px 14px',
                                    backdropFilter:'blur(8px)',cursor:'default'}}>
                        <span style={{fontSize:15}}>{tip.e}</span>
                        <span style={{fontFamily:T.fontBody,fontSize:11,color:T.textMid}}>{tip.t}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// PART 6 — ProfileCard

function ProfileCard({profile}) {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({x:0,y:0});
    const [shine, setShine] = useState({x:50,y:50});
    const [flipped, setFlipped] = useState(false);

    const selInterests = useMemo(()=>INTERESTS_LIST.filter(it=>profile.interests?.includes(it.id)),[profile.interests]);
    const age = useMemo(()=>calculateAge(profile.birthday),[profile.birthday]);

    const handleMove = useCallback(e=>{
        if(!cardRef.current) return;
        const r  = cardRef.current.getBoundingClientRect();
        const cx = (e.clientX-r.left)/r.width;
        const cy = (e.clientY-r.top)/r.height;
        setTilt({x:(cy-.5)*16, y:(cx-.5)*-16});
        setShine({x:cx*100, y:cy*100});
    },[]);
    const handleLeave = useCallback(()=>{ setTilt({x:0,y:0}); setShine({x:50,y:50}); },[]);

    return (
        <div style={{perspective:1200}}>
            <motion.div ref={cardRef}
                        animate={{rotateX:tilt.x, rotateY:tilt.y}}
                        whileHover={{scale:1.025}}
                        onMouseMove={handleMove} onMouseLeave={handleLeave}
                        onClick={()=>setFlipped(f=>!f)}
                        style={{width:320,borderRadius:T.r32,background:T.dark,
                            boxShadow:`0 44px 130px rgba(26,8,18,.4),0 18px 44px rgba(136,14,79,.15)`,
                            overflow:'hidden',cursor:'pointer',transformStyle:'preserve-3d',position:'relative',
                            transition:'transform .1s ease'}}>

                <div style={{position:'absolute',inset:0,zIndex:4,pointerEvents:'none',borderRadius:T.r32,
                    background:`radial-gradient(circle at ${shine.x}% ${shine.y}%,rgba(255,255,255,.12) 0%,transparent 60%)`}}/>

                <motion.div animate={{rotateY: flipped?180:0}} transition={{duration:.6,ease:[.25,.46,.45,.94]}}
                            style={{transformStyle:'preserve-3d',position:'relative'}}>

                    <div style={{backfaceVisibility:'hidden'}}>
                        <div style={{position:'relative',height:340}}>
                            {profile.photo?(
                                <img src={profile.photo} alt="profil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            ):(
                                <div style={{width:'100%',height:'100%',
                                    background:`linear-gradient(135deg,${T.roseDeep} 0%,${T.darkMid} 55%,#0D0A1F 100%)`,
                                    display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
                                    <motion.div animate={{scale:[1,.96,1]}} transition={{duration:3,repeat:Infinity,ease:'easeInOut'}}
                                                style={{width:100,height:100,borderRadius:'50%',
                                                    background:'rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'center',
                                                    border:'2px solid rgba(255,255,255,.1)',
                                                    boxShadow:`0 0 40px rgba(136,14,79,.2)`}}>
                                        <User size={48} color="rgba(255,255,255,.25)"/>
                                    </motion.div>
                                    <span style={{fontFamily:T.fontBody,fontSize:12,color:'rgba(255,255,255,.3)',letterSpacing:'.1em',textTransform:'uppercase'}}>
                    Pas encore de photo
                  </span>
                                </div>
                            )}
                            <div style={{position:'absolute',inset:0,background:`linear-gradient(to top,${T.dark} 0%,rgba(26,8,18,.2) 45%,transparent 65%)`}}/>
                            <div style={{position:'absolute',top:16,left:16,right:16,display:'flex',justifyContent:'space-between'}}>
                                <div style={{background:'rgba(255,255,255,.14)',backdropFilter:'blur(12px)',
                                    border:'1px solid rgba(255,255,255,.2)',borderRadius:T.r48,padding:'5px 14px',
                                    display:'flex',alignItems:'center',gap:6}}>
                                    <motion.div animate={{opacity:[1,.4,1]}} transition={{duration:2,repeat:Infinity}}
                                                style={{width:7,height:7,borderRadius:'50%',background:'#4ADE80'}}/>
                                    <span style={{fontFamily:T.fontBody,fontSize:11,color:'rgba(255,255,255,.88)'}}>En ligne</span>
                                </div>
                                <div style={{background:`linear-gradient(135deg,${T.roseDeep},${T.gold})`,
                                    borderRadius:T.r48,padding:'5px 12px',display:'flex',alignItems:'center',gap:5,
                                    boxShadow:`0 4px 16px rgba(136,14,79,.3)`}}>
                                    <GraduationCap size={13} color="white"/>
                                    <span style={{fontFamily:T.fontBody,fontSize:11,color:'white',fontWeight:600}}>Université de Kara</span>
                                </div>
                            </div>
                            <div style={{position:'absolute',bottom:16,left:20,right:20}}>
                                <div style={{display:'flex',alignItems:'baseline',gap:10}}>
                                    <h3 style={{fontFamily:T.fontDisplay,fontSize:28,fontWeight:700,color:T.white,margin:0,
                                        textShadow:'0 2px 12px rgba(0,0,0,.5)'}}>
                                        {profile.genre==='homme'?'Étudiant':'Étudiante'}
                                    </h3>
                                    {age&&<span style={{fontFamily:T.fontBody,fontSize:24,fontWeight:300,color:'rgba(255,255,255,.75)'}}>{age}</span>}
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                                    <BookOpen size={12} color="rgba(255,255,255,.5)"/>
                                    <span style={{fontFamily:T.fontBody,fontSize:12,color:'rgba(255,255,255,.6)'}}>{profile.academics?.faculte || 'Faculté'} • {profile.academics?.niveau || 'Niveau'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{padding:'20px 20px 24px'}}>
                            {profile.bio&&(
                                <p style={{fontFamily:T.fontBody,fontSize:13,lineHeight:1.75,color:'rgba(255,255,255,.65)',
                                    margin:`0 0 16px`,display:'-webkit-box',WebkitLineClamp:3,
                                    WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                                    {profile.bio}
                                </p>
                            )}
                            {selInterests.length>0&&(
                                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
                                    {selInterests.slice(0,4).map(it=>{
                                        const IC=it.icon;
                                        return (
                                            <div key={it.id} style={{background:`${it.c}22`,border:`1px solid ${it.c}44`,
                                                borderRadius:T.r48,padding:'5px 11px',display:'flex',alignItems:'center',gap:5}}>
                                                <IC size={11} color={it.c}/>
                                                <span style={{fontFamily:T.fontBody,fontSize:11,color:'rgba(255,255,255,.75)'}}>{it.label}</span>
                                            </div>
                                        );
                                    })}
                                    {selInterests.length>4&&(
                                        <div style={{background:'rgba(255,255,255,.07)',borderRadius:T.r48,padding:'5px 11px'}}>
                                            <span style={{fontFamily:T.fontBody,fontSize:11,color:'rgba(255,255,255,.5)'}}>+{selInterests.length-4}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{display:'flex',gap:12}}>
                                <motion.button whileHover={{scale:1.07}} whileTap={{scale:.93}}
                                               style={{flex:1,height:48,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
                                                   borderRadius:T.r16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <X size={20} color="rgba(255,255,255,.5)"/>
                                </motion.button>
                                <motion.button
                                    whileHover={{scale:1.06,boxShadow:`0 16px 40px rgba(136,14,79,.4)`}}
                                    whileTap={{scale:.94}}
                                    style={{flex:2,height:48,background:`linear-gradient(135deg,${T.roseDeep},${T.gold})`,
                                        border:'none',borderRadius:T.r16,cursor:'pointer',
                                        display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                                        boxShadow:`0 8px 28px rgba(136,14,79,.2)`}}>
                                    <Heart size={19} color="white" fill="white"/>
                                    <span style={{fontFamily:T.fontBody,fontSize:13,fontWeight:600,color:T.white}}>J'aime</span>
                                </motion.button>
                                <motion.button whileHover={{scale:1.07}} whileTap={{scale:.93}}
                                               style={{flex:1,height:48,background:`${T.gold}1A`,border:`1px solid ${T.gold}44`,
                                                   borderRadius:T.r16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                    <Star size={19} color={T.gold} fill={T.gold}/>
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        position:'absolute',inset:0,backfaceVisibility:'hidden',
                        transform:'rotateY(180deg)',
                        background:`linear-gradient(135deg,${T.darkMid},${T.dark})`,
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                        gap:16,padding:'32px 24px',
                    }}>
                        <div style={{fontFamily:T.fontDisplay,fontSize:20,fontWeight:600,color:'rgba(255,255,255,.85)',
                            textAlign:'center',marginBottom:8}}>
                            Passions & intérêts
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,width:'100%'}}>
                            {selInterests.map(it=>{
                                const IC=it.icon;
                                return (
                                    <div key={it.id} style={{display:'flex',alignItems:'center',gap:8,
                                        background:`${it.c}22`,border:`1px solid ${it.c}30`,borderRadius:T.r12,padding:'10px 12px'}}>
                                        <div style={{width:28,height:28,borderRadius:T.r8,background:it.c,
                                            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                            <IC size={14} color="white"/>
                                        </div>
                                        <span style={{fontFamily:T.fontBody,fontSize:11,color:'rgba(255,255,255,.75)',lineHeight:1.3}}>
                      {it.label}
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p style={{fontFamily:T.fontBody,fontSize:11,color:'rgba(255,255,255,.4)',marginTop:8,
                            textAlign:'center',letterSpacing:'.05em'}}>Cliquer pour revenir</p>
                    </div>
                </motion.div>
            </motion.div>
            <p style={{fontFamily:T.fontBody,fontSize:11,color:T.textSoft,textAlign:'center',marginTop:12}}>
                Survole · Clique pour retourner la carte ✦
            </p>
        </div>
    );
}

// PART 7 — PreviewStep, SubscriptionModal

function PreviewStep({profile}) {
    const checks = useMemo(()=>[
        {l:'Genre',              done:!!profile.genre,                            d:profile.genre==='homme'?'Homme':profile.genre==='femme'?'Femme':''},
        {l:'Âge',               done:!!profile.birthday&&calculateAge(profile.birthday)>=MIN_AGE, d:profile.birthday?`${calculateAge(profile.birthday)} ans`:''},
        {l:'Études',            done:!!profile.academics?.faculte,                d:profile.academics?.faculte ? `${profile.academics.faculte} · ${profile.academics.niveau}` : ''},
        {l:"Centres d'intérêt", done:profile.interests.length>=MIN_INTERESTS,    d:`${profile.interests.length} sélectionnés`},
        {l:'Bio',               done:profile.bio.trim().length>0&&countWords(profile.bio)<=MAX_BIO_WORDS, d:`${countWords(profile.bio)} mots`},
        {l:'Photo de profil',   done:!!profile.photo,                            d:profile.photo?'Téléchargée':'En attente'},
    ],[profile]);

    const allGood = checks.every(c=>c.done);

    return (
        <div>
            <div style={{display:'flex',gap:32,flexWrap:'wrap',justifyContent:'center',alignItems:'flex-start'}}>
                <motion.div initial={{opacity:0,x:-44}} animate={{opacity:1,x:0}} transition={{delay:.1,type:'spring',stiffness:130,damping:18}}>
                    <ProfileCard profile={profile}/>
                </motion.div>

                <motion.div initial={{opacity:0,x:44}} animate={{opacity:1,x:0}} transition={{delay:.2,type:'spring',stiffness:130,damping:18}}
                            style={{flex:1,minWidth:260,maxWidth:380}}>

                    <div style={{background:'rgba(255,255,255,.84)',backdropFilter:'blur(28px)',
                        border:`1px solid ${T.border}`,borderRadius:T.r24,padding:'28px 24px',marginBottom:20,
                        boxShadow:`0 8px 44px rgba(136,14,79,.04)`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                            <h3 style={{fontFamily:T.fontDisplay,fontSize:17,fontWeight:600,color:T.text,margin:0}}>Profil complet</h3>
                            <motion.span animate={{scale:allGood?[1,1.1,1]:1}} transition={{delay:.5}}
                                         style={{fontFamily:T.fontBody,fontSize:12,fontWeight:700,color:allGood?T.roseDeep:T.textSoft,
                                             background:allGood?'rgba(136,14,79,.06)':'rgba(0,0,0,.04)',
                                             padding:'5px 14px',borderRadius:T.r48}}>
                                {checks.filter(c=>c.done).length}/{checks.length} ✦
                            </motion.span>
                        </div>

                        <div style={{height:4,borderRadius:99,background:'rgba(136,14,79,.08)',marginBottom:20,overflow:'hidden'}}>
                            <motion.div
                                animate={{width:`${(checks.filter(c=>c.done).length/checks.length)*100}%`}}
                                transition={{duration:.8,ease:'easeOut'}}
                                style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`}}/>
                        </div>

                        {checks.map((c,i)=>(
                            <motion.div key={c.l} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
                                        transition={{delay:.3+i*.09}}
                                        style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',
                                            borderBottom:i<checks.length-1?`1px solid rgba(136,14,79,.06)`:'none'}}>
                                <motion.div animate={{scale:c.done?[1,1.25,1]:1,rotate:c.done?[0,10,-10,0]:0}}
                                            transition={{delay:.4+i*.1}}
                                            style={{width:30,height:30,borderRadius:'50%',flexShrink:0,
                                                background:c.done?`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`:'rgba(136,14,79,.08)',
                                                display:'flex',alignItems:'center',justifyContent:'center',
                                                boxShadow:c.done?`0 4px 14px rgba(136,14,79,.2)`:'none',
                                                transition:'all .4s ease'}}>
                                    {c.done?(
                                        <Check size={15} color="white" strokeWidth={2.5}/>
                                    ):(
                                        <div style={{width:7,height:7,borderRadius:'50%',background:'rgba(136,14,79,.2)'}}/>
                                    )}
                                </motion.div>
                                <span style={{flex:1,fontFamily:T.fontBody,fontSize:13,color:T.text,fontWeight:500}}>{c.l}</span>
                                {c.d&&(
                                    <span style={{fontFamily:T.fontBody,fontSize:11,color:c.done?T.roseDeep:T.textSoft,
                                        background:c.done?'rgba(136,14,79,.06)':'rgba(0,0,0,.04)',
                                        padding:'3px 10px',borderRadius:T.r8}}>
                    {c.d}
                  </span>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.7}}
                                style={{background:'rgba(136,14,79,.03)',border:`1px solid rgba(136,14,79,.1)`,
                                    borderRadius:T.r16,padding:'16px 20px',display:'flex',gap:12,alignItems:'flex-start'}}>
                        <Shield size={17} color={T.roseDeep} style={{flexShrink:0,marginTop:2}}/>
                        <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textMid,lineHeight:1.65,margin:0}}>
                            Profil visible uniquement aux étudiant·e·s de l'Université de Kara.
                            Données chiffrées et sécurisées.
                        </p>
                    </motion.div>

                    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.9}}
                                style={{marginTop:16,background:`linear-gradient(135deg,${T.roseDeep}0D,${T.gold}0A)`,
                                    border:`1px solid rgba(136,14,79,.12)`,borderRadius:T.r16,padding:'16px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                            <span style={{fontFamily:T.fontBody,fontSize:12,color:T.textMid,fontWeight:500}}>Score de compatibilité</span>
                            <span style={{fontFamily:T.fontDisplay,fontSize:20,fontWeight:700,color:T.roseDeep}}>87%</span>
                        </div>
                        <div style={{height:4,borderRadius:99,background:'rgba(136,14,79,.1)',overflow:'hidden'}}>
                            <motion.div initial={{width:0}} animate={{width:'87%'}} transition={{delay:1.1,duration:1,ease:'easeOut'}}
                                        style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`}}/>
                        </div>
                        <p style={{fontFamily:T.fontBody,fontSize:11,color:T.textSoft,margin:'8px 0 0'}}>
                            Basé sur tes centres d'intérêt et ta bio
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

function SubscriptionModal({show, onClose, onDashboard}) {
    const modalRef = useRef(null);
    useEffect(()=>{
        if(!show||!modalRef.current) return;
        gsap.fromTo(modalRef.current,
            {y:80,opacity:0,scale:.9},
            {y:0,opacity:1,scale:1,duration:.55,ease:'back.out(1.5)'},
        );
    },[show]);

    if(!show) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(26,8,18,.85)',
                            backdropFilter:'blur(28px)',display:'flex',alignItems:'center',justifyContent:'center',
                            padding:24,overflowY:'auto'}}
                        onClick={e=>e.target===e.currentTarget&&onClose()}>
                <div ref={modalRef} style={{background:'rgba(253,246,240,.97)',backdropFilter:'blur(40px)',
                    borderRadius:T.r32,padding:'52px 44px',maxWidth:980,width:'100%',
                    position:'relative',boxShadow:'0 40px 120px rgba(26,8,18,.4)',
                    border:`1px solid rgba(136,14,79,.1)`}}>

                    <motion.button whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}}
                                   onClick={onClose}
                                   style={{position:'absolute',top:20,right:20,background:'rgba(136,14,79,.08)',
                                       border:`1px solid rgba(136,14,79,.15)`,borderRadius:'50%',width:38,height:38,
                                       display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                        <X size={16} color={T.roseDeep}/>
                    </motion.button>

                    <div style={{textAlign:'center',marginBottom:44}}>
                        <motion.div animate={{scale:[1,1.1,1],rotate:[0,4,-4,0]}} transition={{duration:3,repeat:Infinity}}
                                    style={{fontSize:40,marginBottom:14,filter:`drop-shadow(0 0 20px ${T.roseDeep})`}}>✦</motion.div>
                        <h2 style={{fontFamily:T.fontDisplay,fontSize:'clamp(24px,4vw,36px)',fontWeight:700,color:T.text,margin:'0 0 10px'}}>
                            Débloque ton potentiel amoureux
                        </h2>
                        <p style={{fontFamily:T.fontBody,fontSize:14,color:T.textSoft,margin:0,maxWidth:440,marginInline:'auto',lineHeight:1.7}}>
                            Ton profil est prêt. Choisis un plan pour rencontrer des étudiant·e·s de l'Université de Kara.
                        </p>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:20,marginBottom:36}}>
                        {PLAN_LIST.map((plan,i)=>{
                            const HL = plan.highlight;
                            const GD = plan.gold;
                            return (
                                <motion.div key={plan.name} initial={{opacity:0,y:36}} animate={{opacity:1,y:0}}
                                            transition={{delay:i*.12,type:'spring'}} whileHover={{y:HL?0:-6}}
                                            style={{borderRadius:T.r24,padding:'32px 24px',position:'relative',overflow:'hidden',
                                                transform:HL?'scale(1.04)':'scale(1)',
                                                background:HL?`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`
                                                    :GD?'rgba(253,246,240,.9)':'rgba(255,255,255,.9)',
                                                border:HL?'1px solid rgba(255,255,255,.22)'
                                                    :GD?`1px solid rgba(212,175,55,.3)`:`1px solid rgba(136,14,79,.1)`,
                                                boxShadow:HL?`0 28px 72px rgba(136,14,79,.3)`:GD?`0 12px 44px rgba(212,175,55,.14)`:`0 8px 36px rgba(136,14,79,.05)`,
                                            }}>
                                    {HL&&<motion.div animate={{x:['200%','-200%']}} transition={{duration:2.5,repeat:Infinity,ease:'linear'}}
                                                     style={{position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent)'}}/>}
                                    {plan.badge&&(
                                        <div style={{display:'inline-flex',background:HL?'rgba(255,255,255,.2)':GD?`rgba(212,175,55,.15)`:`rgba(136,14,79,.08)`,
                                            backdropFilter:'blur(8px)',border:HL?'1px solid rgba(255,255,255,.3)':GD?`1px solid rgba(212,175,55,.3)`:`1px solid rgba(136,14,79,.2)`,
                                            borderRadius:T.r48,padding:'4px 14px',marginBottom:18,
                                            fontFamily:T.fontBody,fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',
                                            color:HL?'rgba(255,255,255,.9)':GD?T.goldDark:T.roseDeep}}>
                                            ✦ {plan.badge}
                                        </div>
                                    )}
                                    <div style={{marginBottom:8}}>
                    <span style={{fontFamily:T.fontDisplay,fontSize:24,fontWeight:600,
                        color:HL?T.white:GD?T.goldDark:T.text}}>{plan.name}</span>
                                        <span style={{marginLeft:10,fontFamily:T.fontBody,fontSize:11,fontWeight:400,
                                            textTransform:'uppercase',letterSpacing:'.1em',
                                            color:HL?'rgba(255,255,255,.6)':T.roseDeep}}>{plan.nameEn}</span>
                                    </div>
                                    <p style={{fontFamily:T.fontBody,fontSize:12,lineHeight:1.65,margin:`0 0 20px`,
                                        color:HL?'rgba(255,255,255,.8)':T.textSoft}}>{plan.desc}</p>
                                    <div style={{marginBottom:24}}>
                    <span style={{fontFamily:T.fontDisplay,fontSize:plan.price===0?34:40,fontWeight:300,lineHeight:1,
                        color:HL?T.white:GD?T.goldDark:T.text}}>
                      {plan.price===0?'Gratuit':`${plan.price.toLocaleString('fr-FR')} F`}
                    </span>
                                        {plan.price>0&&<span style={{fontFamily:T.fontBody,fontSize:11,marginLeft:8,
                                            color:HL?'rgba(255,255,255,.6)':T.textSoft}}>CFA {plan.period}</span>}
                                    </div>
                                    <div style={{height:1,background:HL?'rgba(255,255,255,.15)':GD?'rgba(212,175,55,.2)':'rgba(136,14,79,.08)',marginBottom:20}}/>
                                    <ul style={{listStyle:'none',padding:0,margin:`0 0 24px`,display:'flex',flexDirection:'column',gap:10}}>
                                        {plan.features.map(f=>(
                                            <li key={f} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                                                <div style={{width:17,height:17,borderRadius:'50%',flexShrink:0,marginTop:1,
                                                    background:HL?'rgba(255,255,255,.2)':GD?'rgba(212,175,55,.15)':'rgba(136,14,79,.1)',
                                                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                                                    <Check size={9} color={HL?T.white:GD?T.goldDark:T.roseDeep} strokeWidth={2.5}/>
                                                </div>
                                                <span style={{fontFamily:T.fontBody,fontSize:12,lineHeight:1.5,fontWeight:400,
                                                    color:HL?'rgba(255,255,255,.9)':T.textMid}}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <motion.button whileHover={{scale:1.03,y:-2}} whileTap={{scale:.97}}
                                                   onClick={()=>{
                                                       toast.success(`Plan ${plan.name} activé !`,{style:{background:T.dark,color:T.white,fontFamily:T.fontBody,border:`1px solid ${T.roseDeep}`,borderRadius:T.r12}});
                                                       setTimeout(onDashboard,1300);
                                                   }}
                                                   style={{width:'100%',padding:'13px 20px',borderRadius:T.r48,cursor:'pointer',
                                                       fontFamily:T.fontBody,fontSize:12,fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',border:'none',
                                                       ...(HL?{background:T.white,color:T.roseDeep,boxShadow:`0 8px 24px rgba(0,0,0,.15)`}
                                                           :GD?{background:`linear-gradient(135deg,${T.gold},${T.goldDark})`,color:T.white,boxShadow:`0 8px 24px rgba(212,175,55,.3)`}
                                                               :{background:'transparent',color:T.roseDeep,border:`1.5px solid rgba(136,14,79,.3)`})}}>
                                        {plan.cta} →
                                    </motion.button>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16, marginTop:10}}>
                        {/* New Explicit Dashboard Skip Button */}
                        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onDashboard}
                                       style={{width:'100%', maxWidth: 400, padding:'16px', borderRadius:T.r24, border:`2px solid ${T.roseDeep}`,
                                           color:T.roseDeep, fontFamily:T.fontBody, fontSize:15, fontWeight:600,
                                           textAlign:'center', cursor:'pointer', background:'transparent',
                                           boxShadow:`0 8px 24px rgba(136,14,79,.05)`}}>
                            Passer cette étape et aller au Dashboard →
                        </motion.button>

                        <p style={{fontFamily:T.fontBody,fontSize:11,color:T.textSoft,margin:0,opacity:.6}}>
                            T-money · Flooz · Bitcoin · Carte bancaire · Sans engagement
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// PART 8 — FinalWelcome

function FinalWelcome({profile, onProceed}) {
    const containerRef = useRef(null);
    const titleRef     = useRef(null);
    const photoRef     = useRef(null);
    const ringsRef     = useRef([]);
    const statsRef     = useRef([]);

    useEffect(()=>{
        const endTime = Date.now() + 4800;
        const burst = ()=>{
            confetti({particleCount:8,angle:60,spread:58,origin:{x:0},
                colors:['#880E4F','#D4AF37','#E6E6FA','#fff']});
            confetti({particleCount:8,angle:120,spread:58,origin:{x:1},
                colors:['#880E4F','#D4AF37','#E6E6FA','#fff']});
            if(Date.now()<endTime) requestAnimationFrame(burst);
        };
        burst();

        setTimeout(()=>{
            confetti({particleCount:120,spread:100,origin:{y:.55},
                colors:['#880E4F','#D4AF37','#E6E6FA'],decay:.9,scalar:1.2});
        },400);

        if(photoRef.current) {
            gsap.fromTo(photoRef.current,
                {scale:0,opacity:0,rotate:-20},
                {scale:1,opacity:1,rotate:0,duration:.9,ease:'back.out(2)',delay:.3},
            );
        }

        ringsRef.current.forEach((r,i)=>{
            if(!r) return;
            gsap.to(r,{rotate:i%2===0?360:-360,duration:20+i*8,repeat:-1,ease:'none'});
            gsap.fromTo(r,{opacity:0,scale:.4},{opacity:1,scale:1,duration:.8,delay:.2+i*.15,ease:'back.out(1.5)'});
        });

        if(titleRef.current) {
            const chars = titleRef.current.querySelectorAll('.fc');
            gsap.fromTo(chars,
                {opacity:0,y:50,rotateX:-70,scale:.7},
                {opacity:1,y:0,rotateX:0,scale:1,stagger:.04,duration:.7,ease:'back.out(2)',delay:.6},
            );
        }

        statsRef.current.forEach((s,i)=>{
            if(!s) return;
            gsap.fromTo(s,
                {opacity:0,y:28,scale:.85},
                {opacity:1,y:0,scale:1,duration:.6,delay:1.2+i*.15,ease:'back.out(1.7)'},
            );
        });

        gsap.fromTo('.welcome-cta',
            {boxShadow:`0 16px 48px rgba(136,14,79,.2)`},
            {boxShadow:`0 24px 72px rgba(136,14,79,.4)`,duration:1.5,repeat:-1,yoyo:true,ease:'power2.inOut',delay:2},
        );

    },[]);

    const title = 'Bienvenue sur LoveLine !';

    return (
        <div ref={containerRef} style={{
            minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
            flexDirection:'column',padding:40,textAlign:'center',position:'relative',zIndex:1,
        }}>
            {[200,280,360,440,540].map((sz,i)=>(
                <div key={i} ref={el=>ringsRef.current[i]=el}
                     style={{position:'absolute',top:'50%',left:'50%',
                         width:sz,height:sz,borderRadius:'50%',
                         border:`${i<2?'1.5':'1'}px solid rgba(136,14,79,${.08-i*.015})`,
                         transform:'translate(-50%,-50%)',pointerEvents:'none',opacity:0,
                         boxShadow:i===0?`0 0 30px rgba(136,14,79,.08)`:
                             i===1?`0 0 20px rgba(212,175,55,.05)`:undefined,
                     }}/>
            ))}

            <div ref={photoRef} style={{position:'relative',marginBottom:36,opacity:0}}>
                <motion.div animate={{rotate:360}} transition={{duration:3.5,repeat:Infinity,ease:'linear'}}
                            style={{position:'absolute',inset:-6,borderRadius:'50%',zIndex:-1,
                                background:`conic-gradient(${T.roseDeep},${T.gold},${T.lavender},${T.roseDeep})`}}/>
                <div style={{position:'absolute',inset:-2,borderRadius:'50%',background:T.cream,zIndex:-1}}/>
                <div style={{width:130,height:130,borderRadius:'50%',overflow:'hidden',
                    boxShadow:`0 0 0 4px ${T.roseDeep}33,0 28px 72px rgba(136,14,79,.25)`}}>
                    {profile.photo?(
                        <img src={profile.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    ):(
                        <div style={{width:'100%',height:'100%',
                            background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                            display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <User size={52} color="white"/>
                        </div>
                    )}
                </div>
                <div style={{position:'absolute',bottom:6,right:6,width:22,height:22,borderRadius:'50%',
                    background:'#4ADE80',border:`3px solid ${T.cream}`,
                    boxShadow:'0 2px 8px rgba(74,222,128,.5)'}}>
                    <motion.div animate={{scale:[1,1.4,1],opacity:[.8,0,.8]}} transition={{duration:2,repeat:Infinity}}
                                style={{width:'100%',height:'100%',borderRadius:'50%',background:'rgba(74,222,128,.5)'}}/>
                </div>
            </div>

            <div ref={titleRef} style={{perspective:800,marginBottom:24}}>
                <h1 style={{fontFamily:T.fontDisplay,fontSize:'clamp(28px,5.5vw,54px)',fontWeight:700,
                    color:T.text,margin:0,display:'inline-flex',flexWrap:'wrap',justifyContent:'center',gap:'.05em'}}>
                    {title.split('').map((ch,i)=>(
                        <span key={i} className="fc" style={{display:'inline-block',opacity:0,
                            color:ch==='!'?T.roseDeep:T.text,
                            textShadow:ch==='!'?`0 0 20px rgba(136,14,79,.3)`:undefined}}>
              {ch===' '?'\u00A0':ch}
            </span>
                    ))}
                </h1>
            </div>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1.1,duration:.6}}
                      style={{fontFamily:T.fontBody,fontSize:17,color:T.textMid,
                          maxWidth:480,lineHeight:1.75,margin:`0 auto 52px`,}}>
                Ton profil est prêt à briller. Des étudiant·e·s extraordinaires de l'Université de Kara t'attendent déjà.
                L'aventure commence maintenant.
            </motion.p>

            <div style={{display:'flex',gap:40,marginBottom:56,flexWrap:'wrap',justifyContent:'center'}}>
                {[
                    {n:'2 400+', l:'Étudiants actifs'},
                    {n:'91%',    l:'Matching réussi'},
                    {n:'< 24h',  l:'1er contact moyen'},
                ].map((s,i)=>(
                    <div key={s.l} ref={el=>statsRef.current[i]=el} style={{textAlign:'center',opacity:0}}>
                        <div style={{fontFamily:T.fontDisplay,fontSize:28,fontWeight:700,
                            background:`linear-gradient(135deg,${T.roseDeep},${T.gold})`,
                            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                            {s.n}
                        </div>
                        <div style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,
                            textTransform:'uppercase',letterSpacing:'.1em',marginTop:4}}>
                            {s.l}
                        </div>
                    </div>
                ))}
            </div>

            <motion.button className="welcome-cta"
                           initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:1.8,type:'spring',stiffness:180}}
                           whileHover={{scale:1.06,y:-4}} whileTap={{scale:.96}}
                           onClick={onProceed}
                           style={{padding:'22px 56px',background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                               border:'none',borderRadius:T.r48,fontFamily:T.fontBody,fontSize:17,fontWeight:700,
                               letterSpacing:'.07em',textTransform:'uppercase',color:T.white,cursor:'pointer',
                               boxShadow:`0 16px 48px rgba(136,14,79,.3)`,
                               display:'inline-flex',alignItems:'center',gap:14,position:'relative',overflow:'hidden'}}>
                <motion.div animate={{x:['200%','-200%']}} transition={{duration:2,repeat:Infinity,ease:'linear'}}
                            style={{position:'absolute',inset:0,
                                background:'linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)'}}/>
                <Heart size={22} fill="white"/>
                Découvrir les offres
                <ArrowRight size={22}/>
            </motion.button>

            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2.2}}
                      style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,marginTop:24,opacity:.65}}>
                Profil envoyé avec succès · Bienvenue à l'Université de Kara ✦
            </motion.p>
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// PART 9 — GlobalStyles + Main Component

function GlobalStyles() {
    return (
        <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      html { scroll-behavior: smooth; }

      body {
        background: #FDF6F0;
        color: #1A0812;
        font-family: 'Inter', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow-x: hidden;
      }

      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(136,14,79,0.25); border-radius: 99px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(136,14,79,0.45); }

      input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer; opacity: 0.65;
        filter: invert(15%) sepia(80%) saturate(300%) hue-rotate(320deg);
      }

      input[type="date"] { color-scheme: light; transition: border-color .3s, box-shadow .3s; }
      input[type="date"]:focus {
        border-color: #880E4F !important;
        box-shadow: 0 0 0 3px rgba(136,14,79,0.12) !important;
        outline: none;
      }

      ::selection { background: rgba(136,14,79,0.15); color: #1A0812; }

      button { font-family: inherit; }
      textarea { font-family: inherit; }

      @media (max-width: 480px) {
        .interests-grid { grid-template-columns: repeat(2, 1fr) !important; }
      }
      @media (max-width: 700px) {
        .preview-flex { flex-direction: column !important; align-items: center !important; }
      }
      @media (max-width: 600px) {
        .sub-modal { padding: 32px 20px !important; }
        .sub-modal h2 { font-size: 22px !important; }
      }
    `}</style>
    );
}

export default function ProfileCompletion() {
    const navigate = useNavigate();

    const [stepIndex,      setStepIndex]      = useState(0);
    const [profile,        setProfile]        = useState({
        genre:'', birthday:'', academics:{ faculte:'', niveau:'' }, interests:[], bio:'', photo:null,
    });
    const [showReward,     setShowReward]     = useState(false);
    const [showFinal,      setShowFinal]      = useState(false);
    const [showSub,        setShowSub]        = useState(false);
    const [submitting,     setSubmitting]     = useState(false);
    const [direction,      setDirection]      = useState(1);

    const currentStep = STEPS[stepIndex];

    const canProceed = useMemo(()=>{
        switch(currentStep?.id) {
            case 'genre':     return !!profile.genre;
            case 'birthday':  return !!profile.birthday && calculateAge(profile.birthday) >= MIN_AGE;
            case 'academics': return !!profile.academics.faculte && !!profile.academics.niveau;
            case 'interests': return profile.interests.length >= MIN_INTERESTS;
            case 'bio':       return profile.bio.trim().length>0 && countWords(profile.bio)<=MAX_BIO_WORDS;
            case 'photo':     return !!profile.photo;
            case 'preview':   return true;
            default:          return false;
        }
    },[currentStep, profile]);

    const handleNext = useCallback(()=>{
        if(!canProceed) return;
        if(currentStep.id==='preview') { handlePublish(); return; }
        setDirection(1);
        setShowReward(true);
    },[canProceed, currentStep]);

    const onRewardDone = useCallback(()=>{
        setShowReward(false);
        setStepIndex(i=>i+1);
        window.scrollTo({top:0,behavior:'smooth'});
    },[]);

    const handleBack = useCallback(()=>{
        if(stepIndex===0) return;
        setDirection(-1);
        setStepIndex(i=>i-1);
        window.scrollTo({top:0,behavior:'smooth'});
    },[stepIndex]);

    const handlePublish = useCallback(async()=>{
        setSubmitting(true);
        try {
            const payload = {
                genre:      profile.genre,
                birthday:   profile.birthday,
                age:        calculateAge(profile.birthday),
                faculte:    profile.academics.faculte,
                niveau:     profile.academics.niveau,
                interests:  profile.interests,
                bio:        profile.bio.trim(),
                photo:      profile.photo,
                university: 'Université de Kara',
                createdAt:  new Date().toISOString(),
            };
            console.log('[LoveLine] Profile payload →', payload);
            await new Promise(r=>setTimeout(r,1000));
            setShowFinal(true);
        } catch(err) {
            console.error(err);
            toast.error('Erreur serveur. Réessaie dans un moment.',{
                style:{background:T.dark,color:T.white,fontFamily:T.fontBody,borderRadius:T.r12,border:`1px solid ${T.roseDeep}`}
            });
        } finally { setSubmitting(false); }
    },[profile]);

    const goDashboard = useCallback(()=>{ setShowSub(false); navigate('/dashboard'); },[navigate]);

    const slideVariants = {
        enter:  (d)=>({ x:d>0?80:-80, opacity:0, scale:.96 }),
        center: { x:0, opacity:1, scale:1 },
        exit:   (d)=>({ x:d>0?-80:80, opacity:0, scale:.96 }),
    };

    useEffect(()=>{
        const handler = e=>{
            if(e.key==='Enter'&&canProceed&&!showReward&&!showFinal&&!showSub) handleNext();
            if(e.key==='ArrowLeft'&&stepIndex>0) handleBack();
        };
        window.addEventListener('keydown',handler);
        return ()=>window.removeEventListener('keydown',handler);
    },[canProceed,handleNext,handleBack,showReward,showFinal,showSub,stepIndex]);

    if(showFinal) {
        return (
            <div style={{minHeight:'100vh',background:T.cream,position:'relative',overflow:'hidden'}}>
                <GlobalStyles/>
                <AnimatedMesh/>
                <FloatingHearts/>
                <Navbar/>
                <FinalWelcome profile={profile} onProceed={()=>setShowSub(true)}/>
                <SubscriptionModal show={showSub} onClose={()=>setShowSub(false)} onDashboard={goDashboard}/>
                <Toaster position="top-center" toastOptions={{duration:3500}}/>
            </div>
        );
    }

    return (
        <div style={{minHeight:'100vh',background:T.cream,position:'relative',overflowX:'hidden'}}>
            <GlobalStyles/>
            <AnimatedMesh/>
            <FloatingHearts/>
            <Navbar/>
            <Toaster position="top-center" toastOptions={{duration:3500}}/>

            <RewardOverlay show={showReward} onComplete={onRewardDone} stepIndex={stepIndex}/>

            <div style={{maxWidth:780,margin:'0 auto',padding:'88px 24px 88px',position:'relative',zIndex:1}}>

                <motion.div initial={{opacity:0,y:-28}} animate={{opacity:1,y:0}} transition={{duration:.65,ease:'easeOut'}}
                            style={{background:T.glass,backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
                                border:`1px solid ${T.border}`,borderRadius:T.r32,padding:'36px 36px 28px',
                                marginBottom:36,boxShadow:T.shadow,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:4,
                        background:`linear-gradient(90deg,${T.roseDeep},${T.gold})`,
                        borderRadius:`${T.r32} ${T.r32} 0 0`}}/>

                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:14}}>
                            <motion.div animate={{scale:[1,1.1,1],rotate:[0,6,-6,0]}}
                                        transition={{duration:5,repeat:Infinity,ease:'easeInOut'}}
                                        style={{width:48,height:48,borderRadius:T.r12,
                                            background:`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`,
                                            display:'flex',alignItems:'center',justifyContent:'center',
                                            boxShadow:`0 8px 28px rgba(136,14,79,.2)`}}>
                                <Heart size={24} color="white" fill="white"/>
                            </motion.div>
                            <div>
                                <p style={{fontFamily:T.fontDisplay,fontSize:19,fontWeight:700,color:T.text,margin:0,letterSpacing:'.01em'}}>
                                    LoveLine
                                </p>
                                <p style={{fontFamily:T.fontBody,fontSize:11,color:T.textSoft,margin:0,letterSpacing:'.1em',textTransform:'uppercase'}}>
                                    Université de Kara · Togo
                                </p>
                            </div>
                        </div>
                        <div style={{background:'rgba(136,14,79,.06)',border:`1px solid rgba(136,14,79,.15)`,
                            borderRadius:T.r48,padding:'8px 18px',display:'flex',alignItems:'center',gap:8}}>
                            <motion.div animate={{opacity:[1,.4,1]}} transition={{duration:1.8,repeat:Infinity}}
                                        style={{width:7,height:7,borderRadius:'50%',background:T.roseDeep}}/>
                            <span style={{fontFamily:T.fontBody,fontSize:12,fontWeight:600,color:T.roseDeep}}>Création de profil</span>
                        </div>
                    </div>

                    <ProgressIndicator stepIndex={stepIndex} pct={currentStep.pct}/>

                    <AnimatePresence mode="wait">
                        <motion.p key={stepIndex} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                                  style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,marginTop:16,marginBottom:0,
                                      padding:'10px 16px',background:'rgba(136,14,79,.03)',borderRadius:T.r12,
                                      border:'1px solid rgba(136,14,79,.08)',lineHeight:1.6}}>
                            💡 {currentStep?.title === 'Je suis…' ? 'Cette info permet de te proposer des profils compatibles.' :
                            currentStep?.title === 'Date de naissance' ? `Tu dois avoir au moins ${MIN_AGE} ans pour rejoindre LoveLine.` :
                                currentStep?.title === 'Mes études' ? `Permet de matcher avec des personnes dans la même discipline ou ailleurs !` :
                                    currentStep?.title === 'Mes passions' ? `Choisis entre ${MIN_INTERESTS} et ${MAX_INTERESTS} passions.` :
                                        currentStep?.title === 'Mon histoire' ? 'Une bio percutante multiplie tes chances de matching.' :
                                            currentStep?.title === 'Ma photo' ? 'Tu peux recadrer et ajuster ta photo ici même.' :
                                                'Vérifie que tout est parfait avant de publier !'}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div key={`title-${stepIndex}`}
                                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}
                                transition={{duration:.42}} style={{marginBottom:36,textAlign:'center'}}>
                        <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
                                    transition={{type:'spring',stiffness:220,damping:16}}
                                    style={{width:68,height:68,borderRadius:T.r20,
                                        background:`linear-gradient(135deg,${T.roseDeep}1A,${T.roseDeep}33)`,
                                        border:`1.5px solid rgba(136,14,79,.15)`,
                                        display:'flex',alignItems:'center',justifyContent:'center',margin:`0 auto 18px`,
                                        boxShadow:`0 8px 28px rgba(136,14,79,.08)`}}>
                            {React.createElement(currentStep.icon,{size:30,color:T.roseDeep})}
                        </motion.div>
                        <h1 style={{fontFamily:T.fontDisplay,fontSize:'clamp(24px,4.5vw,38px)',
                            fontWeight:700,color:T.text,margin:`0 0 8px`}}>
                            {currentStep.title}
                        </h1>
                        <p style={{fontFamily:T.fontBody,fontSize:15,color:T.textSoft,margin:0}}>
                            {currentStep.subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <LayoutGroup>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div key={currentStep.id} custom={direction}
                                    variants={slideVariants} initial="enter" animate="center" exit="exit"
                                    transition={{duration:.52,ease:[.25,.46,.45,.94]}}>
                            {currentStep.id==='genre'     && <StepGenre     value={profile.genre}     onChange={v=>setProfile(p=>({...p,genre:v}))}/>}
                            {currentStep.id==='birthday'  && <StepBirthday  value={profile.birthday}  onChange={v=>setProfile(p=>({...p,birthday:v}))}/>}
                            {currentStep.id==='academics' && <StepAcademics value={profile.academics} onChange={v=>setProfile(p=>({...p,academics:v}))}/>}
                            {currentStep.id==='interests' && <StepInterests value={profile.interests} onChange={v=>setProfile(p=>({...p,interests:v}))}/>}
                            {currentStep.id==='bio'       && <StepBio       value={profile.bio}       onChange={v=>setProfile(p=>({...p,bio:v}))}/>}
                            {currentStep.id==='photo'     && <StepPhoto     value={profile.photo}     onChange={v=>setProfile(p=>({...p,photo:v}))}/>}
                            {currentStep.id==='preview'   && <PreviewStep   profile={profile}/>}
                        </motion.div>
                    </AnimatePresence>
                </LayoutGroup>

                <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.4}}
                            style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:52,gap:16}}>

                    {stepIndex>0?(
                        <motion.button whileHover={{scale:1.04,x:-3}} whileTap={{scale:.96}}
                                       onClick={handleBack}
                                       style={{display:'flex',alignItems:'center',gap:8,padding:'13px 28px',
                                           background:'rgba(255,255,255,.75)',border:`1px solid ${T.border}`,
                                           borderRadius:T.r48,cursor:'pointer',fontFamily:T.fontBody,fontSize:13,color:T.textMid,
                                           backdropFilter:'blur(14px)',boxShadow:'0 4px 16px rgba(136,14,79,.05)',
                                           transition:'all .3s ease'}}>
                            <ChevronLeft size={19}/> Précédent
                        </motion.button>
                    ):<div/>}

                    <motion.button
                        whileHover={canProceed?{scale:1.05,boxShadow:`0 24px 64px rgba(136,14,79,.3)`}:{}}
                        whileTap={canProceed?{scale:.96}:{}}
                        onClick={handleNext}
                        disabled={!canProceed||submitting}
                        style={{display:'flex',alignItems:'center',gap:12,padding:'16px 44px',
                            background:canProceed?`linear-gradient(135deg,${T.roseDeep},${T.goldDark})`:'rgba(136,14,79,.1)',
                            border:'none',borderRadius:T.r48,
                            cursor:canProceed?'pointer':'not-allowed',
                            fontFamily:T.fontBody,fontSize:14,fontWeight:700,letterSpacing:'.07em',
                            color:canProceed?T.white:T.textSoft,
                            boxShadow:canProceed?`0 12px 44px rgba(136,14,79,.2)`:'none',
                            transition:'all .4s cubic-bezier(.34,1.56,.64,1)',
                            position:'relative',overflow:'hidden',minWidth:172}}>
                        {canProceed&&(
                            <motion.div animate={{x:['200%','-200%']}} transition={{duration:2,repeat:Infinity,ease:'linear'}}
                                        style={{position:'absolute',inset:0,
                                            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)'}}/>
                        )}
                        {submitting?(
                            <>
                                <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}>
                                    <RefreshCw size={19}/>
                                </motion.div>
                                Publication…
                            </>
                        ):currentStep.id==='preview'?(
                            <><Heart size={19} fill="white"/> Publier mon profil <ArrowRight size={19}/></>
                        ):(
                            <>Continuer <ChevronRight size={19}/></>
                        )}
                    </motion.button>
                </motion.div>

                <AnimatePresence>
                    {!canProceed&&(
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                                    exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                            <p style={{fontFamily:T.fontBody,fontSize:12,color:T.textSoft,
                                textAlign:'center',marginTop:18,
                                padding:'10px 16px',background:'rgba(136,14,79,.03)',
                                borderRadius:T.r12,border:'1px solid rgba(136,14,79,.08)'}}>
                                {currentStep.id==='interests'&&profile.interests.length<MIN_INTERESTS
                                    ?`Sélectionne encore ${MIN_INTERESTS-profile.interests.length} passion${MIN_INTERESTS-profile.interests.length>1?'s':''} pour continuer ✦`
                                    :currentStep.id==='bio'&&countWords(profile.bio)>MAX_BIO_WORDS
                                        ?`Ta bio dépasse la limite de ${MAX_BIO_WORDS} mots ✦`
                                        :`Complète cette étape pour continuer ✦`}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}