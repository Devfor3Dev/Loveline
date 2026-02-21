import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PLANS = [
    {
        name: 'Étincelle',
        nameEn: 'Free',
        price: 0,
        period: 'Gratuit',
        highlight: false,
        color: 'var(--secondary)',
        borderColor: 'rgba(219,39,119,0.15)',
        desc: 'Pour découvrir LoveLine et faire tes premiers pas.',
        features: [
            '5 swipes par jour',
            'Voir les profils de ton campus',
            '1 message par match',
            'Profil de base',
            'Participer aux événements publics',
        ],
        cta: 'Commencer gratuitement',
        ctaStyle: 'outline',
    },
    {
        name: 'Flamme',
        nameEn: 'Premium',
        price: 2500,
        period: 'par mois',
        highlight: true,
        color: 'linear-gradient(135deg, var(--accent), var(--primary))',
        borderColor: 'transparent',
        desc: 'Pour ceux qui prennent les rencontres au sérieux.',
        badge: 'Le plus populaire',
        features: [
            'Swipes illimités',
            'Voir qui t\'a liké',
            'Messages illimités',
            'Profil mis en avant',
            'Filtres avancés (filière, valeurs)',
            'Accès aux événements exclusifs',
            '1 Boost par semaine',
        ],
        cta: 'Commencer maintenant',
        ctaStyle: 'filled-white',
    },
    {
        name: 'Éternité',
        nameEn: 'VIP',
        price: 5000,
        period: 'par mois',
        highlight: false,
        color: 'var(--bg)',
        borderColor: 'rgba(212,175,55,0.4)',
        desc: 'L\'expérience LoveLine la plus complète et exclusive.',
        features: [
            'Tout ce qui est dans Flamme',
            'Badge VIP vérifié sur le profil',
            'Boosts illimités',
            'Accès prioritaire aux nouveaux membres',
            'Messagerie vocale',
            'Consultation matching personnalisée',
            'Invitations aux soirées VIP campus',
        ],
        cta: 'Devenir VIP',
        ctaStyle: 'gold',
    },
];

function Check() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6.5" fill="rgba(219,39,119,0.12)" />
            <path d="M4 7l2 2 4-4" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckWhite() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6.5" fill="rgba(255,255,255,0.2)" />
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckGold() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="6.5" fill="rgba(212,175,55,0.15)" />
            <path d="M4 7l2 2 4-4" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function Pricing() {
    const sectionRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.pricing-header',
                { opacity: 0, y: 32 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: '.pricing-header', start: 'top 85%' },
                }
            );

            cardsRef.current.forEach((card, i) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 56, scale: 0.96 },
                    {
                        opacity: 1, y: 0, scale: 1,
                        duration: 0.9,
                        delay: i * 0.15,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
                    }
                );
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            id="tarifs"
            style={{ padding: '128px 48px', background: 'var(--bg)' }}
        >
            {/* Header */}
            <div className="pricing-header" style={{ textAlign: 'center', marginBottom: '80px' }}>
                <div className="section-label" style={{ justifyContent: 'center' }}>
                    Choisir son plan
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(36px, 5vw, 60px)',
                    fontWeight: 300,
                    color: 'var(--text)',
                    lineHeight: 1.15,
                    maxWidth: '500px',
                    margin: '0 auto 20px',
                }}>
                    L'amour n'a pas de prix,<br />
                    <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>l'accès si.</em>
                </h2>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 300,
                    color: 'var(--text)',
                    opacity: 0.6,
                    maxWidth: '380px',
                    margin: '0 auto',
                    lineHeight: 1.8,
                }}>
                    Des tarifs pensés pour les étudiants d'Afrique de l'Ouest. Payez en Mobile Money, Orange Money ou carte bancaire.
                </p>
            </div>

            {/* Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '1000px',
                margin: '0 auto',
                alignItems: 'start',
            }}>
                {PLANS.map((plan, i) => {
                    const isHighlight = plan.highlight;
                    const isGold = plan.name === 'Éternité';

                    return (
                        <div
                            key={plan.name}
                            ref={(el) => (cardsRef.current[i] = el)}
                            style={{
                                borderRadius: '28px',
                                padding: '40px 36px',
                                background: isHighlight
                                    ? plan.color
                                    : 'rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: isHighlight
                                    ? '1px solid rgba(255,255,255,0.2)'
                                    : `1px solid ${plan.borderColor}`,
                                boxShadow: isHighlight
                                    ? '0 32px 80px rgba(157,23,77,0.35)'
                                    : isGold
                                        ? '0 16px 48px rgba(212,175,55,0.12)'
                                        : '0 8px 40px rgba(157,23,77,0.06)',
                                transform: isHighlight ? 'scale(1.04)' : 'scale(1)',
                                transition: 'transform 0.4s var(--transition-spring), box-shadow 0.4s',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={(e) => {
                                if (!isHighlight) {
                                    e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)';
                                    e.currentTarget.style.boxShadow = isGold
                                        ? '0 32px 64px rgba(212,175,55,0.2)'
                                        : '0 24px 56px rgba(157,23,77,0.12)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isHighlight) {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = isGold
                                        ? '0 16px 48px rgba(212,175,55,0.12)'
                                        : '0 8px 40px rgba(157,23,77,0.06)';
                                }
                            }}
                        >
                            {/* Highlight glow */}
                            {isHighlight && (
                                <div style={{
                                    position: 'absolute', top: '-40px', right: '-40px',
                                    width: '160px', height: '160px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                                    pointerEvents: 'none',
                                }} />
                            )}

                            {/* Badge */}
                            {plan.badge && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '20px',
                                    padding: '4px 14px',
                                    marginBottom: '20px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    color: 'rgba(255,255,255,0.9)',
                                    textTransform: 'uppercase',
                                }}>
                                    ✦ {plan.badge}
                                </div>
                            )}

                            {/* Plan name */}
                            <div style={{ marginBottom: '8px' }}>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '28px',
                    fontWeight: 400,
                    color: isHighlight ? 'white' : isGold ? 'var(--gold)' : 'var(--text)',
                    letterSpacing: '0.02em',
                }}>
                  {plan.name}
                </span>
                                <span style={{
                                    marginLeft: '10px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '11px',
                                    fontWeight: 400,
                                    color: isHighlight ? 'rgba(255,255,255,0.5)' : 'var(--accent)',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                }}>
                  {plan.nameEn}
                </span>
                            </div>

                            <p style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                fontWeight: 300,
                                color: isHighlight ? 'rgba(255,255,255,0.7)' : 'var(--text)',
                                opacity: isHighlight ? 1 : 0.6,
                                lineHeight: 1.7,
                                marginBottom: '28px',
                            }}>
                                {plan.desc}
                            </p>

                            {/* Price */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: plan.price === 0 ? '40px' : '48px',
                                    fontWeight: 300,
                                    color: isHighlight ? 'white' : isGold ? 'var(--gold)' : 'var(--text)',
                                    lineHeight: 1,
                                }}>
                                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString('fr-FR')} F`}
                                </div>
                                {plan.price > 0 && (
                                    <div style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '12px',
                                        fontWeight: 300,
                                        color: isHighlight ? 'rgba(255,255,255,0.55)' : 'var(--text)',
                                        opacity: isHighlight ? 1 : 0.5,
                                        marginTop: '4px',
                                        letterSpacing: '0.05em',
                                    }}>
                                        CFA {plan.period}
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div style={{
                                height: '1px',
                                background: isHighlight
                                    ? 'rgba(255,255,255,0.15)'
                                    : isGold
                                        ? 'rgba(212,175,55,0.2)'
                                        : 'rgba(157,23,77,0.08)',
                                marginBottom: '28px',
                            }} />

                            {/* Features */}
                            <ul style={{ listStyle: 'none', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {plan.features.map((f) => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        {isHighlight ? <CheckWhite /> : isGold ? <CheckGold /> : <Check />}
                                        <span style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '13px',
                                            fontWeight: 300,
                                            lineHeight: 1.5,
                                            color: isHighlight ? 'rgba(255,255,255,0.85)' : 'var(--text)',
                                            opacity: isHighlight ? 1 : 0.75,
                                        }}>
                      {f}
                    </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <a
                                href="ecomerce-project/src/pages/prix.jsx#signup"
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '14px 24px',
                                    borderRadius: '48px',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.3s var(--transition-spring)',
                                    ...(plan.ctaStyle === 'filled-white' ? {
                                        background: 'white',
                                        color: 'var(--primary)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    } : plan.ctaStyle === 'gold' ? {
                                        background: 'linear-gradient(135deg, var(--gold), #b8942e)',
                                        color: 'white',
                                        boxShadow: '0 8px 24px rgba(212,175,55,0.35)',
                                    } : {
                                        background: 'transparent',
                                        color: 'var(--accent)',
                                        border: '1.5px solid rgba(219,39,119,0.3)',
                                    }),
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                }}
                            >
                                {plan.cta} →
                            </a>
                        </div>
                    );
                })}
            </div>

            {/* Footer note */}
            <p style={{
                textAlign: 'center',
                marginTop: '48px',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 300,
                color: 'var(--text)',
                opacity: 0.45,
                letterSpacing: '0.05em',
            }}>
                Paiement accepté via Orange Money · MTN Mobile Money · Wave · Carte bancaire · Sans engagement
            </p>

            <style>{`
        @media (max-width: 768px) {
          #tarifs { padding: 80px 24px !important; }
          #tarifs > div:nth-child(2) > div { transform: none !important; }
        }
      `}</style>
        </section>
    );
}