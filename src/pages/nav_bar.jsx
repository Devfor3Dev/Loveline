import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

const links = ['Découvrir', 'A propos', 'Contact', 'Tarifs'];

export default function Navbar() {
    const navRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        gsap.fromTo(navRef.current,
            { y: -80, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.4 }
        );
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            {/* CSS pour le trait gold — simple, fiable, garanti */}
            <style>{`
        .nav-link {
          position: relative;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text);
          opacity: 0.75;
          padding-bottom: 4px;
          display: inline-block;
          text-decoration: none;
          transition: color 0.25s ease, opacity 0.25s ease;
        }

        /* Le trait gold — caché par défaut */
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1.5px;
          background: linear-gradient(90deg, var(--gold), rgba(212,175,55,0.35));
          border-radius: 1px;

          /* La magie : scale de 0 à 1, depuis la gauche */
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hover : le trait glisse de gauche à droite */
        .nav-link:hover::after {
          transform: scaleX(1);
        }

        .nav-link:hover {
          color: var(--accent);
          opacity: 1;
        }

        /* CTA */
        .nav-cta {
          display: none;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--white);
          background: linear-gradient(135deg, var(--accent), var(--primary));
          padding: 12px 28px;
          border-radius: 40px;
          box-shadow: var(--shadow-btn);
          text-decoration: none;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
        }
        .nav-cta:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 16px 36px rgba(219,39,119,0.45);
        }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
        }

        @media (min-width: 768px) {
          .nav-cta { display: inline-block !important; }
        }
        @media (max-width: 767px) {
          .nav-links-list { display: none !important; }
          .hamburger { display: flex !important; }
          .main-nav { padding: 16px 24px !important; }
        }
      `}</style>

            <nav
                ref={navRef}
                className="main-nav"
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0,
                    zIndex: 1000,
                    padding: scrolled ? '12px 48px' : '20px 48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: scrolled
                        ? 'rgba(255,240,245,0.78)'
                        : 'rgba(255,240,245,0.12)',
                    backdropFilter: scrolled ? 'blur(28px)' : 'blur(8px)',
                    WebkitBackdropFilter: scrolled ? 'blur(28px)' : 'blur(8px)',
                    borderBottom: scrolled
                        ? '1px solid rgba(255,255,255,0.6)'
                        : '1px solid rgba(255,255,255,0.15)',
                    boxShadow: scrolled ? '0 8px 32px rgba(157,23,77,0.08)' : 'none',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                     onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M14 25s-11-7-11-13.5A6.5 6.5 0 0 1 14 7a6.5 6.5 0 0 1 11 4.5C25 18 14 25 14 25z"
                            fill="none" stroke="var(--gold)" strokeWidth="1.3"
                        />
                    </svg>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '22px', fontWeight: 400,
                        letterSpacing: '0.06em', color: 'var(--primary)',
                    }}>
            LoveLine
          </span>
                </div>

                {/* Desktop links */}
                <ul
                    className="nav-links-list"
                    style={{ display: 'flex', gap: '40px', margin: 0, padding: 0, listStyle: 'none' }}
                >
                    {links.map((link) => (
                        <li key={link}>
                            <a href={`#${link.toLowerCase()}`} className="nav-link">
                                {link}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                <a href="https://loveline-love.vercel.app/auth" className="nav-cta">
                    Rejoindre
                </a>

                {/* Hamburger */}
                <button
                    className="hamburger"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                display: 'block',
                                width: '24px', height: '1.5px',
                                background: 'var(--primary)',
                                borderRadius: '1px',
                                transition: 'all 0.28s ease',
                                transform:
                                    menuOpen && i === 0 ? 'translateY(6.5px) rotate(45deg)'
                                        : menuOpen && i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
                                            : 'none',
                                opacity: menuOpen && i === 1 ? 0 : 1,
                                scaleX: menuOpen && i === 1 ? 0 : 1,
                            }}
                        />
                    ))}
                </button>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: 'fixed', top: '72px',
                            left: '16px', right: '16px',
                            zIndex: 999,
                            background: 'rgba(255,240,245,0.96)',
                            backdropFilter: 'blur(28px)',
                            WebkitBackdropFilter: 'blur(28px)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.75)',
                            padding: '24px',
                            boxShadow: '0 24px 64px rgba(157,23,77,0.15)',
                        }}
                    >
                        {links.map((link, i) => (
                            <motion.a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                onClick={() => setMenuOpen(false)}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                style={{
                                    display: 'block',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '14px', fontWeight: 500,
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: 'var(--text)', textDecoration: 'none',
                                    padding: '16px 0',
                                    borderBottom: '1px solid rgba(157,23,77,0.08)',
                                }}
                            >
                                {link}
                            </motion.a>
                        ))}
                        <motion.a
                            href="#signup"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                display: 'block', textAlign: 'center',
                                marginTop: '20px', padding: '14px',
                                borderRadius: '40px',
                                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                                color: 'var(--white)', textDecoration: 'none',
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px', fontWeight: 600,
                                letterSpacing: '0.14em', textTransform: 'uppercase',
                            }}
                        >
                            Rejoindre
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}