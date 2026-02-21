import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 28s-14-9-14-17.5A7.5 7.5 0 0 1 16 5a7.5 7.5 0 0 1 14 5.5C30 19 16 28 16 28z"
                      stroke="var(--accent)" strokeWidth="1.5" fill="rgba(219,39,119,0.08)" />
                <circle cx="16" cy="12" r="2.5" fill="var(--gold)" />
            </svg>
        ),
        title: 'Matching Intelligent',
        desc: `Notre algorithme analyse tes centres d'intérêt, ta filière et tes valeurs pour te connecter avec les personnes les plus compatibles de ton campus`,
    },
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="8" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(219,39,119,0.06)" />
                <path d="M10 16h12M16 10v12" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        title: 'Campus Exclusif',
        desc: 'Seuls les étudiants de ton université ont accès à la plateforme. Vérifié par email académique. Un espace sûr, réservé à ta communauté.',
    },
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(219,39,119,0.06)" />
                <path d="M10 16l4 4 8-8" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'Profils Vérifiés',
        desc: "Chaque profil est authentifié. Pas de faux comptes, pas d'arnaque. Juste de vraies personnes qui cherchent de vraies connexions comme toi.",
    },
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 20l2-6 6 4 6-4 2 6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(219,39,119,0.06)" />
                <rect x="4" y="6" width="24" height="16" rx="4" stroke="var(--accent)" strokeWidth="1.5" fill="none" />
            </svg>
        ),
        title: 'Messagerie Privée',
        desc: 'Une fois le match établi, échangez en toute confidentialité. Messages, réactions, et bientôt appels vocaux — tout pour briser la glace facilement.',
    },
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <polygon points="16,4 20,12 28,13 22,19 24,28 16,23 8,28 10,19 4,13 12,12"
                         stroke="var(--accent)" strokeWidth="1.5" fill="rgba(219,39,119,0.06)" strokeLinejoin="round" />
                <polygon points="16,4 20,12 28,13 22,19 24,28 16,23 8,28 10,19 4,13 12,12"
                         fill="rgba(212,175,55,0.15)" />
            </svg>
        ),
        title: 'Événements Campus',
        desc: 'Découvre et rejoins des sorties, soirées et rencontres organisées par et pour les étudiants. Le prétexte parfait pour un premier rendez-vous.',
    },
    {
        icon: (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12 12-5.4 12-12S22.6 4 16 4z"
                      stroke="var(--accent)" strokeWidth="1.5" fill="rgba(219,39,119,0.06)" />
                <path d="M16 10v6l4 4" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        title: 'Sécurité & Respect',
        desc: 'Système de signalement intégré, modération active et règles claires. LoveLine, c\'est un espace bienveillant où chacun est respecté.',
    },
];

export default function Features() {
    const sectionRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.features-headline',
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: '.features-headline', start: 'top 85%' },
                }
            );

            cardsRef.current.forEach((card, i) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 48, scale: 0.97 },
                    {
                        opacity: 1, y: 0, scale: 1,
                        duration: 0.8,
                        delay: (i % 3) * 0.12,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: card, start: 'top 88%' },
                    }
                );
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="fonctionnalités"
            style={{ padding: '128px 48px', background: 'var(--bg)' }}
        >
            {/* Header */}
            <div className="features-headline" style={{ textAlign: 'center', marginBottom: '80px' }}>
                <div className="section-label" style={{ justifyContent: 'center' }}>
                    Nos services
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(36px, 5vw, 64px)',
                    fontWeight: 300,
                    color: 'var(--text)',
                    lineHeight: 1.15,
                    maxWidth: '560px',
                    margin: '0 auto 20px',
                }}>
                    Tout ce dont tu as besoin<br />
                    <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>pour aimer.</em>
                </h2>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    fontWeight: 300,
                    color: 'var(--text)',
                    opacity: 0.6,
                    maxWidth: '420px',
                    margin: '0 auto',
                    lineHeight: 1.8,
                }}>
                    LoveLine n'est pas une simple app de rencontres. C'est une expérience conçue pour les étudiants d'Afrique de l'Ouest.
                </p>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '1100px',
                margin: '0 auto',
            }}>
                {FEATURES.map((f, i) => (
                    <div
                        key={f.title}
                        ref={(el) => (cardsRef.current[i] = el)}
                        style={{
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.75)',
                            borderRadius: '24px',
                            padding: '40px 36px',
                            boxShadow: '0 8px 40px rgba(157,23,77,0.06)',
                            transition: 'transform 0.4s var(--transition-spring), box-shadow 0.4s, border-color 0.3s',
                            cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 24px 64px rgba(157,23,77,0.14)';
                            e.currentTarget.style.borderColor = 'rgba(219,39,119,0.25)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 40px rgba(157,23,77,0.06)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.75)';
                        }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: '60px', height: '60px',
                            borderRadius: '16px',
                            background: 'rgba(252,231,243,0.8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '24px',
                        }}>
                            {f.icon}
                        </div>

                        <h3 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '22px',
                            fontWeight: 500,
                            color: 'var(--text)',
                            marginBottom: '12px',
                            lineHeight: 1.3,
                        }}>
                            {f.title}
                        </h3>

                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            fontWeight: 300,
                            color: 'var(--text)',
                            opacity: 0.65,
                            lineHeight: 1.75,
                        }}>
                            {f.desc}
                        </p>

                        <div style={{
                            marginTop: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--accent)',
                            opacity: 0.8,
                            cursor: 'pointer',
                            transition: 'opacity 0.2s, gap 0.3s',
                        }}
                             onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.gap = '10px'; }}
                             onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.gap = '6px'; }}
                        >
                            En savoir plus
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @media (max-width: 768px) {
          #fonctionnalités { padding: 80px 24px !important; }
        }
      `}</style>
        </section>
    );
}