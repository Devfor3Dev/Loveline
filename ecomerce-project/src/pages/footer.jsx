import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
    const footerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(footerRef.current,
                { opacity: 0, y: 24 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: footerRef.current, start: 'top 95%' },
                }
            );
        }, footerRef);
        return () => ctx.revert();
    }, []);

    return (
        <footer
            ref={footerRef}
            style={{
                background: 'var(--black)',
                padding: '80px 48px 40px',
                color: 'rgba(255,255,255,0.5)',
            }}
        >
            <div style={{
                maxWidth: '1100px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '48px',
                marginBottom: '64px',
            }}>
                {/* Brand */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 21s-9-6-9-13.5A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 9 3.5C21 15 12 21 12 21z"
                                  fill="none" stroke="var(--gold)" strokeWidth="1.2" />
                        </svg>
                        <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '20px',
                            fontWeight: 400,
                            color: 'white',
                            letterSpacing: '0.05em',
                        }}>
              LoveLine
            </span>
                    </div>
                    <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        fontWeight: 300,
                        lineHeight: 1.8,
                        maxWidth: '200px',
                        color: 'rgba(255,255,255,0.45)',
                    }}>
                        Des rencontres authentiques pour les étudiants d'Afrique de l'Ouest.
                    </p>
                    {/* Socials */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        {['Instagram', 'TikTok', 'X'].map((s) => (
                            <a
                                key={s}
                                href="ecomerce-project/src/pages/footer.jsx#"
                                style={{
                                    width: '36px', height: '36px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '0.05em',
                                    transition: 'all 0.25s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--gold)';
                                    e.currentTarget.style.color = 'var(--gold)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                }}
                            >
                                {s[0]}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Links */}
                {[
                    { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Télécharger', 'Sécurité'] },
                    { title: 'Entreprise', links: ['À propos', 'Blog', 'Presse', 'Carrières'] },
                    { title: 'Support', links: ['FAQ', 'Contact', 'Conditions', 'Confidentialité'] },
                ].map((col) => (
                    <div key={col.title}>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.35)',
                            marginBottom: '20px',
                        }}>
                            {col.title}
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {col.links.map((link) => (
                                <li key={link}>
                                    <a
                                        href="ecomerce-project/src/pages/footer.jsx#"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '13px',
                                            fontWeight: 300,
                                            color: 'rgba(255,255,255,0.45)',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Gold line */}
            <div style={{
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
                marginBottom: '32px',
            }} />

            {/* Bottom */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.04em',
                }}>
                    © 2026 LoveLine. Fait avec ♡ Pour les étudiants de l'UK.
                </p>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: 'rgba(212,175,55,0.4)',
                }}>
                    "L'amour commence là où la peur s'arrête."
                </p>
            </div>

            <style>{`
        @media (max-width: 768px) {
          footer { padding: 64px 24px 32px !important; }
        }
      `}</style>
        </footer>
    );
}