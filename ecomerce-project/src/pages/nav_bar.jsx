import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function Navbar() {
    const navRef = useRef(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // Entrance animation
        gsap.fromTo(
            navRef.current,
            { y: -80, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
        );

        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const links = ['Découvrir', 'Fonctionnalités', 'Témoignages', 'Tarifs'];

    return (
        <>
            <nav
                ref={navRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    padding: scrolled ? '12px 48px' : '20px 48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: scrolled
                        ? 'rgba(255,240,245,0.72)'
                        : 'rgba(255,240,245,0.15)',
                    backdropFilter: scrolled ? 'blur(24px)' : 'blur(8px)',
                    WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'blur(8px)',
                    borderBottom: scrolled
                        ? '1px solid rgba(255,255,255,0.55)'
                        : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: scrolled
                        ? '0 8px 32px rgba(157,23,77,0.08)'
                        : 'none',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path
                            d="M14 25s-11-7-11-13.5A6.5 6.5 0 0 1 14 7a6.5 6.5 0 0 1 11 4.5C25 18 14 25 14 25z"
                            fill="none"
                            stroke="var(--gold)"
                            strokeWidth="1.2"
                        />
                    </svg>
                    <span
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '22px',
                            fontWeight: 400,
                            letterSpacing: '0.06em',
                            color: 'var(--primary)',
                        }}
                    >
            LoveLine
          </span>
                </div>

                {/* Desktop links */}
                <ul
                    style={{
                        display: 'flex',
                        gap: '40px',
                        listStyle: 'none',
                    }}
                    className="nav-links"
                >
                    {links.map((link) => (
                        <li key={link}>
                            <a
                                href={`#${link.toLowerCase()}`}
                                style={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--text)',
                                    opacity: 0.75,
                                    transition: 'opacity 0.25s, color 0.25s',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                    e.currentTarget.style.color = 'var(--accent)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '0.75';
                                    e.currentTarget.style.color = 'var(--text)';
                                }}
                            >
                                {link}
                            </a>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <a
                    href="ecomerce-project/src/pages/nav_bar.jsx#signup"
                    style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--white)',
                        background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                        padding: '12px 28px',
                        borderRadius: '40px',
                        boxShadow: 'var(--shadow-btn)',
                        transition: 'transform 0.25s var(--transition-spring), box-shadow 0.25s',
                        display: 'none',
                    }}
                    className="nav-cta"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
                        e.currentTarget.style.boxShadow =
                            '0 12px 32px rgba(219,39,119,0.45)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-btn)';
                    }}
                >
                    Rejoindre
                </a>

                {/* Hamburger */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="hamburger"
                    style={{
                        display: 'none',
                        flexDirection: 'column',
                        gap: '5px',
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            style={{
                                display: 'block',
                                width: '24px',
                                height: '1.5px',
                                background: 'var(--primary)',
                                transition: 'all 0.3s',
                                transform:
                                    menuOpen && i === 0
                                        ? 'translateY(6.5px) rotate(45deg)'
                                        : menuOpen && i === 2
                                            ? 'translateY(-6.5px) rotate(-45deg)'
                                            : menuOpen && i === 1
                                                ? 'scaleX(0)'
                                                : 'none',
                            }}
                        />
                    ))}
                </button>
            </nav>

            {/* Mobile menu */}
            {menuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: '72px',
                        left: '16px',
                        right: '16px',
                        zIndex: 999,
                        background: 'rgba(255,240,245,0.95)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.7)',
                        padding: '24px',
                        boxShadow: '0 24px 64px rgba(157,23,77,0.15)',
                    }}
                >
                    {links.map((link) => (
                        <a
                            key={link}
                            href={`#${link.toLowerCase()}`}
                            onClick={() => setMenuOpen(false)}
                            style={{
                                display: 'block',
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                fontWeight: 500,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--text)',
                                padding: '16px 0',
                                borderBottom: '1px solid rgba(157,23,77,0.1)',
                            }}
                        >
                            {link}
                        </a>
                    ))}
                    <a
                        href="ecomerce-project/src/pages/nav_bar.jsx#signup"
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            marginTop: '20px',
                            padding: '14px',
                            borderRadius: '40px',
                            background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                            color: 'var(--white)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Rejoindre
                    </a>
                </div>
            )}

            <style>{`
        @media (min-width: 768px) {
          .nav-cta { display: inline-block !important; }
        }
        @media (max-width: 767px) {
          .nav-links { display: none !important; }
          .hamburger { display: flex !important; }
          nav { padding: 16px 24px !important; }
        }
      `}</style>
        </>
    );
}