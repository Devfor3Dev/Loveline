import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROPE_PHOTOS = [
    'https://images.unsplash.com/photo-1529636444744-4b0f7a0ace9e?w=600&q=80',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
];

const C = {
    primary: "#9d174d",
    accent: "#db2777",
    text: "#500724",
    secondary: "#fce7f3",
    gold: "#d4af37",
    white: "#ffffff"
};

export default function RopeGallery() {
    const sectionRef = useRef(null);
    const svgRef = useRef(null);
    const photosRef = useRef([]);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const ctx = gsap.context(() => {
            // 1. Dessin de la corde (GSAP)
            const path = svgRef.current?.querySelector('.main-path');
            if (path) {
                const len = path.getTotalLength();
                gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
                gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 3,
                    ease: "power2.inOut",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 60%",
                    }
                });
            }

            // 2. Balancement des photos (Animation organique)
            photosRef.current.forEach((photo, i) => {
                if (!photo) return;

                // Entrée
                gsap.fromTo(photo,
                    { opacity: 0, scale: 0.8, y: -20 },
                    {
                        opacity: 1, scale: 1, y: 0,
                        duration: 1.5,
                        delay: i * 0.2,
                        ease: "expo.out",
                        scrollTrigger: {
                            trigger: photo,
                            start: "top 90%",
                        }
                    }
                );

                // Swing perpétuel
                gsap.to(photo, {
                    rotate: i % 2 === 0 ? 2 : -2,
                    duration: 3 + i,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: i * 0.5
                });
            });
        }, sectionRef);

        return () => {
            ctx.revert();
            window.removeEventListener('resize', checkMobile);
        };
    }, [isMobile]);

    // Path de la corde : Horizontal pour PC, Zigzag pour Mobile
    const desktopPath = "M 0 50 C 150 20, 350 120, 550 60 C 750 20, 950 120, 1100 50";
    const mobilePath = "M 50 0 C 80 150, 20 300, 50 450 C 80 600, 20 750, 50 900";

    return (
        <section ref={sectionRef} style={s.section}>
            <div className="header" style={s.header}>
                <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    style={s.label}
                >
                    GALERIE
                </motion.span>
                <h2 style={s.title}>
                    Leurs histoires, <br />
                    <span style={s.italic}>tes inspirations.</span>
                </h2>
            </div>

            <div style={isMobile ? s.mobileContainer : s.desktopContainer}>
                {/* La Corde SVG */}
                <svg
                    ref={svgRef}
                    viewBox={isMobile ? "0 0 100 900" : "0 0 1100 160"}
                    preserveAspectRatio={isMobile ? "xMidYMin meet" : "none"}
                    style={s.svg}
                >
                    <path
                        className="main-path"
                        d={isMobile ? mobilePath : desktopPath}
                        fill="none"
                        stroke={C.gold}
                        strokeWidth={isMobile ? "1" : "1.5"}
                    />
                </svg>

                {/* Photos */}
                {ROPE_PHOTOS.map((src, i) => (
                    <motion.div
                        key={i}
                        ref={el => photosRef.current[i] = el}
                        whileHover={{ scale: 1.05, zIndex: 50 }}
                        style={{
                            ...s.photoCard,
                            ...(isMobile ? s.mobilePos(i) : s.desktopPos(i))
                        }}
                    >
                        <div style={s.polaroid}>
                            <img src={src} alt="" style={s.img} />
                            <div style={s.goldClip} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,400&family=Montserrat:wght@300;500&display=swap');
            `}</style>
        </section>
    );
}

/* ─── DESIGN SYSTEM "ART PUR" ─── */

const s = {
    section: {
        padding: '100px 0',
        backgroundColor: C.white,
        position: 'relative',
        overflow: 'hidden',
    },
    header: {
        textAlign: 'center',
        marginBottom: '100px',
        padding: '0 20px'
    },
    label: {
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '12px',
        letterSpacing: '4px',
        color: C.primary,
        display: 'block',
        marginBottom: '20px'
    },
    title: {
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 'clamp(40px, 6vw, 70px)',
        fontWeight: 300,
        color: C.text,
        lineHeight: 1,
    },
    italic: { fontStyle: 'italic', color: C.accent },

    // Conteneurs
    desktopContainer: {
        position: 'relative',
        maxWidth: '1100px',
        margin: '0 auto',
        height: '500px',
    },
    mobileContainer: {
        position: 'relative',
        width: '100%',
        height: '1000px', // Plus haut pour le zigzag
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    svg: {
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1
    },

    // Photos & Styles
    photoCard: {
        position: 'absolute',
        zIndex: 2,
        cursor: 'pointer',
    },
    polaroid: {
        padding: '10px 10px 30px 10px',
        backgroundColor: C.white,
        boxShadow: `0 20px 50px rgba(80, 7, 36, 0.12)`,
        border: `1px solid ${C.secondary}`,
        borderRadius: '2px',
        position: 'relative'
    },
    img: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '1px'
    },
    goldClip: {
        position: 'absolute',
        top: '-15px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8px',
        height: '25px',
        backgroundColor: C.gold,
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },

    // Logic de positionnement
    desktopPos: (i) => ({
        width: '200px',
        height: '260px',
        left: `${15 + i * 22}%`,
        top: i % 2 === 0 ? '60px' : '100px',
        transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`
    }),

    mobilePos: (i) => ({
        width: '240px',
        height: '320px',
        top: `${i * 220}px`,
        left: i % 2 === 0 ? '10%' : '25%',
        transform: `rotate(${i % 2 === 0 ? -4 : 4}deg)`
    })
};