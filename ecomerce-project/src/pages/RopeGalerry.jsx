import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ROPE_PHOTOS = [
    'https://images.unsplash.com/photo-1529636444744-4b0f7a0ace9e?w=280&q=80',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=280&q=80',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=280&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=280&q=80',
    'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=280&q=80',
];

export default function RopeGallery() {
    const sectionRef = useRef(null);
    const svgRef = useRef(null);
    const photosRef = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Rope draw animation
            const path = svgRef.current?.querySelector('path');
            if (path) {
                const len = path.getTotalLength();
                gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
                gsap.to(path, {
                    strokeDashoffset: 0,
                    duration: 2.5,
                    ease: 'power2.inOut',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 75%',
                    },
                });
            }

            // Photos hang in with swing
            photosRef.current.forEach((photo, i) => {
                gsap.fromTo(photo,
                    { opacity: 0, y: -40, rotate: i % 2 === 0 ? -15 : 15 },
                    {
                        opacity: 1,
                        y: 0,
                        rotate: i % 2 === 0 ? -4 + i * 1.5 : 4 - i * 1.5,
                        duration: 1.2,
                        delay: 0.3 + i * 0.18,
                        ease: 'elastic.out(1, 0.5)',
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: 'top 75%',
                        },
                    }
                );

                // Gentle sway
                gsap.to(photo, {
                    rotate: `+=${i % 2 === 0 ? 3 : -3}`,
                    duration: 2.5 + i * 0.4,
                    ease: 'sine.inOut',
                    repeat: -1,
                    yoyo: true,
                    delay: i * 0.3,
                });
            });

            // Section fade in
            gsap.fromTo('.rope-header',
                { opacity: 0, y: 32 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: '.rope-header', start: 'top 85%' },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            style={{
                padding: '120px 48px',
                background: 'linear-gradient(180deg, var(--bg) 0%, var(--secondary) 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div className="rope-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
                <div className="section-label" style={{ justifyContent: 'center' }}>
                    Galerie
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 4vw, 56px)',
                    fontWeight: 300,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                }}>
                    Leurs histoires,<br />
                    <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>tes inspirations</em>
                </h2>
            </div>

            {/* Rope + Photos container */}
            <div style={{
                position: 'relative',
                maxWidth: '1100px',
                margin: '0 auto',
                height: '440px',
            }}>
                {/* SVG Rope */}
                <svg
                    ref={svgRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '160px',
                        overflow: 'visible',
                        zIndex: 1,
                    }}
                    viewBox="0 0 1100 160"
                    preserveAspectRatio="none"
                >
                    {/* Main rope curve */}
                    <path
                        d="M 0 40 C 120 20, 200 80, 275 50 C 350 20, 430 80, 550 55 C 670 30, 750 80, 825 50 C 900 20, 980 70, 1100 40"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="1.5"
                        opacity="0.7"
                    />
                    {/* Shadow rope */}
                    <path
                        d="M 0 40 C 120 20, 200 80, 275 50 C 350 20, 430 80, 550 55 C 670 30, 750 80, 825 50 C 900 20, 980 70, 1100 40"
                        fill="none"
                        stroke="rgba(157,23,77,0.15)"
                        strokeWidth="3"
                    />

                    {/* Clips / pegs */}
                    {[140, 305, 465, 635, 800].map((x, i) => (
                        <g key={i}>
                            <rect
                                x={x - 4} y={i % 2 === 0 ? 44 : 42}
                                width="8" height="14"
                                rx="2"
                                fill="var(--gold)"
                                opacity="0.8"
                            />
                            <line
                                x1={x} y1={i % 2 === 0 ? 58 : 56}
                                x2={x} y2={180}
                                stroke="rgba(212,175,55,0.35)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        </g>
                    ))}
                </svg>

                {/* Photos hanging */}
                {ROPE_PHOTOS.map((src, i) => {
                    const positions = [80, 237, 392, 560, 720];
                    const heights = [80, 100, 75, 95, 85];
                    const widths = [160, 140, 155, 145, 158];
                    const aspectRatios = [1.35, 1.5, 1.25, 1.4, 1.3];

                    return (
                        <div
                            key={i}
                            ref={(el) => (photosRef.current[i] = el)}
                            style={{
                                position: 'absolute',
                                top: `${heights[i]}px`,
                                left: `${positions[i]}px`,
                                width: `${widths[i]}px`,
                                height: `${Math.round(widths[i] * aspectRatios[i])}px`,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 16px 40px rgba(80,7,36,0.2), 0 4px 12px rgba(0,0,0,0.12)',
                                border: '3px solid rgba(255,255,255,0.95)',
                                transformOrigin: 'top center',
                                zIndex: 2,
                                cursor: 'pointer',
                                transition: 'box-shadow 0.3s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 24px 56px rgba(80,7,36,0.3), 0 8px 20px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 16px 40px rgba(80,7,36,0.2), 0 4px 12px rgba(0,0,0,0.12)';
                            }}
                        >
                            <img
                                src={src}
                                alt={`Couple ${i + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Slight vignette */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(80,7,36,0.15))',
                            }} />
                        </div>
                    );
                })}

                {/* Decorative hearts */}
                {[180, 460, 740].map((left, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: '20px',
                        left: `${left}px`,
                        fontSize: '12px',
                        opacity: 0.4,
                        color: 'var(--accent)',
                        animation: `float-heart ${2 + i * 0.5}s ease-in-out infinite alternate`,
                    }}>
                        ♡
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes float-heart {
          from { transform: translateY(0); }
          to   { transform: translateY(-6px); }
        }
        @media (max-width: 768px) {
          section > div[style*="height: 440px"] {
            height: 320px !important;
            overflow-x: auto;
          }
        }
      `}</style>
        </section>
    );
}