import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// COULEURS STRICTES
const C = {
    primary: "#9d174d", // Deep Pink
    accent: "#db2777",  // Vibrant Pink
    text: "#500724",    // Deep Wine
    secondary: "#fce7f3", // Light Pink
    white: "#ffffff",
    gold: "#d4af37",    // Luxury Gold
};

// IMAGES LOCALES
const IMG = {
    main: "https://images.unsplash.com/photo-1529636444744-4b0f7a0ace9e?q=80&w=800", // Couple/Emotion
    detail: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600" // Mains/Connexion
};

const Hero = () => {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        let ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // 1. Révélation Typographique (Masque fluide)
            tl.from(".word-mask span", {
                y: "110%",
                rotation: 3,
                duration: 1.8,
                stagger: 0.15,
                ease: "expo.out"
            })
                // 2. Apparition du contenu secondaire
                .from(".fade-in", {
                    opacity: 0,
                    y: 30,
                    duration: 1,
                    stagger: 0.2
                }, "-=1")
                // 3. Révélation de la sculpture visuelle (L'Arche)
                .from(".art-sculpture", {
                    scale: 0.8,
                    opacity: 0,
                    borderRadius: "100%",
                    duration: 2,
                    ease: "elastic.out(1, 0.75)"
                }, "-=1.5");

            // Parallaxe au scroll (Desktop uniquement pour la performance)
            ScrollTrigger.matchMedia({
                "(min-width: 1024px)": function() {
                    gsap.to(".parallax-art", {
                        y: -80,
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: "top top",
                            scrub: 1.2
                        }
                    });
                }
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="hero-section">
            {/* Fond subtil */}
            <div className="bg-gradient" />

            <div className="content-container">

                {/* --- BLOC TYPOGRAPHIQUE --- */}
                <div className="typography-block">
                    <h1 ref={titleRef} className="headline">
                        <div className="word-mask"><span>Trouve ta</span></div>
                        <div className="word-mask"><span className="italic">moitié</span></div>
                        <div className="word-mask"><span>sur le campus.</span></div>
                    </h1>

                    <p className="description fade-in">
                        Une connexion authentique commence ici. Loin des swipes,
                        proche de la réalité. Ton histoire t'attend.
                    </p>

                    <motion.div className="cta-wrapper fade-in" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <button className="cta-button">
                            COMMENCER L'HISTOIRE
                            <div className="btn-glow" />
                        </button>
                    </motion.div>
                </div>

                {/* --- SCULPTURE VISUELLE --- */}
                <div className="art-block parallax-art">
                    <div className="art-sculpture">
                        <img src={IMG.main} alt="Connexion authentique" className="art-img" />
                        <div className="img-overlay" />
                    </div>

                    {/* Éléments Desktop uniquement */}
                    <div className="desktop-elements">
                        <div className="secondary-art fade-in">
                            <img src={IMG.detail} alt="Détail" className="art-img" />
                        </div>

                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="gold-badge fade-in"
                        >
                            <svg viewBox="0 0 100 100">
                                <path id="txtPath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none"/>
                                <text fill={C.gold} fontSize="9.5" fontWeight="600" letterSpacing="2.5">
                                    <textPath href="#txtPath">• LOVELINE • AUTHENTIC • CAMPUS •</textPath>
                                </text>
                            </svg>
                        </motion.div>
                    </div>
                </div>

            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap');

        /* --- STYLES DE BASE (MOBILE FIRST) --- */
        .hero-section {
          position: relative;
          min-height: 100vh;
          background-color: ${C.white};
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 100px 24px 60px;
        }

        .bg-gradient {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 50% 10%, ${C.secondary} 0%, transparent 60%),
                      radial-gradient(circle at 90% 90%, ${C.secondary}33 0%, transparent 50%);
        }

        .content-container {
          display: flex;
          flex-direction: column; /* Empilement vertical sur mobile */
          align-items: center;
          text-align: center;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          gap: 60px;
          z-index: 10;
        }

        /* TYPOGRAPHIE */
        .typography-block { display: flex; flex-direction: column; align-items: center; }

        .headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 9vw, 120px);
          line-height: 0.9;
          color: ${C.text};
          font-weight: 300;
          margin-bottom: 30px;
          letter-spacing: -0.02em;
        }

        .word-mask { overflow: hidden; display: block; }
        .word-mask span { display: block; transform-origin: bottom left; }
        .italic { font-style: italic; color: ${C.primary}; font-weight: 400; }

        .description {
          font-family: 'Montserrat', sans-serif;
          font-size: 16px;
          color: ${C.text};
          opacity: 0.8;
          line-height: 1.7;
          max-width: 450px;
          margin-bottom: 40px;
          font-weight: 400;
        }

        /* BOUTON */
        .cta-button {
          position: relative;
          background: ${C.text};
          color: ${C.white};
          border: none;
          padding: 20px 40px;
          font-family: 'Montserrat', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 3px;
          cursor: pointer;
          overflow: hidden;
          border-radius: 2px;
        }
        .btn-glow {
            position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: radial-gradient(circle, ${C.primary}44 0%, transparent 60%);
            opacity: 0; transition: opacity 0.4s ease;
        }
        .cta-button:hover .btn-glow { opacity: 1; }

        /* ART VISUEL (MOBILE) */
        .art-block {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .art-sculpture {
          width: 280px;
          height: 360px;
          /* Forme organique élégante pour le mobile */
          border-radius: 140px 140px 40px 40px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 30px 70px ${C.text}1A;
          border: 4px solid ${C.white};
        }

        .art-img { width: 100%; height: 100%; object-fit: cover; }
        .img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, ${C.text}66, transparent 40%); }

        .desktop-elements { display: none; /* Caché sur mobile */ }

        /* --- VERSION DESKTOP (MEDIA QUERY) --- */
        @media (min-width: 1024px) {
          .hero-section { padding: 0 5%; align-items: center; }
          
          .content-container {
            flex-direction: row; /* Disposition horizontale */
            justify-content: space-between;
            align-items: center;
            text-align: left;
            height: 80vh;
          }

          .typography-block { align-items: flex-start; width: 50%; }
          .description { margin-left: 0; font-size: 18px; }

          .art-block {
            width: 45%;
            height: 600px;
            justify-content: flex-end;
            align-items: center;
          }

          .art-sculpture {
            width: 380px;
            height: 550px;
            /* Grande arche majestueuse sur desktop */
            border-radius: 200px 200px 0 0;
            box-shadow: 20px 20px 80px ${C.text}22;
            z-index: 2;
          }

          .desktop-elements { display: block; position: absolute; inset: 0; pointer-events: none; }
          
          .secondary-art {
            position: absolute;
            left: -20px; bottom: 80px;
            width: 200px; height: 260px;
            border-radius: 4px;
            overflow: hidden;
            border: 8px solid ${C.white};
            box-shadow: 0 15px 40px ${C.text}15;
            z-index: 1;
            transform: rotate(-6deg);
          }

          .gold-badge {
            position: absolute;
            top: 12%; right: -50px;
            width: 150px; height: 150px;
            z-index: 3;
          }
        }
      `}</style>
        </section>
    );
};

export default Hero;