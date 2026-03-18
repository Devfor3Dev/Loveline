import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const STRIP_PHOTOS = [
    { src: 'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Arlette' },
    { src: 'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Arlette' },
    { src: ''https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Arlette' },
    { src: 'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Arlette' },
    { src: 'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Constant' },
    { src: 'https://images.unsplash.com/photo-1506836467174-27f1042aa48c?w=320&q=80', label: 'Arlette' },
];

function PhotoCard({ src, label }) {
    return (
        <div
            style={{
                flexShrink: 0,
                width: '260px',
                height: '360px',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                marginRight: '24px',
                boxShadow: 'var(--shadow-card)',
                border: '2px solid rgba(255,255,255,0.8)',
                transition: 'transform 0.4s var(--transition-spring)',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03) translateY(-8px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
            }}
        >
            <img
                src={src}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 50%, rgba(80,7,36,0.55))',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'rgba(255,240,245,0.18)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '12px',
                padding: '8px 14px',
            }}>
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    color: 'rgba(255,255,255,0.9)',
                    textTransform: 'uppercase',
                }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

export default function PhotoStrip() {
    const trackRef = useRef(null);
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const track = trackRef.current;
            const totalWidth = track.scrollWidth / 2;

            gsap.to(track, {
                x: `-${totalWidth}px`,
                duration: 28,
                ease: 'none',
                repeat: -1,
                modifiers: {
                    x: gsap.utils.unitize((val) => parseFloat(val) % totalWidth),
                },
            });

            // Entrance
            gsap.fromTo(sectionRef.current,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 85%',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const doubled = [...STRIP_PHOTOS, ...STRIP_PHOTOS];

    return (
        <section
            ref={sectionRef}
            style={{
                padding: '96px 0',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, var(--bg) 0%, var(--secondary) 50%, var(--bg) 100%)',
            }}
        >
            {/* Label */}
            <div style={{
                textAlign: 'center',
                marginBottom: '48px',
                padding: '0 48px',
            }}>
                <div className="section-label" style={{ justifyContent: 'center' }}>
                    Histoires vraies
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 4vw, 56px)',
                    fontWeight: 300,
                    color: 'var(--text)',
                    lineHeight: 1.2,
                }}>
                    Des connexions qui durent
                </h2>
            </div>

            {/* Scrolling strip */}
            <div style={{ position: 'relative' }}>
                {/* Left fade */}
                <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '120px',
                    background: 'linear-gradient(to right, var(--bg), transparent)',
                    zIndex: 2, pointerEvents: 'none',
                }} />
                {/* Right fade */}
                <div style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: '120px',
                    background: 'linear-gradient(to left, var(--bg), transparent)',
                    zIndex: 2, pointerEvents: 'none',
                }} />

                <div
                    ref={trackRef}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '48px',
                        willChange: 'transform',
                    }}
                >
                    {doubled.map((p, i) => (
                        <PhotoCard key={i} src={p.src} label={p.label} />
                    ))}
                </div>
            </div>
        </section>
    );
}
