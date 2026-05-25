import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { scrapbookConfig as defaultConfig } from "./scrapbook.config.js";
import ScrapbookEditor, { getArrowSvgPaths } from "./ScrapbookEditor.jsx";
import "./editor.css";

// Helper to extract Vimeo video ID from URLs
const getVimeoId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/|vimeo\.com\/channels\/\w+\/)(\d+)/);
  return match ? match[1] : null;
};

// ─────────────────────────────────────────────────────────────────
//  Framer Motion variants
// ─────────────────────────────────────────────────────────────────

const textParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
};

const textRise = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] },
  },
};

const imageReveal = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const cardSlideIn = {
  start: { opacity: 0, y: 180 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.25, 1, 0.5, 1], delay },
  }),
};

// ─────────────────────────────────────────────────────────────────
//  Static data for other pages
// ─────────────────────────────────────────────────────────────────

const pillars = [
  { title: "Fashion",   note: "outfits, styling, GRWM edits",    className: "pillar-fashion" },
  { title: "Beauty",    note: "glam, skincare, soft routines",    className: "pillar-beauty" },
  { title: "Lifestyle", note: "days out, hauls, personal diary",  className: "pillar-lifestyle" },
  { title: "Food",      note: "cafes, cravings, food finds",      className: "pillar-food" },
];

const contentCards = [
  { label: "Reel",  detail: "Styling transition", className: "content-one" },
  { label: "Post",  detail: "Beauty flatlay",     className: "content-two" },
  { label: "Reel",  detail: "Cafe diary",         className: "content-three" },
  { label: "Story", detail: "PR unboxing",        className: "content-four" },
  { label: "Post",  detail: "Lifestyle edit",     className: "content-five" },
];

// ─────────────────────────────────────────────────────────────────
//  Reusable page shell
// ─────────────────────────────────────────────────────────────────

function Page({ children, className = "", label }) {
  return (
    <section className={`diary-page ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

function EditorialText({ children, className = "", as = "div" }) {
  const Component = motion.create(as);
  return (
    <Component
      className={className}
      variants={textParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.55, once: true }}
    >
      {children}
    </Component>
  );
}

function TextLine({ children, className = "", as = "div" }) {
  const Component = motion.create(as);
  return <Component className={className} variants={textRise}>{children}</Component>;
}

function ImageFrame({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={`image-frame ${className}`}
      variants={imageReveal}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.45, once: true }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Scattered elements wrappers with vertical parallax depths
// ─────────────────────────────────────────────────────────────────

function ScrapTextItem({ item, y }) {
  return (
    <motion.div
      className="scrap-text-item"
      style={{
        top: `${item.top}%`,
        left: `${item.left}%`,
        rotate: item.rotate ?? 0,
        fontSize: `${item.size}rem`,
        width: item.width ? `${item.width}px` : "200px",
        maxWidth: "none",
        y,
      }}
    >
      <motion.div
        variants={textRise}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {item.label}
      </motion.div>
    </motion.div>
  );
}

function ScrapEmojiItem({ item, y }) {
  return (
    <motion.div
      className="scrap-emoji-item"
      style={{
        top: `${item.top}%`,
        left: `${item.left}%`,
        rotate: item.rotate ?? 0,
        fontSize: `${item.size}rem`,
        y,
      }}
    >
      <motion.div
        variants={textRise}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {item.emoji}
      </motion.div>
    </motion.div>
  );
}

function ScrapArrowItem({ item, profile, y }) {
  const { path, arrowTip } = item.style
    ? getArrowSvgPaths(item.width, item.height, item.style, item.direction ?? "down-right")
    : { path: item.path, arrowTip: item.arrowTip };

  const strokeColor = profile.borderColor ?? "#c92722";

  return (
    <motion.div
      className="scrap-arrow-item"
      style={{
        position: "absolute",
        top: `${item.top}%`,
        left: `${item.left}%`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        rotate: item.rotate ?? 0,
        y,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${item.width} ${item.height}`}
        overflow="visible"
        style={{ display: "block", overflow: "visible" }}
      >
        <path d={path} stroke={strokeColor} strokeWidth={item.strokeWidth ?? 2.5} fill="none" strokeLinecap="round" />
        <path d={arrowTip} stroke={strokeColor} strokeWidth={item.strokeWidth ?? 2.5} fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  HeroIntro — driven entirely by scrapbookConfig
// ─────────────────────────────────────────────────────────────────

function HeroIntro({ config, scrollContainer }) {
  const {
    title = { label: "about Thanmayee", top: 8, left: 50, rotate: 0, size: 4.5 },
    texts,
    emojis,
    arrows,
    profile = { borderColor: "#c92722", borderSize: 6, gapSize: 4 }
  } = config;

  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    target: targetRef,
    offset: ["start start", "end start"],
  });

  // Apply a smooth spring physics interpolation to the scroll progress to eliminate any jitter or notch-jumps
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  // Create three distinct vertical parallax speeds mapped to the smooth physics progress
  const yFast = useTransform(smoothProgress, [0, 1], [0, -420]);
  const yMedium = useTransform(smoothProgress, [0, 1], [0, -260]);
  const ySlow = useTransform(smoothProgress, [0, 1], [0, -120]);

  return (
    <Page className="hero-page" label="Introduction">

      {/* GPU-accelerated SVG outline filter for the profile photo */}
      <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
        <filter id="solid-red-outline">
          {/* Inner boundary (defines the gap) */}
          <feMorphology
            operator="dilate"
            radius={profile.gapSize ?? 4}
            in="SourceAlpha"
            result="dilatedInner"
          />
          {/* Outer boundary (defines outline thickness) */}
          <feMorphology
            operator="dilate"
            radius={(profile.gapSize ?? 4) + (profile.borderSize ?? 6)}
            in="SourceAlpha"
            result="dilatedOuter"
          />
          {/* Subtract inner from outer to create the outline ribbon with a transparent gap */}
          <feComposite
            in="dilatedOuter"
            in2="dilatedInner"
            operator="out"
            result="borderMask"
          />
          {/* Color the outline */}
          <feFlood
            floodColor={profile.borderColor ?? "#c92722"}
            floodOpacity="1"
            result="flood"
          />
          <feComposite
            in="flood"
            in2="borderMask"
            operator="in"
            result="coloredBorder"
          />
          {/* Merge outline and image */}
          <feMerge>
            <feMergeNode in="coloredBorder" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>

      {/* Wrapper to center and scale the board independently of Framer Motion's internal transform styling */}
      <div ref={targetRef} className="about-board-wrapper">
        {/* Full-page scrapbook board */}
        <motion.div
          className="about-board"
          variants={imageReveal}
          custom={0.08}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.45, once: true }}
        >
          <div className="paper-lines" aria-hidden="true" />

          {/* ── PAGE TITLE ── */}
          <motion.header
            className="about-title"
            style={{
              top: `${title.top}%`,
              left: `${title.left}%`,
              rotate: title.rotate ?? 0,
              x: "-50%",
            }}
            variants={textParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.4, once: true }}
          >
            <motion.h1 variants={textRise} style={{ fontSize: `${title.size}rem` }}>
              about <span className="highlight-yellow">Thanmayee</span>
            </motion.h1>
            <motion.svg viewBox="0 0 100 100" className="ribbon-icon" variants={textRise}>
              <path d="M10,30 Q30,10 70,20 Q60,50 90,70 Q70,90 30,80 Q20,50 10,30 Z" fill="#c92722" />
            </motion.svg>
          </motion.header>

          {/* ── PROFILE PHOTO (centered, static wrapper prevents transform conflict) ── */}
          <div
            className="about-photo-container"
            style={{
              top: `${profile.top ?? 55}%`,
              left: `${profile.left ?? 50}%`,
              width: profile.width ? `${profile.width}px` : undefined,
            }}
          >
            <motion.div
              className="about-photo"
              variants={imageReveal}
              custom={0.2}
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.3, once: true }}
              style={{ y: ySlow }}
            >
              <img src="/TRK.jpg" alt="Thanmayee Reddy" className="cutout-main" />
            </motion.div>
          </div>

          {/* ── TEXTS — each positioned independently from config ── */}
          {texts.map((item) => (
            <ScrapTextItem
              key={item.id}
              item={item}
              y={yMedium}
            />
          ))}

          {/* ── EMOJIS / LOGOS — each positioned independently from config ── */}
          {emojis.map((item) => (
            <ScrapEmojiItem
              key={item.id}
              item={item}
              y={yFast}
            />
          ))}

          {/* ── ARROWS — each positioned independently from config ── */}
          {arrows.map((item) => (
            <ScrapArrowItem
              key={item.id}
              item={item}
              profile={profile}
              y={yFast}
            />
          ))}

          {/* SCROLL CUE */}
          <motion.div
            className="scroll-cue"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
          >
            <span>Scroll down</span>
            <i aria-hidden="true" />
          </motion.div>

        </motion.div>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
//  HowIWork — Page 3: How I Work with Brands
// ─────────────────────────────────────────────────────────────────

function HowIWork({ config, scrollContainer }) {
  const {
    title = { label: "How i work with Brands", subtitle: "• Creative Strategy & Storyboarding", top: 8, left: 50, rotate: 0, size: 4.2 },
    texts = [],
    emojis = [],
    arrows = [],
    profile = { borderColor: "#c92722", borderSize: 6, gapSize: 4 }
  } = config;

  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    target: targetRef,
    offset: ["start end", "end start"],
  });

  // Apply a smooth spring physics interpolation to the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  // Create three distinct vertical parallax speeds mapped to the smooth physics progress
  const yFast = useTransform(smoothProgress, [0, 1], [250, -250]);
  const yMedium = useTransform(smoothProgress, [0, 1], [150, -150]);
  const ySlow = useTransform(smoothProgress, [0, 1], [60, -60]);

  return (
    <Page className="how-i-work-page" label="How I Work with Brands">
      {/* Wrapper to center and scale the board independently */}
      <div ref={targetRef} className="about-board-wrapper">
        <motion.div
          className="about-board"
          variants={imageReveal}
          custom={0.08}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.25, once: true }}
        >
          {/* Light-blue background paper with lines handled via CSS */}
          <div className="paper-lines red-blue-lines" aria-hidden="true" />

          {/* ── PAGE TITLE ── */}
          <motion.header
            className="about-title p3-title"
            style={{
              top: `${title.top}%`,
              left: `${title.left}%`,
              rotate: title.rotate ?? 0,
              x: "-50%",
            }}
            variants={textParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.4, once: true }}
          >
            <motion.h1 variants={textRise} className="p3-title-text" style={{ fontSize: `${title.size}rem` }}>
              {title.label}
            </motion.h1>
            {title.subtitle && (
              <motion.p variants={textRise} className="p3-subtitle-text">
                {title.subtitle}
              </motion.p>
            )}
          </motion.header>

          {/* ── CAMPAIGN CARDS (Central showcases) ── */}
          
          {/* ── DYNAMIC CAMPAIGN CARDS ── */}
          {(config.notes || []).map((note, index) => {
            const isRed = note.type === "red";
            const isMinutiae = note.id === "note-minutiae";
            
            return (
              <motion.div
                key={note.id}
                className={`campaign-card ${isMinutiae ? "booklet-3page-card" : isRed ? "context-card-2page-card" : "ishkaara-card"} ${note.id}`}
                style={{
                  top: `${note.top}%`,
                  left: `${note.left}%`,
                  rotate: note.rotate ?? 0,
                  width: `${note.width * (note.size ?? 1)}px`,
                  fontSize: note.size ? `${note.size}rem` : undefined,
                  y: note.speed === "medium" ? yMedium : ySlow,
                }}
                variants={imageReveal}
                custom={0.15 + index * 0.05}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.2, once: true }}
              >
                {isMinutiae ? (
                  /* ── 3-PAGE OPEN BOOKLET (MINUTIAE VALENTINES) ── */
                  <div className="booklet-3page">
                    {/* Page 1: Cover Page */}
                    <div className="booklet-page cover-page">
                      <div className="binder-rings" />
                      <div className="cover-title">
                        <h1>MINUTIAE</h1>
                        <p className="val-sub">Valentine's Day</p>
                        <span className="cursive-sub">Shoot Concept</span>
                      </div>
                    </div>
                    {/* Page 2: Lined Notebook Page */}
                    <div className="booklet-page lined-paper-page">
                      <div className="notebook-lines" />
                      <p className="booklet-text">{note.text}</p>
                    </div>
                    {/* Page 3: Showcase Media Page */}
                    <div className="booklet-page media-page">
                      <div className="phone-mockups">
                        <div className="phone-screen">
                          <img src="/ishkaara_model.png" alt="UGC Model Review" className="showcase-img" />
                        </div>
                      </div>
                      <div className="products-showcase">
                        <span className="products-label">PRODUCTS</span>
                        <div className="product-thumb">
                          <img src="/minutiae_product.png" alt="Product Jewelry Preview" className="showcase-img" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isRed ? (
                  /* ── 2-PAGE LANDSCAPE CONTEXT CARD (KAY BEAUTY & MEJURI) ── */
                  <div className="context-card-2page">
                    {/* Top tape/sticker accent banner */}
                    <div className="tape-accent">
                      <span>{note.title}</span>
                    </div>
                    <div className="context-main">
                      {/* Left: strategy brief paragraph */}
                      <div className="context-text-section">
                        <p className="context-text">{note.text}</p>
                      </div>
                      {/* Right: small vertical product media showcase */}
                      <div className="context-media-section">
                        <span className="products-label">PRODUCTS</span>
                        <div className="product-thumbs-column">
                          <div className="product-thumb-small">
                            <img src="/minutiae_product.png" alt="Product Gold" className="showcase-img" />
                          </div>
                          <div className="product-thumb-small">
                            <img src="/ishkaara_model.png" alt="Model Custom" className="showcase-img" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── SIMPLE ELEGANT WRITTEN NOTE (ISHKAARA & LANEIGE) ── */
                  <div className="card-main-content">
                    <div className="script-lines-simplified">
                      {note.text}
                    </div>
                  </div>
                )}
                {isRed && !isMinutiae && <div className="serrated-edge"></div>}
              </motion.div>
            );
          })}

          {/* ── TEXTS — each positioned independently from config ── */}
          {texts.map((item) => (
            <ScrapTextItem
              key={item.id}
              item={item}
              y={yMedium}
            />
          ))}

          {/* ── EMOJIS / LOGOS — each positioned independently from config ── */}
          {emojis.map((item) => (
            <ScrapEmojiItem
              key={item.id}
              item={item}
              y={yFast}
            />
          ))}

          {/* ── ARROWS — each positioned independently from config ── */}
          {arrows.map((item) => (
            <ScrapArrowItem
              key={item.id}
              item={item}
              profile={profile}
              y={yFast}
            />
          ))}

        </motion.div>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Other pages (unchanged)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
//  My Creative Toolkit Page
// ─────────────────────────────────────────────────────────────────

function PinterestLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.16-.1-.95-.2-2.4.04-3.43.22-.94 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.66.96-2.9 2.18-2.9 1.03 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.02-.28 1.2.6 2.17 1.78 2.17 2.14 0 3.78-2.25 3.78-5.5 0-2.88-2.07-4.9-5.03-4.9-3.43 0-5.44 2.57-5.44 5.23 0 1.04.4 2.15.9 2.75.1.12.1.22.08.33-.1.38-.3.1.38-.3-.1-.04-.12-.13-.15-.17-.46-.53-.7-1.23-.7-2.12 0-3.45 2.5-6.62 7.23-6.62 3.8 0 6.75 2.7 6.75 6.32 0 3.77-2.38 6.8-5.67 6.8-1.1 0-2.15-.58-2.5-1.25l-.68 2.6c-.25.96-.92 2.16-1.37 2.9C9.07 23.77 10.5 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/>
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
    </svg>
  );
}

function DaVinciResolveLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M17.621 0 5.977.004c-1.37 0-2.756.345-3.762 1.11a4.925 4.925 0 0 0-1.61 2.003C.233 3.93 0 5.02 0 5.951l.012 12.2c.002 1.604.479 3.057 1.461 4.112.984 1.056 2.462 1.683 4.331 1.691L16.856 24c1.26.005 3.095-.036 4.303-.714 1.075-.605 2.025-1.556 2.497-2.984.278-.84.345-2.084.344-3.147l-.021-11.13c-.002-.888-.15-2.023-.547-2.934-.425-.976-1.181-1.815-2.322-2.425C20.353.26 19.123 0 17.622 0zm0 .93c1.378 0 2.538.295 3.04.565.977.523 1.544 1.166 1.889 1.96.315.721.47 1.793.473 2.572l.018 11.13c.002 1.013-.097 2.257-.298 2.86-.396 1.202-1.146 1.946-2.063 2.462-.814.457-2.612.593-3.82.588l-11.05-.044c-1.657-.007-2.832-.534-3.626-1.386-.792-.851-1.212-2.06-1.212-3.485L.999 5.95c0-.829.196-1.827.474-2.437.345-.757.75-1.207 1.365-1.674C3.585 1.27 4.868.97 6.08.97zm-5.66 3.423c-1.976.089-3.204 1.658-3.214 3.29.019 1.443 1.635 3.481 2.884 4.53.12.099.154.109.33.18.062.025.198-.047.327-.135.36-.245.993-.947 1.648-1.738a7.67 7.67 0 0 0 1.031-1.683c.409-.89.261-1.599.235-1.888a3.983 3.983 0 0 0-.99-1.692 3.36 3.36 0 0 0-2.251-.864zm4.172 7.922a10.185 10.185 0 0 0-3.244.61c-.15.058-.26.1-.374.17-.057.036-.11.135-.105.292.017.433.29 1.278.624 2.27.384 1.135 1.066 2.27 1.844 2.74a3.23 3.23 0 0 0 2.53.342c.832-.243 1.595-.868 1.962-1.546.986-1.818.19-3.548-1.121-4.417-.447-.296-1.133-.445-1.89-.46-.074 0-.15-.002-.226-.001zm-8.432.038a6.201 6.201 0 0 0-.752.047c-.596.078-.932.273-1.29.51a3.177 3.177 0 0 0-1.365 1.979c-.075.552-.086 1.053.033 1.507.433 1.389 1.326 2.222 2.847 2.452.636.028 1.37-.063 1.99-.45 1.269-.782 2.08-3.17 2.412-4.742.053-.176.035-.357-.013-.42-.005-.067-.044-.113-.19-.183-.398-.192-1.32-.417-2.375-.6a7.68 7.68 0 0 0-1.297-.1z"/>
    </svg>
  );
}

function CanvaLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.962 7.68c.754 0 1.337.549 1.405 1.2.069.583-.171 1.097-.822 1.406-.343.171-.48.172-.549.069-.034-.069 0-.137.069-.206.617-.514.617-.926.548-1.508-.034-.378-.308-.618-.583-.618-1.2 0-2.914 2.674-2.674 4.629.103.754.549 1.646 1.509 1.646.308 0 .65-.103.96-.24.5-.264.799-.47 1.097-.8-.073-.885.704-2.046 1.851-2.046.515 0 .926.205.96.583.068.514-.377.582-.514.582s-.378-.034-.378-.17c-.034-.138.309-.07.275-.378-.035-.206-.24-.274-.446-.274-.72 0-1.131.994-1.029 1.611.035.275.172.549.447.549.205 0 .514-.31.617-.755.068-.308.343-.514.583-.514.102 0 .17.034.205.171v.138c-.034.137-.137.548-.102.651 0 .069.034.171.17.171.092 0 .436-.18.777-.459.117-.59.253-1.298.253-1.357.034-.24.137-.48.617-.48.103 0 .171.034.205.171v.138l-.136.617c.445-.583 1.097-.994 1.508-.994.172 0 .309.102.309.274 0 .103 0 .274-.069.446-.137.377-.309.96-.412 1.474 0 .137.035.274.207.274.171 0 .685-.206 1.096-.754l.007-.004c-.002-.068-.007-.134-.007-.202 0-.411.035-.754.104-.994.068-.274.411-.514.617-.514.103 0 .205.069.205.171 0 .035 0 .103-.034.137-.137.446-.24.857-.24 1.269 0 .24.034.582.102.788 0 .034.035.069.07.069.068 0 .548-.445.89-1.028-.308-.206-.48-.549-.48-.96 0-.72.446-1.097.858-1.097.343 0 .617.24.617.72 0 .308-.103.65-.274.96h.102a.77.77 0 0 0 .584-.24.293.293 0 0 1 .134-.117c.335-.425.83-.74 1.41-.74.48 0 .924.205.959.582.068.515-.378.618-.515.618l-.002-.002c-.138 0-.377-.035-.377-.172 0-.137.309-.068.274-.376-.034-.206-.24-.275-.446-.275-.686 0-1.13.891-1.028 1.611.034.275.171.583.445.583.206 0 .515-.308.652-.754.068-.274.343-.514.583-.514.103 0 .17.034.205.171 0 .069 0 .206-.137.652-.17.308-.171.48-.137.617.034.274.171.48.309.583.034.034.068.102.068.102 0 .069-.034.138-.137.138-.034 0-.068 0-.103-.035-.514-.205-.72-.548-.789-.891-.205.24-.445.377-.72.377-.445 0-.89-.411-.96-.926a1.609 1.609 0 0 1 .075-.649c-.203.13-.422.203-.623.203h-.17c-.447.652-.927 1.098-1.27 1.303a.896.896 0 0 1-.377.104c-.068 0-.171-.035-.205-.104-.095-.152-.156-.392-.193-.667-.481.527-1.145.805-1.453.805-.343 0-.548-.206-.582-.55v-.376c.102-.754.377-1.2.377-1.337a.074.074 0 0 0-.069-.07c-.24 0-1.028.824-1.166 1.373l-.103.445c-.068.309-.377.515-.582.515-.103 0-.172-.035-.206-.172v-.137l.046-.233c-.435.31-.87.508-1.075.508-.308 0-.48-.172-.514-.412-.206.274-.445.412-.754.412-.352 0-.696-.24-.862-.593-.244.275-.523.553-.852.764-.48.309-1.028.549-1.68.549-.582 0-1.097-.309-1.371-.583-.412-.377-.651-.96-.686-1.509-.205-1.68.823-3.84 2.4-4.8.378-.205.755-.343 1.132-.343zm9.77 3.291c-.104 0-.172.172-.172.343 0 .274.137.583.309.755a1.74 1.74 0 0 0 .102-.583c0-.343-.137-.515-.24-.515z" />
    </svg>
  );
}

function PhotoshopLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M9.85 8.42c-.37-.15-.77-.21-1.18-.2-.26 0-.49 0-.68.01-.2-.01-.34 0-.41.01v3.36c.14.01.27.02.39.02h.53c.39 0 .78-.06 1.15-.18.32-.09.6-.28.82-.53.21-.25.31-.59.31-1.03.01-.31-.07-.62-.23-.89-.17-.26-.41-.46-.7-.57zM19.75.3H4.25C1.9.3 0 2.2 0 4.55v14.899c0 2.35 1.9 4.25 4.25 4.25h15.5c2.35 0 4.25-1.9 4.25-4.25V4.55C24 2.2 22.1.3 19.75.3zm-7.391 11.65c-.399.56-.959.98-1.609 1.22-.68.25-1.43.34-2.25.34-.24 0-.4 0-.5-.01s-.24-.01-.43-.01v3.209c.01.07-.04.131-.11.141H5.52c-.08 0-.12-.041-.12-.131V6.42c0-.07.03-.11.1-.11.17 0 .33 0 .56-.01.24-.01.49-.01.76-.02s.56-.01.87-.02c.31-.01.61-.01.91-.01.82 0 1.5.1 2.06.31.5.17.96.45 1.34.82.32.32.57.71.73 1.14.149.42.229.85.229 1.3.001.86-.199 1.57-.6 2.13zm7.091 3.89c-.28.4-.671.709-1.12.891-.49.209-1.09.318-1.811.318-.459 0-.91-.039-1.359-.129-.35-.061-.7-.17-1.02-.32-.07-.039-.121-.109-.111-.189v-1.74c0-.029.011-.07.041-.09.029-.02.06-.01.09.01.39.23.8.391 1.24.49.379.1.779.15 1.18.15.38 0 .65-.051.83-.141.16-.07.27-.24.27-.42 0-.141-.08-.27-.24-.4-.16-.129-.489-.279-.979-.471-.51-.18-.979-.42-1.42-.719-.31-.221-.569-.51-.761-.85-.159-.32-.239-.67-.229-1.021 0-.43.12-.84.341-1.21.25-.4.619-.72 1.049-.92.469-.239 1.059-.349 1.769-.349.41 0 .83.03 1.24.09.3.04.59.12.86.23.039.01.08.05.1.09.01.04.02.08.02.12v1.63c0 .04-.02.08-.05.1-.09.02-.14.02-.18 0-.3-.16-.62-.27-.96-.34-.37-.08-.74-.13-1.12-.13-.2-.01-.41.02-.601.07-.129.03-.24.1-.31.2-.05.08-.08.18-.08.27s.04.18.101.26c.09.11.209.2.34.27.229.12.47.23.709.33.541.18 1.061.43 1.541.73.33.209.6.49.789.83.16.318.24.67.23 1.029.011.471-.129.94-.389 1.331z" />
    </svg>
  );
}

function CapCutLogo() {
  return (
    <svg viewBox="0 0 512 509.659" width="100%" height="100%">
      <path fill="#fff" d="M109.095 181.505c-.123 8.897 0 17.813 0 26.71a5.41 5.41 0 003.225 4.917 23898.407 23898.407 0 0084.108 41.646c-27.832 13.672-55.563 27.526-83.353 41.259a5.938 5.938 0 00-4.081 4.876v26.771c1.854 18.195 15.823 32.817 33.913 35.503 3.509.326 7.02.266 10.529.266l155.85.001a45.08 45.08 0 0011.224-.92 40.825 40.825 0 0026.137-20.015 63.699 63.699 0 004.288-11.226c15.997 8.325 32.341 16.079 48.462 24.179.385.291.857.447 1.343.447a2.266 2.266 0 002.265-2.265v-.016-27.669a4.695 4.695 0 00-3.143-4.079l-135.323-67.112c45.203-22.431 90.412-44.876 135.63-67.335a4.573 4.573 0 002.754-4.082v-27.628a2.183 2.183 0 00-3.142-1.673l-49.135 24.363a42.189 42.189 0 00-6.388-14.917 40.613 40.613 0 00-30.097-17.422l-167.133-.001c-19.615.91-35.688 15.918-37.933 35.424v-.002z" />
      <path fill="#fff" d="M140.049 181.689a10.082 10.082 0 019.345-5.55h161.545l.106-.001c5.066 0 9.368 3.72 10.096 8.734.205 2.714.102 5.428 0 8.162l-90.597 44.891c-30.608-15.018-61.03-30.22-91.535-45.339.142-3.632-.633-7.53 1.04-10.897zM139.009 317.095a24846.007 24846.007 0 0191.351-45.319c30.322 14.773 60.521 29.954 90.802 44.89-.204 3.918.755 8.162-1.305 11.773a10.085 10.085 0 01-8.755 5.08h-.082l-161.605.002-.277.002a10.202 10.202 0 01-9.007-5.411c-1.796-3.386-.98-7.345-1.122-11.017z" />
    </svg>
  );
}

function InShotLogo() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="#FF4C60" />
      <path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 7.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#fff" />
      <rect x="6.8" y="6.8" width="1.8" height="1.8" rx="0.4" fill="#fff" />
      <rect x="15.4" y="6.8" width="1.8" height="1.8" rx="0.4" fill="#fff" />
      <rect x="6.8" y="15.4" width="1.8" height="1.8" rx="0.4" fill="#fff" />
      <rect x="15.4" y="15.4" width="1.8" height="1.8" rx="0.4" fill="#fff" />
    </svg>
  );
}

function ToolIcon({ type }) {
  switch (type) {
    case "pinterest":
      return <PinterestLogo />;
    case "instagram":
      return <InstagramLogo />;
    case "davinciresolve":
      return <DaVinciResolveLogo />;
    case "canva":
      return <CanvaLogo />;
    case "photoshop":
      return <PhotoshopLogo />;
    case "capcut":
      return <CapCutLogo />;
    case "inshot":
      return <InShotLogo />;
    default:
      return null;
  }
}

const getSkillGradient = () => {
  // A beautiful soft, premium ultra-light blue gradient
  return "linear-gradient(135deg, #f4f9ff, #e3f2fd)";
};

function CreativeToolkit({ config, scrollContainer }) {
  const {
    title = { label: "My Creative Toolkit", top: 8, left: 50, rotate: -1, size: 4.8 },
    emojis = [],
    arrows = [],
    skills = [],
    tools = []
  } = config;

  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    target: targetRef,
    offset: ["start end", "end start"],
  });

  // Apply smooth spring physics interpolation to eliminate scroll jitter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  // Create vertical parallax depths mapped to the physics progress
  const yFast = useTransform(smoothProgress, [0, 1], [250, -250]);
  const yMedium = useTransform(smoothProgress, [0, 1], [150, -150]);
  const ySlow = useTransform(smoothProgress, [0, 1], [60, -60]);

  return (
    <Page className="creative-toolkit-page" label="Creative Toolkit">
      <div ref={targetRef} className="about-board-wrapper">
        <motion.div
          className="about-board"
          variants={imageReveal}
          custom={0.08}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.25, once: true }}
        >
          {/* Page cream grid background lines */}
          <div className="paper-lines" aria-hidden="true" />

          {/* ── PAGE TITLE ── */}
          <motion.header
            className="about-title toolkit-title"
            style={{
              top: `${title.top}%`,
              left: `${title.left}%`,
              rotate: title.rotate ?? 0,
              x: "-50%",
            }}
            variants={textParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.4, once: true }}
          >
            <motion.h1 variants={textRise} className="toolkit-title-text" style={{ fontSize: `${title.size}rem` }}>
              {title.label}
            </motion.h1>
          </motion.header>

          {/* ── PREMIUM SKILL CARDS ── */}
          <div className="toasts-container">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.id}
                className={`skill-card-wrapper ${skill.id}`}
                style={{
                  position: "absolute",
                  top: `${skill.top}%`,
                  left: `${skill.left}%`,
                  rotate: skill.rotate ?? 0,
                  width: `${skill.width * (skill.size ?? 1)}px`,
                  y: yMedium,
                }}
                variants={imageReveal}
                custom={0.12 + index * 0.04}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.15, once: true }}
              >
                <div className="premium-skill-card">
                  {/* Top section: colored gradient background showing skillset name */}
                  <div 
                    className="skill-card-media"
                    style={{ background: getSkillGradient(index) }}
                  >
                    <div className="skill-card-arrow-badge" aria-hidden="true">↗</div>
                    <span 
                      className="skill-card-name"
                      style={{ 
                        fontSize: `${skill.textSize ?? 1.2}rem`,
                        fontFamily: skill.fontFamily ?? "'Inter', sans-serif"
                      }}
                    >
                      {skill.label}
                    </span>
                  </div>
                  
                  {/* Bottom section: displays 5 stars for rating */}
                  <div className="skill-card-details">
                    <div className="skill-stars-container">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`skill-star-icon ${i < (skill.rating ?? 5) ? "star-filled" : "star-empty"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── FLOATING TOOL BUBBLES ── */}
          <div className="floating-tools-container">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.id}
                className={`tool-bubble-wrapper ${tool.id}`}
                style={{
                  position: "absolute",
                  top: `${tool.top}%`,
                  left: `${tool.left}%`,
                  rotate: tool.rotate ?? 0,
                  width: `${tool.size * 16}px`,
                  height: `${tool.size * 16}px`,
                  y: yFast,
                }}
                variants={imageReveal}
                custom={0.2 + index * 0.03}
                initial="hidden"
                whileInView="visible"
                viewport={{ amount: 0.15, once: true }}
              >
                <div 
                  className="tool-bubble" 
                  style={{ 
                    background: tool.color,
                  }}
                >
                  <ToolIcon type={tool.svgType} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── POSITIONABLE EMOJIS (LIPS) ── */}
          {emojis.map((item) => (
            <ScrapEmojiItem
              key={item.id}
              item={item}
              y={yFast}
            />
          ))}

          {/* ── POSITIONABLE ARROWS ── */}
          {arrows.map((item) => (
            <ScrapArrowItem
              key={item.id}
              item={item}
              profile={{ borderColor: "#c92722" }}
              y={yFast}
            />
          ))}

        </motion.div>
      </div>
    </Page>
  );
}

function MyWork({ config, scrollContainer }) {
  const {
    title = { label: "My Work", top: 11, left: 50, rotate: 0, size: 4.5 },
    highlight = { id: "highlight-mywork", top: 15, left: 42.5, width: 15, height: 10 },
    arrows = [],
    videos = []
  } = config;

  const targetRef = useRef(null);
  const pageRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);

        // Select all vimeo iframes inside the page
        const iframes = pageRef.current?.querySelectorAll('.vimeo-embed');
        if (!iframes) return;

        iframes.forEach((iframe) => {
          try {
            if (inView) {
              iframe.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
            } else {
              iframe.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
            }
          } catch (err) {
            console.error("Vimeo postMessage error:", err);
          }
        });
      },
      { threshold: 0.15 } // Trigger play slightly before page is fully snapped
    );

    if (pageRef.current) {
      observer.observe(pageRef.current);
    }

    return () => {
      if (pageRef.current) {
        observer.unobserve(pageRef.current);
      }
    };
  }, []);

  const handleIframeLoad = (e) => {
    try {
      if (isInView) {
        e.target.contentWindow?.postMessage(JSON.stringify({ method: 'play' }), '*');
      } else {
        e.target.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
      }
    } catch (err) {
      console.error("Vimeo onLoad postMessage error:", err);
    }
  };

  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  const yFast = useTransform(smoothProgress, [0, 1], [250, -250]);
  const yMedium = useTransform(smoothProgress, [0, 1], [150, -150]);
  const ySlow = useTransform(smoothProgress, [0, 1], [60, -60]);

  return (
    <Page className="my-work-page" label="My Work">
      <div 
        ref={(el) => { 
          targetRef.current = el; 
          pageRef.current = el; 
        }} 
        className="about-board-wrapper"
      >
        <motion.div
          className="about-board"
          variants={imageReveal}
          custom={0.08}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.25, once: true }}
        >
          {/* Lined paper lines background */}
          <div className="paper-lines" aria-hidden="true" />

          {/* ── PAGE TITLE ── */}
          <motion.header
            className="about-title my-work-title"
            style={{
              top: `${title.top}%`,
              left: `${title.left}%`,
              rotate: title.rotate ?? 0,
              x: "-50%",
            }}
            variants={textParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.4, once: true }}
          >
            <motion.h1 variants={textRise} style={{ fontSize: `${title.size}rem` }}>
              {title.label} <span className="movie-emoji">🎬</span>
            </motion.h1>
            
            {/* Highlighter Underline */}
            <div 
              className="yellow-highlight-stroke"
              style={{
                position: "absolute",
                top: `${highlight.top}%`,
                left: `${highlight.left}%`,
                width: `${highlight.width}vw`,
                height: `${highlight.height}px`,
                transform: "translateX(-50%)",
                background: "rgba(254, 240, 138, 0.85)",
                borderRadius: "4px",
                zIndex: -1,
              }}
            />
          </motion.header>

          {/* ── RED HAND-DRAWN ARROWS ── */}
          {arrows.map((item) => (
            <ScrapArrowItem
              key={item.id}
              item={item}
              profile={{ borderColor: "#c92722" }}
              y={yFast}
            />
          ))}

          <div className="work-videos-container">
            {videos.map((item, index) => (
              <motion.div
                key={item.id}
                className={`work-video-card-wrapper ${item.id}`}
                style={{
                  position: "absolute",
                  top: `${item.top}%`,
                  left: `${item.left}%`,
                  rotate: item.rotate ?? 0,
                  width: `${item.size}px`,
                  height: "auto",
                  y: yMedium,
                }}
              >
                <motion.div 
                  className="clipboard-card"
                  variants={cardSlideIn}
                  custom={0.15 + index * 0.15}
                  initial="start"
                  whileInView="show"
                  viewport={{ amount: 0.15, once: false }}
                >
                  {/* Hanger / Clip at the top */}
                  <div className="clipboard-clip">
                    <div className="clip-hanger-loop" />
                    <div className="clip-clamp" />
                  </div>

                  {/* Card Content body */}
                  <div className="clipboard-body">
                    {/* Blank video placeholder component or Vimeo Embed */}
                    <div className="video-placeholder">
                      {item.videoUrl ? (
                        <iframe
                          src={`https://player.vimeo.com/video/${getVimeoId(item.videoUrl)}?background=1&autoplay=1&loop=1&title=0&byline=0&portrait=0&muted=1&api=1`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="vimeo-embed"
                          onLoad={handleIframeLoad}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "inherit",
                            border: "none",
                            display: "block",
                            pointerEvents: "none"
                          }}
                        />
                      ) : (
                        <div className="play-button-overlay">
                          <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M8 5v14l11-7z" fill="currentColor" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Red Paint brushstroke brand banner */}
                    <div className="brand-tag-paint">
                      <svg viewBox="0 0 200 50" className="brushstroke-svg" preserveAspectRatio="none">
                        <path 
                          d="M5,22 C30,10 75,6 120,12 C165,18 190,14 195,25 C190,44 150,38 100,41 C50,44 15,46 5,35 Z" 
                          fill="#c92722" 
                        />
                      </svg>
                      <span 
                        className="brand-tag-text"
                        style={{
                          fontFamily: item.fontFamily ?? "'Inter', sans-serif",
                          fontSize: item.textSize ? `${item.textSize}rem` : undefined
                        }}
                      >
                        {item.brandName}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </Page>
  );
}

function Contact({ scrollContainer }) {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    container: scrollContainer,
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001
  });

  const yMedium = useTransform(smoothProgress, [0, 1], [120, -120]);
  const ySlow = useTransform(smoothProgress, [0, 1], [50, -50]);

  return (
    <Page className="contact-page" label="Contact and booking">
      <div ref={targetRef} className="about-board-wrapper">
        <motion.div
          className="about-board"
          variants={imageReveal}
          custom={0.08}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.25, once: true }}
        >
          {/* Lined cream background paper */}
          <div className="paper-lines" aria-hidden="true" />

          {/* ── CENTRAL CHECKLIST NOTEBOOK CARD ── */}
          <motion.div
            className="contact-notebook-card"
            style={{
              y: ySlow,
            }}
            variants={imageReveal}
            custom={0.15}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2, once: true }}
          >
            {/* Realistic Binder spiral header rings */}
            <div className="binder-rings-header">
              <div className="binder-ring-hole"><div className="binder-metal-ring" /></div>
              <div className="binder-ring-hole"><div className="binder-metal-ring" /></div>
              <div className="binder-ring-hole"><div className="binder-metal-ring" /></div>
              <div className="binder-ring-hole"><div className="binder-metal-ring" /></div>
              <div className="binder-ring-hole"><div className="binder-metal-ring" /></div>
            </div>

            {/* Notebook margins and lines */}
            <div className="notebook-card-body">
              <div className="notebook-red-margin" />
              <div className="notebook-lines-overlay" />
              
              <h2 className="notebook-card-title">COLLAB CHECKLIST</h2>
              
              <ul className="notebook-checklist">
                <li className="checklist-item checked">
                  <span className="check-box-icon">✓</span>
                  <span className="checklist-label">Bookings open</span>
                </li>
                <li className="checklist-item checked">
                  <span className="check-box-icon">✓</span>
                  <span className="checklist-label">Tea w Tan</span>
                </li>
                <li className="checklist-item checked">
                  <span className="check-box-icon">✓</span>
                  <span className="checklist-label">Collabs / PR / Promos</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* ── FLOATING EMAIL STICKER TAG ── */}
          <motion.div
            className="floating-contact-sticker email-sticker"
            style={{
              y: yMedium,
            }}
            variants={imageReveal}
            custom={0.25}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2, once: true }}
          >
            <div className="tape-sticker-header">EMAIL ME</div>
            <a href="mailto:thanmayeereddy999@gmail.com" className="sticker-email-link">
              thanmayeereddy999@gmail.com
            </a>
          </motion.div>

          {/* ── FLOATING HANDLE STICKER TAG ── */}
          <motion.div
            className="floating-contact-sticker handle-sticker"
            style={{
              y: yMedium,
            }}
            variants={imageReveal}
            custom={0.3}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2, once: true }}
          >
            <div className="tape-sticker-header social-header">SAY HI</div>
            <span className="sticker-handle-text">@thaannnuuu</span>
          </motion.div>

          {/* ── DECORATIVE HAND-DRAWN RED ARROW ── */}
          <motion.div
            className="contact-decorative-arrow"
            style={{
              y: ySlow,
            }}
            variants={imageReveal}
            custom={0.2}
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.2, once: true }}
          >
            <svg viewBox="0 0 100 100" className="handwritten-arrow-svg">
              {/* Dynamic loop path pointing to the stickers */}
              <path 
                d="M10,20 C50,10 90,40 50,60 C30,70 15,45 40,85" 
                stroke="#c92722" 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round" 
              />
              <path 
                d="M25,75 L40,85 L42,70" 
                stroke="#c92722" 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round" 
              />
            </svg>
          </motion.div>

        </motion.div>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Root App — manages live config state + editor toggle
// ─────────────────────────────────────────────────────────────────

export default function App() {
  // Set to true to enable the live layout editor [E] in the browser
  const ENABLE_EDITOR = true;

  // Ref to track scroll position inside the scrollable container
  const scrollContainerRef = useRef(null);



  // Live config state — starts from the file, gets edited by the panel
  const [config, setConfig] = useState(defaultConfig);
  // Sync state with file updates during dev hot-reloading (HMR)
  const [editorOpen, setEditorOpen] = useState(false);
  useEffect(() => {
    setConfig(defaultConfig);
  }, [defaultConfig]);

  useEffect(() => {
    if (!ENABLE_EDITOR) return;
    const handleKey = (e) => {
      if (e.key === "e" || e.key === "E") {
        // Don't toggle if user is typing in an input
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        setEditorOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ENABLE_EDITOR]);

  return (
    <>
      <main ref={scrollContainerRef} className="diary-scroll" aria-label="Thanmayee Reddy digital diary portfolio">
        <HeroIntro config={config.p1} scrollContainer={scrollContainerRef} />
        <CreativeToolkit config={config.p2} scrollContainer={scrollContainerRef} />
        <HowIWork config={config.p3} scrollContainer={scrollContainerRef} />
        <MyWork config={config.p4} scrollContainer={scrollContainerRef} />
        <Contact scrollContainer={scrollContainerRef} />
      </main>

      {/* ── LIVE EDITOR ── */}
      {ENABLE_EDITOR && (
        editorOpen ? (
          <ScrapbookEditor config={config} onChange={setConfig} />
        ) : (
          <button
            className="sed-badge"
            onClick={() => setEditorOpen(true)}
            title="Open Scrapbook Editor"
          >
            ✏️ Layout Editor [E]
          </button>
        )
      )}
    </>
  );
}
