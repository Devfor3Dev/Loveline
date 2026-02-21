import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
    {
        quote: "Je n'aurais jamais imaginé rencontrer l'amour à la bibliothèque. LoveLine m'a montré qu'il était juste à côté de moi depuis des mois. On se retrouve tous les soirs maintenant.",
        name: 'Aminata K.',
        role: 'Étudiante en Droit',
        university: 'Université de Lomé',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80',
    },
    {
        quote: "Ce que j'aime avec LoveLine, c'est que tout le monde est vraiment étudiant. Pas de faux profils, pas de mensonges. Juste des gens sincères qui cherchent quelque chose de vrai.",
        name: 'Kwame A.',
        role: 'Étudiant en Informatique',
        university: 'UCAD, Dakar',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80',
    },
    {
        quote: "En six mois sur LoveLine, j'ai trouvé quelqu'un qui partage mes ambitions, mes rires et mon amour du fufu. C'est rare, et c'est précieux. Merci.",
        name: 'Adjoa M.',
        role: 'Étudiante en Médecine',
        university: 'Université de Cocody',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80',
    },
    {
        quote: "L'algorithme de matching est bluffant. Dès le premier soir, on parlait de tout. Comme si on se connaissait depuis toujours. On sort ensemble depuis 8 mois maintenant.",
        name: 'Ibrahim D.',
        role: 'Étudiant en Économie',
        university: 'UAC, Cotonou',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    },
];

export default function Testimonials() {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);
    const sectionRef = useRef(null);
    const quoteRef = useRef(null);
    const authorRef = useRef(null);

    const go = (dir) => {
        if (animating) return;
        setAnimating(true);

        gsap.to([quoteRef.current, authorRef.current], {
            opacity: 0,
            y: dir > 0 ? -20 : 20,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                setCurrent((prev) => (prev + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
                gsap.fromTo(
                    [quoteRef.current, authorRef.current],
                    { opacity: 0, y: dir > 0 ? 20 : -20 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.5,
                        ease: 'power3.out',
                        stagger: 0.08,
                        onComplete: () => setAnimating(false),
                    }
                );
            },
        });
    };

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(sectionRef.current,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
                }
            );
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    // Auto advance
    useEffect(() => {
        const id = setTimeout(() => go(1), 5000);
        return () => clearTimeout(id);
    }, [current]);

    const t = TESTIMONIALS[current];

    return (
        <section
            ref={sectionRef}
            id="témoignages"
            style={{
                padding: '128px 48px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #6b0f33 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative floral SVG top-left */}
            <svg
                style={{ position: 'absolute', top: 0, left: 0, opacity: 0.12, width: '280px' }}
                viewBox="0 0 200 200"
                fill="none"
            >
                {[0,60,120,180,240,300].map((angle) => (
                    <ellipse
                        key={angle}
                        cx="100" cy="60" rx="18" ry="40"
                        fill="var(--gold)"
                        transform={`rotate(${angle} 100 100)`}
                    />
                ))}
                <circle cx="100" cy="100" r="14" fill="var(--gold)" />
            </svg>

            {/* Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px', height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Label */}
            <div style={{ textAlign: 'center', marginBottom: '64px', position: 'relative', zIndex: 2 }}>
                <div className="section-label" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
                    Témoignages
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(32px, 4vw, 52px)',
                    fontWeight: 300,
                    color: 'var(--white)',
                    lineHeight: 1.2,
                }}>
                    Ils ont trouvé
                    <em style={{ fontStyle: 'italic', color: 'var(--gold)', display: 'block' }}>
                        leur histoire
                    </em>
                </h2>
            </div>

            {/* Card */}
            <div style={{
                maxWidth: '760px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
            }}>
                {/* Quote */}
                <div
                    ref={quoteRef}
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(20px, 2.5vw, 28px)',
                        fontWeight: 300,
                        fontStyle: 'italic',
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 1.7,
                        marginBottom: '48px',
                        position: 'relative',
                    }}
                >
                    {/* Opening quote */}
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '80px',
                        color: 'var(--gold)',
                        opacity: 0.3,
                        position: 'absolute',
                        top: '-24px',
                        left: '-20px',
                        lineHeight: 1,
                    }}>
            "
          </span>
                    "{t.quote}"
                </div>

                {/* Author */}
                <div
                    ref={authorRef}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                    }}
                >
                    <img
                        src={t.avatar}
                        alt={t.name}
                        style={{
                            width: '56px', height: '56px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid var(--gold)',
                        }}
                    />
                    <div style={{ textAlign: 'left' }}>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '15px',
                            fontWeight: 500,
                            color: 'var(--white)',
                        }}>
                            {t.name}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 300,
                            color: 'rgba(255,255,255,0.55)',
                            letterSpacing: '0.05em',
                            marginTop: '2px',
                        }}>
                            {t.role} · {t.university}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    marginTop: '48px',
                }}>
                    {/* Prev */}
                    <button
                        onClick={() => go(-1)}
                        style={{
                            width: '44px', height: '44px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.25s',
                            backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* Dots */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {TESTIMONIALS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { if (!animating) { setAnimating(false); setCurrent(i); } }}
                                style={{
                                    width: i === current ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: i === current ? 'var(--gold)' : 'rgba(255,255,255,0.25)',
                                    border: 'none',
                                    transition: 'all 0.35s var(--transition-smooth)',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </div>

                    {/* Next */}
                    <button
                        onClick={() => go(1)}
                        style={{
                            width: '44px', height: '44px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.25s',
                            backdropFilter: 'blur(8px)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          #témoignages { padding: 80px 24px !important; }
        }
      `}</style>
        </section>
    );
}