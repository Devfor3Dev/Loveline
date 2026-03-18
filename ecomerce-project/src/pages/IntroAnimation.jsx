import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function IntroAnimation({ onComplete }) {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const heartRef = useRef(null);
    const glowRef = useRef(null);
    const lineRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.to(containerRef.current, {
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power2.inOut',
                        onComplete,
                    });
                },
            });

            // Start hidden
            gsap.set([logoRef.current, heartRef.current, lineRef.current], {
                opacity: 0,
                y: 20,
            });
            gsap.set(glowRef.current, { scale: 0, opacity: 0 });

            // Glow burst
            tl.to(glowRef.current, {
                scale: 1.6,
                opacity: 0.35,
                duration: 1.2,
                ease: 'power2.out',
            })
                // Heart icon
                .to(heartRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'back.out(1.7)',
                }, '-=0.5')
                // Logo text
                .to(logoRef.current, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                }, '-=0.3')
                // Underline
                .to(lineRef.current, {
                    opacity: 1,
                    y: 0,
                    scaleX: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                }, '-=0.3')
                // Hold
                .to({}, { duration: 1.4 })
                // Fade logo
                .to([logoRef.current, heartRef.current, lineRef.current], {
                    opacity: 0,
                    y: -16,
                    stagger: 0.06,
                    duration: 0.5,
                    ease: 'power2.in',
                })
                .to(glowRef.current, { opacity: 0, scale: 2, duration: 0.6 }, '-=0.4');
        }, containerRef);

        return () => ctx.revert();
    }, [onComplete]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'var(--black)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
            }}
        >
            {/* Radial glow */}
            <div
                ref={glowRef}
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background:
                        'radial-gradient(circle, rgba(219,39,119,0.4) 0%, rgba(157,23,77,0.15) 50%, transparent 70%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Heart SVG */}
            <div ref={heartRef}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path
                        d="M24 42s-18-11.5-18-22A10 10 0 0 1 24 12a10 10 0 0 1 18 8c0 10.5-18 22-18 22z"
                        fill="none"
                        stroke="#d4af37"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M24 42s-18-11.5-18-22A10 10 0 0 1 24 12a10 10 0 0 1 18 8c0 10.5-18 22-18 22z"
                        fill="rgba(219,39,119,0.2)"
                    />
                </svg>
            </div>

            {/* Logo text */}
            <div
                ref={logoRef}
                style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(48px, 8vw, 88px)',
                    fontWeight: 300,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                }}
            >
                LoveLine
            </div>

            {/* Gold underline */}
            <div
                ref={lineRef}
                style={{
                    width: '80px',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                    transformOrigin: 'center',
                }}
            />
        </div>
    );
}