// src/pages/Landing.jsx
// ─────────────────────────────────────────────────────────────────────────────
// AIRRA Landing Page — full port of AIRRA_Landing.html into React.
//
// INTEGRATION RULES (read before editing):
// 1. This file is self-contained. Do NOT import Tailwind classes here.
//    All styles live in the LANDING_CSS constant below and are injected
//    via a <style> tag. This prevents any bleed with the app's design system.
// 2. The custom cursor (cursor:none on body) is scoped — it sets the class
//    "landing-cursor-active" on <body> on mount and removes it on unmount.
//    Never set cursor:none on the body element globally.
// 3. All hrefs that go to app routes use react-router <Link> or navigate().
//    External hrefs remain plain <a> tags.
// 4. API_BASE reads from import.meta.env.VITE_API_BASE_URL — same env var
//    used everywhere else in the app.
// 5. IntersectionObserver, cursor RAF, and all listeners are cleaned up
//    in the useEffect return to prevent memory leaks on route change.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ── All landing CSS isolated here ─────────────────────────────────────────────
const LANDING_CSS = `
  /* ── Tokens ─────────────────────────────────────────── */
  :root {
    --dark:       #0d0502;
    --dark-2:     #180a04;
    --dark-3:     #271208;
    --cream:      #faf6f0;
    --cream-2:    #f2ebe0;
    --cream-3:    #e8ddd0;
    --orange:     #d4733a;
    --orange-lt:  #e8956a;
    --orange-dim: rgba(212,115,58,0.18);
    --text-dark:  #f0e8dc;
    --text-muted: rgba(240,232,220,0.45);
    --text-body:  #1a0a04;
    --text-muted-lt: #8a7060;
    --ff-heading: "DM Serif Display", serif;
    --ff-body:    "DM Sans", sans-serif;
    --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  }

  /* Scoped to .landing-root so nothing bleeds into the app */
  .landing-root *, .landing-root *::before, .landing-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .landing-root { font-family: var(--ff-body); background: var(--dark); color: var(--text-dark); overflow-x: hidden; }


  /* ── Nav ────────────────────────────────────────────── */
  .l-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    padding: 0 5vw; height: 68px;
    display: flex; align-items: center; justify-content: space-between;
    transition: background 0.4s, backdrop-filter 0.4s, border-color 0.4s;
    border-bottom: 1px solid transparent;
  }
  .l-nav.scrolled {
    background: rgba(13,5,2,0.82);
    backdrop-filter: blur(16px);
    border-bottom-color: rgba(255,255,255,0.06);
  }
  .l-nav-logo {
    font-family: var(--ff-heading); font-size: 22px;
    color: var(--orange); letter-spacing: 0.04em; text-decoration: none;
  }
  .l-nav-right { display: flex; align-items: center; gap: 12px; }
  .l-btn-ghost {
    font-family: var(--ff-body); font-size: 14px; font-weight: 500;
    color: var(--text-dark); background: transparent;
    border: none; padding: 8px 20px; border-radius: 100px;
    cursor: pointer; transition: color 0.2s; text-decoration: none;
    display: inline-flex; align-items: center;
  }
  .l-btn-ghost:hover { color: var(--orange); }
  .l-btn-primary {
    font-family: var(--ff-body); font-size: 14px; font-weight: 600;
    color: var(--dark); background: var(--orange);
    border: none; padding: 10px 24px; border-radius: 100px;
    cursor: pointer; transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  }
  .l-btn-primary:hover {
    background: var(--orange-lt); transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(212,115,58,0.35);
  }
  .l-btn-outline {
    font-family: var(--ff-body); font-size: 14px; font-weight: 500;
    color: var(--text-dark); background: transparent;
    border: 1px solid rgba(240,232,220,0.25); padding: 10px 24px;
    border-radius: 100px; cursor: pointer;
    transition: border-color 0.2s, color 0.2s, transform 0.2s;
    text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
  }
  .l-btn-outline:hover { border-color: var(--orange); color: var(--orange); transform: translateY(-1px); }

  /* ── Hero ───────────────────────────────────────────── */
  .l-hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 120px 5vw 80px; position: relative; overflow: hidden;
  }
  .l-hero-glow {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 900px; height: 600px;
    background: radial-gradient(ellipse at center,
      rgba(212,115,58,0.12) 0%, rgba(212,115,58,0.04) 40%, transparent 70%);
    pointer-events: none;
    animation: l-breathe 6s ease-in-out infinite;
  }
  @keyframes l-breathe {
    0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
    50%       { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
  }
  .l-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    animation: l-float-orb var(--dur, 12s) ease-in-out infinite;
  }
  @keyframes l-float-orb {
    0%, 100% { transform: translateY(0) translateX(0); }
    33%       { transform: translateY(var(--dy1,-20px)) translateX(var(--dx1,10px)); }
    66%       { transform: translateY(var(--dy2,15px)) translateX(var(--dx2,-8px)); }
  }
  .l-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--orange-lt); border: 1px solid rgba(212,115,58,0.3);
    padding: 6px 16px; border-radius: 100px; margin-bottom: 36px;
    opacity: 0; animation: l-fade-up 0.8s 0.2s var(--ease-out) forwards;
  }
  .l-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--orange);
    animation: l-pulse-dot 2s ease-in-out infinite;
  }
  @keyframes l-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.7); }
  }
  .l-hero-headline {
    font-family: var(--ff-heading);
    font-size: clamp(52px, 8vw, 110px); line-height: 1.0;
    color: var(--text-dark); margin-bottom: 12px; overflow: hidden;
  }
  .l-hero-headline em { font-style: italic; color: var(--orange); }
  .l-hero-line {
    display: block; opacity: 0; transform: translateY(60px);
    animation: l-slide-up 1s var(--ease-out) forwards;
  }
  .l-hero-line:nth-child(1) { animation-delay: 0.4s; }
  .l-hero-line:nth-child(2) { animation-delay: 0.55s; }
  .l-hero-line:nth-child(3) { animation-delay: 0.7s; }
  @keyframes l-slide-up {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes l-fade-up {
    to { opacity: 1; transform: translateY(0); }
  }
  .l-hero-sub {
    font-size: clamp(16px, 2vw, 20px); font-weight: 400;
    color: var(--text-muted); max-width: 520px; line-height: 1.65;
    margin: 28px auto 48px; opacity: 0;
    animation: l-fade-up 0.9s 0.9s var(--ease-out) forwards;
  }
  .l-hero-cta {
    display: flex; align-items: center; justify-content: center;
    gap: 14px; flex-wrap: wrap; opacity: 0;
    animation: l-fade-up 0.9s 1.1s var(--ease-out) forwards;
  }
  .l-hero-cta .l-btn-primary { font-size: 16px; padding: 14px 32px; }
  .l-hero-cta .l-btn-outline  { font-size: 16px; padding: 13px 32px; }
  .l-hero-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 48px; margin-top: 72px; opacity: 0;
    animation: l-fade-up 0.9s 1.3s var(--ease-out) forwards;
    flex-wrap: wrap;
  }
  .l-stat-item { text-align: center; }
  .l-stat-num {
    font-family: var(--ff-heading); font-size: 36px;
    color: var(--text-dark); display: block; min-width: 80px;
  }
  .l-stat-num.loading::after {
    content: ''; display: inline-block; width: 60px; height: 3px;
    background: rgba(240,232,220,0.15); border-radius: 2px;
    animation: l-shimmer 1.5s ease-in-out infinite;
  }
  @keyframes l-shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
  .l-stat-label {
    font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--text-muted); margin-top: 4px;
  }
  .l-stat-divider { width: 1px; height: 40px; background: rgba(240,232,220,0.1); }

  /* ── Ticker ─────────────────────────────────────────── */
  .l-ticker-section {
    padding: 28px 0; position: relative;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow: hidden;
  }
  .l-ticker-label {
    position: absolute; left: 5vw; top: 50%; transform: translateY(-50%);
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-muted); z-index: 2; background: var(--dark); padding-right: 16px;
  }
  .l-ticker-track { display: flex; animation: l-ticker 30s linear infinite; white-space: nowrap; }
  .l-ticker-item {
    display: inline-flex; align-items: center; gap: 10px; padding: 0 32px;
    font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: var(--text-muted);
  }
  .l-ticker-item span {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--orange); opacity: 0.6; display: inline-block;
  }
  @keyframes l-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

  /* ── Section shared ─────────────────────────────────── */
  .landing-root section { position: relative; }
  .l-section-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--orange); margin-bottom: 16px; display: block;
  }
  .l-section-title {
    font-family: var(--ff-heading); font-size: clamp(36px, 4.5vw, 62px);
    line-height: 1.08; color: var(--text-dark);
  }
  .l-section-title.dark { color: var(--text-body); }
  .l-section-sub {
    font-size: 17px; font-weight: 400; color: var(--text-muted);
    margin-top: 16px; max-width: 520px; line-height: 1.65;
  }
  .l-section-sub.dark { color: var(--text-muted-lt); }

  /* Scroll reveal */
  .l-reveal {
    opacity: 0; transform: translateY(40px);
    transition: opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out);
  }
  .l-reveal.visible { opacity: 1; transform: none; }
  .l-reveal-d1 { transition-delay: 0.1s; }
  .l-reveal-d2 { transition-delay: 0.2s; }
  .l-reveal-d3 { transition-delay: 0.3s; }
  .l-reveal-d4 { transition-delay: 0.4s; }

  /* ── Workflow ────────────────────────────────────────── */
  .l-workflow { padding: 120px 5vw; background: var(--dark-2); }
  .l-workflow-header { max-width: 600px; margin-bottom: 80px; }
  .l-workflow-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
  @media (max-width: 768px) { .l-workflow-steps { grid-template-columns: 1fr; gap: 2px; } }
  .l-workflow-step {
    padding: 52px 44px; background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    position: relative; overflow: hidden; transition: background 0.4s;
  }
  .l-workflow-step:first-child { border-radius: 20px 0 0 20px; }
  .l-workflow-step:last-child  { border-radius: 0 20px 20px 0; }
  @media (max-width: 768px) {
    .l-workflow-step:first-child { border-radius: 20px 20px 0 0; }
    .l-workflow-step:last-child  { border-radius: 0 0 20px 20px; }
  }
  .l-workflow-step:hover { background: rgba(212,115,58,0.05); }
  .l-workflow-step::before {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--orange), transparent);
    transform: scaleX(0); transform-origin: left; transition: transform 0.5s var(--ease-out);
  }
  .l-workflow-step:hover::before { transform: scaleX(1); }
  .l-step-num {
    font-family: var(--ff-heading); font-size: 64px;
    color: rgba(212,115,58,0.08); line-height: 1; margin-bottom: 16px;
    display: block; font-style: italic;
  }
  .l-step-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--orange); background: rgba(212,115,58,0.12);
    padding: 4px 12px; border-radius: 100px; margin-bottom: 20px;
  }
  .l-step-title { font-family: var(--ff-heading); font-size: 28px; color: var(--text-dark); margin-bottom: 12px; }
  .l-step-desc  { font-size: 15px; color: var(--text-muted); line-height: 1.7; }
  .l-step-connector {
    position: absolute; right: -1px; top: 50%; transform: translateY(-50%);
    width: 24px; height: 24px; background: var(--dark-2);
    border: 1px solid rgba(255,255,255,0.06); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    z-index: 2; font-size: 12px; color: var(--orange);
  }
  @media (max-width: 768px) { .l-step-connector { display: none; } }

  /* ── Features ───────────────────────────────────────── */
  .l-features { padding: 120px 5vw; background: var(--cream); }
  .l-features-header { max-width: 700px; margin: 0 auto 80px; text-align: center; }
  .l-features-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 20px; max-width: 1100px; margin: 0 auto;
  }
  @media (max-width: 768px) { .l-features-grid { grid-template-columns: 1fr; } }
  .l-feature-card {
    background: #fff; border: 1px solid var(--cream-3); border-radius: 20px;
    padding: 44px 40px;
    transition: transform 0.4s var(--ease-out), box-shadow 0.4s;
    cursor: default; position: relative; overflow: hidden;
  }
  .l-feature-card:hover { transform: translateY(-6px); box-shadow: 0 24px 64px rgba(26,10,4,0.1); }
  .l-feature-card::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(212,115,58,0.06), transparent 60%);
    opacity: 0; transition: opacity 0.4s; pointer-events: none;
  }
  .l-feature-card:hover::after { opacity: 1; }
  .l-feature-card.wide { grid-column: span 2; }
  @media (max-width: 768px) { .l-feature-card.wide { grid-column: span 1; } }
  .l-feature-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(212,115,58,0.1);
    display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  }
  .l-feature-icon svg { width: 22px; height: 22px; stroke: var(--orange); fill: none; stroke-width: 1.5; }
  .l-feature-name  { font-family: var(--ff-heading); font-size: 22px; color: var(--text-body); margin-bottom: 10px; }
  .l-feature-desc  { font-size: 15px; color: var(--text-muted-lt); line-height: 1.7; }
  .l-feature-tag {
    display: inline-block; margin-top: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--orange); background: rgba(212,115,58,0.1); padding: 4px 12px; border-radius: 100px;
  }

  /* ── Live data strip ─────────────────────────────────── */
  .l-live-strip {
    padding: 80px 5vw; background: var(--dark-3);
    border-top: 1px solid rgba(255,255,255,0.05);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .l-live-strip-inner { display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
  .l-live-strip-text  { flex: 1; min-width: 280px; }
  .l-live-indicator {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    color: #6BAF7A; margin-bottom: 12px;
  }
  .l-live-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #6BAF7A;
    animation: l-live-pulse 1.5s ease-in-out infinite;
  }
  @keyframes l-live-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(107,175,122,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(107,175,122,0); }
  }
  .l-live-cards { display: flex; gap: 12px; flex-wrap: wrap; }
  .l-live-card {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 22px; min-width: 200px; transition: background 0.3s;
  }
  .l-live-card:hover { background: rgba(255,255,255,0.07); }
  .l-live-card-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
  .l-live-card-value { font-family: var(--ff-heading); font-size: 28px; color: var(--text-dark); }
  .l-live-card-sub   { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
  .l-loading-shimmer {
    display: block; height: 28px; width: 80px;
    background: rgba(255,255,255,0.07); border-radius: 4px;
    animation: l-shimmer 1.5s ease-in-out infinite;
  }

  /* ── CTA ────────────────────────────────────────────── */
  .l-cta { padding: 160px 5vw; text-align: center; background: var(--dark); position: relative; overflow: hidden; }
  .l-cta-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(212,115,58,0.15), transparent 70%);
    pointer-events: none;
  }
  .l-cta-title { font-family: var(--ff-heading); font-size: clamp(40px, 6vw, 80px); color: var(--text-dark); line-height: 1.05; margin-bottom: 20px; }
  .l-cta-title em { font-style: italic; color: var(--orange); }
  .l-cta-sub  { font-size: 18px; color: var(--text-muted); max-width: 480px; margin: 0 auto 48px; line-height: 1.65; }
  .l-cta-actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .l-cta-actions .l-btn-primary { font-size: 18px; padding: 16px 40px; }
  .l-cta-note { margin-top: 24px; font-size: 13px; color: var(--text-muted); }

  /* ── Footer ─────────────────────────────────────────── */
  .l-footer { background: var(--dark-2); border-top: 1px solid rgba(255,255,255,0.06); padding: 80px 5vw 40px; }
  .l-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px; margin-bottom: 60px; }
  @media (max-width: 768px) { .l-footer-top { grid-template-columns: 1fr 1fr; gap: 40px; } }
  @media (max-width: 480px) { .l-footer-top { grid-template-columns: 1fr; } }
  .l-footer-brand-name { font-family: var(--ff-heading); font-size: 28px; color: var(--orange); margin-bottom: 12px; }
  .l-footer-brand-sub  { font-size: 14px; color: var(--text-muted); line-height: 1.6; max-width: 220px; }
  .l-footer-col-title  { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dark); margin-bottom: 20px; }
  .l-footer-links { list-style: none; }
  .l-footer-links li { margin-bottom: 12px; }
  .l-footer-links a { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
  .l-footer-links a:hover { color: var(--text-dark); }
  .l-footer-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .l-footer-copy { font-size: 13px; color: var(--text-muted); }
  .l-footer-made { font-size: 13px; color: var(--text-muted); }
`;

// ── Ticker niches ─────────────────────────────────────────────────────────────
const NICHES = [
  'Gaming','Lifestyle','Education','Health','Fashion','Finance',
  'Food','Travel','Comedy','Fitness','Tech','Beauty','Music','Vlogs',
];

// ── Feature card icons (inline SVG paths to avoid lucide dependency bleeding) ─
const ICONS = {
  zap:    <svg viewBox="0 0 24 24"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  bar:    <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  pen:    <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  music:  <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  rocket: <svg viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  chart:  <svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  // Refs for DOM nodes that JS needs to touch
  const navRef          = useRef(null);
  const tickerRef       = useRef(null);
  const cursorDotRef    = useRef(null);
  const cursorRingRef   = useRef(null);
  const statTrendsRef   = useRef(null);
  const statSongsRef    = useRef(null);
  const statTrendsLvRef = useRef(null);
  const statSongsLvRef  = useRef(null);

  useEffect(() => {
    // ── 1. Inject CSS into <head> ─────────────────────────────────────────────
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-landing', 'true');
    styleEl.textContent = LANDING_CSS;
    document.head.appendChild(styleEl);

    // ── 2. Custom cursor — add class to body ──────────────────────────────────
    document.body.classList.add('landing-cursor-active');

    const dot  = cursorDotRef.current;
    const ring = cursorRingRef.current;
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId;

    const onMouseMove = (e) => { mx = e.clientX; my = e.clientY; };
    document.addEventListener('mousemove', onMouseMove);

    const animateCursor = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (dot)  { dot.style.left = mx + 'px';  dot.style.top  = my + 'px'; }
      if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
      rafId = requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Cursor grow on interactive elements
    const interactiveEls = document.querySelectorAll('.landing-root a, .landing-root button, .l-feature-card, .l-workflow-step');
    const onEnter = () => {
      if (!ring || !dot) return;
      ring.style.width = '56px'; ring.style.height = '56px';
      ring.style.borderColor = 'rgba(212,115,58,0.8)';
      dot.style.width = '4px'; dot.style.height = '4px';
    };
    const onLeave = () => {
      if (!ring || !dot) return;
      ring.style.width = '36px'; ring.style.height = '36px';
      ring.style.borderColor = 'rgba(212,115,58,0.5)';
      dot.style.width = '8px'; dot.style.height = '8px';
    };
    interactiveEls.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });

    // ── 3. Feature card mouse glow ────────────────────────────────────────────
    const featureCards = document.querySelectorAll('.l-feature-card');
    const onCardMouseMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
      e.currentTarget.style.setProperty('--mx', x + '%');
      e.currentTarget.style.setProperty('--my', y + '%');
    };
    featureCards.forEach(c => c.addEventListener('mousemove', onCardMouseMove));

    // ── 4. Nav scroll ─────────────────────────────────────────────────────────
    const onScroll = () => {
      if (navRef.current) navRef.current.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── 5. Scroll reveal ──────────────────────────────────────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.l-reveal').forEach(el => revealObserver.observe(el));

    // ── 6. Build ticker ───────────────────────────────────────────────────────
    if (tickerRef.current) {
      const allNiches = [...NICHES, ...NICHES];
      allNiches.forEach(n => {
        const span = document.createElement('span');
        span.className = 'l-ticker-item';
        span.innerHTML = `<span></span>${n}`;
        tickerRef.current.appendChild(span);
      });
    }

    // ── 7. Fetch public stats ─────────────────────────────────────────────────
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const fetchStats = async () => {
      // Trends
      try {
        const r = await fetch(`${API_BASE}/api/v1/trends/`, { headers: { 'Content-Type': 'application/json' } });
        if (r.ok) {
          const data = await r.json();
          const count = data?.data?.total || data?.data?.trends?.length;
          if (count) {
            if (statTrendsRef.current)   statTrendsRef.current.textContent   = count + '+';
            if (statTrendsLvRef.current) statTrendsLvRef.current.textContent = count + '+';
          }
        }
      } catch (_) { /* API unreachable — keep placeholders */ }

      // Songs
      try {
        const r = await fetch(`${API_BASE}/api/v1/songs/`, { headers: { 'Content-Type': 'application/json' } });
        if (r.ok) {
          const data = await r.json();
          const count = data?.data?.total || data?.data?.songs?.length;
          if (count && statSongsLvRef.current) statSongsLvRef.current.textContent = count + '+';
        }
      } catch (_) { /* keep placeholder */ }
    };
    fetchStats();

    // Remove shimmer after 3s if still empty
    const shimmerTimer = setTimeout(() => {
      document.querySelectorAll('.l-loading-shimmer').forEach(el => { el.textContent = '—'; el.classList.remove('l-loading-shimmer'); });
    }, 3000);

    // ── 8. Hero parallax glow ─────────────────────────────────────────────────
    const onParallax = (e) => {
      const glow = document.querySelector('.l-hero-glow');
      if (!glow) return;
      const x = (e.clientX / window.innerWidth  - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      glow.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };
    document.addEventListener('mousemove', onParallax);

    // ── 9. Text scramble on hero lines ────────────────────────────────────────
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const scramble = (el, delay = 0) => {
      const original = el.textContent.trim();
      let frame = 0;
      const totalFrames = 20;
      setTimeout(() => {
        const interval = setInterval(() => {
          el.textContent = original.split('').map((c, i) => {
            if (c === ' ') return ' ';
            if (frame > (i / original.length) * totalFrames) return c;
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
          frame++;
          if (frame >= totalFrames) { el.textContent = original; clearInterval(interval); }
        }, 30);
      }, delay);
    };
    const scrambleTimer = setTimeout(() => {
      document.querySelectorAll('.l-hero-line').forEach((line, i) => scramble(line, i * 150));
    }, 1200);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      // Remove injected CSS
      document.head.removeChild(styleEl);
      // Remove cursor class
      document.body.classList.remove('landing-cursor-active');
      // Cancel RAF
      cancelAnimationFrame(rafId);
      // Remove listeners
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousemove', onParallax);
      window.removeEventListener('scroll', onScroll);
      interactiveEls.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); });
      featureCards.forEach(c => c.removeEventListener('mousemove', onCardMouseMove));
      revealObserver.disconnect();
      clearTimeout(shimmerTimer);
      clearTimeout(scrambleTimer);
    };
  }, []); // runs once on mount, cleans up on unmount

  return (
    <>
      {/* Custom cursor elements — outside landing-root so they're fixed to viewport */}
      <div id="landing-cursor-dot"  ref={cursorDotRef}  />
      <div id="landing-cursor-ring" ref={cursorRingRef} />

      <div className="landing-root">

        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <nav className="l-nav" ref={navRef} id="main-nav">
          <Link to="/" className="l-nav-logo">AIRRA</Link>
          <div className="l-nav-right">
            <a href="#features"  className="l-btn-ghost">Features</a>
            <a href="#workflow"  className="l-btn-ghost">How it works</a>
            <Link to="/signin"   className="l-btn-ghost">Sign in</Link>
            <Link to="/register" className="l-btn-primary">Get started →</Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section id="hero" className="l-hero">
          <div className="l-hero-glow" />

          {/* Floating orbs */}
          <div className="l-orb" style={{ width:300, height:300, top:'15%', left:'8%', background:'radial-gradient(circle, rgba(212,115,58,0.06) 0%, transparent 70%)', '--dur':'14s', '--dy1':'-30px', '--dx1':'15px', '--dy2':'20px', '--dx2':'-12px' }} />
          <div className="l-orb" style={{ width:200, height:200, top:'60%', right:'10%', background:'radial-gradient(circle, rgba(212,115,58,0.04) 0%, transparent 70%)', '--dur':'18s', '--dy1':'25px', '--dx1':'-10px', '--dy2':'-15px', '--dx2':'8px' }} />
          <div className="l-orb" style={{ width:150, height:150, bottom:'20%', left:'20%', background:'radial-gradient(circle, rgba(212,115,58,0.05) 0%, transparent 70%)', '--dur':'10s', '--dy1':'-20px', '--dx1':'8px', '--dy2':'12px', '--dx2':'-6px' }} />

          <div className="l-badge">
            <span className="l-badge-dot" />
            India's first AI Content Manager
          </div>

          <h1 className="l-hero-headline">
            <span className="l-hero-line">Know what</span>
            <span className="l-hero-line">to post,</span>
            <span className="l-hero-line"><em>before anyone.</em></span>
          </h1>

          <p className="l-hero-sub">
            AIRRA tracks what's trending across Instagram and YouTube in real time —
            and turns it into ready-to-shoot scripts, hooks, and content strategies for Indian creators.
          </p>

          <div className="l-hero-cta">
            <Link to="/register" className="l-btn-primary">Start for free →</Link>
            <a href="#workflow"   className="l-btn-outline">See how it works</a>
          </div>

          <div className="l-hero-stats">
            <div className="l-stat-item">
              <span className="l-stat-num loading" ref={statTrendsRef} id="stat-trends">—</span>
              <span className="l-stat-label">Trends tracked</span>
            </div>
            <div className="l-stat-divider" />
            <div className="l-stat-item">
              <span className="l-stat-num">1,000+</span>
              <span className="l-stat-label">Creators onboarded</span>
            </div>
            <div className="l-stat-divider" />
            <div className="l-stat-item">
              <span className="l-stat-num">5 min</span>
              <span className="l-stat-label">From idea to script</span>
            </div>
          </div>
        </section>

        {/* ── Ticker ───────────────────────────────────────────────────────── */}
        <div className="l-ticker-section">
          <span className="l-ticker-label">Niches covered</span>
          <div className="l-ticker-track" ref={tickerRef} id="ticker-track" />
        </div>

        {/* ── Workflow ─────────────────────────────────────────────────────── */}
        <section id="workflow" className="l-workflow">
          <div className="l-workflow-header">
            <span className="l-section-label l-reveal">How it works</span>
            <h2 className="l-section-title l-reveal l-reveal-d1">
              From trend to post<br />in three steps.
            </h2>
            <p className="l-section-sub l-reveal l-reveal-d2">
              AIRRA doesn't just surface trends — it builds your entire content strategy around them, automatically.
            </p>
          </div>

          <div className="l-workflow-steps">
            {/* Step 1 */}
            <div className="l-workflow-step l-reveal">
              <span className="l-step-num">01</span>
              <span className="l-step-tag">Discover</span>
              <h3 className="l-step-title">AIRRA spots the trend</h3>
              <p className="l-step-desc">
                Live scraping across Instagram, YouTube, Reddit, and Google Trends surfaces what's rising in your niche — before it peaks.
              </p>
              <div className="l-step-connector">→</div>
            </div>

            {/* Step 2 */}
            <div className="l-workflow-step l-reveal l-reveal-d1">
              <span className="l-step-num">02</span>
              <span className="l-step-tag">Create</span>
              <h3 className="l-step-title">Studio writes your script</h3>
              <p className="l-step-desc">
                One click turns the trend into a full script — hook, body, CTA — written in your voice, for your niche, with the right BGM.
              </p>
              <div className="l-step-connector">→</div>
            </div>

            {/* Step 3 */}
            <div className="l-workflow-step l-reveal l-reveal-d2">
              <span className="l-step-num">03</span>
              <span className="l-step-tag">Launch</span>
              <h3 className="l-step-title">Post at the perfect time</h3>
              <p className="l-step-desc">
                AIRRA calculates the optimal posting window for your audience and hands you a complete posting package — caption, hashtags, timing.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section id="features" className="l-features">
          <div className="l-features-header">
            <span className="l-section-label l-reveal">Features</span>
            <h2 className="l-section-title dark l-reveal l-reveal-d1">
              Every tool a creator needs.<br />Nothing they don't.
            </h2>
            <p className="l-section-sub dark l-reveal l-reveal-d2">
              AIRRA is built for Indian creators — from nano to macro — who want to grow without burning out.
            </p>
          </div>

          <div className="l-features-grid">
            {/* Card 1 — wide */}
            <div className="l-feature-card wide l-reveal">
              <div className="l-feature-icon">{ICONS.zap}</div>
              <div className="l-feature-name">Live Trend Intelligence</div>
              <p className="l-feature-desc">
                AIRRA monitors Instagram Reels, YouTube Shorts, Reddit, Pinterest, and Google Trends simultaneously — updated every 5 minutes. You see what's rising before your competitors do.
              </p>
              <span className="l-feature-tag">Real-time</span>
            </div>

            {/* Card 2 */}
            <div className="l-feature-card l-reveal l-reveal-d1">
              <div className="l-feature-icon">{ICONS.pen}</div>
              <div className="l-feature-name">AI Script Studio</div>
              <p className="l-feature-desc">
                Deep research agent + script generator writes full Reel scripts, YouTube outlines, and carousels — in your voice, with proven hooks from real viral content.
              </p>
              <span className="l-feature-tag">AI-powered</span>
            </div>

            {/* Card 3 */}
            <div className="l-feature-card l-reveal l-reveal-d2">
              <div className="l-feature-icon">{ICONS.music}</div>
              <div className="l-feature-name">BGM Matcher</div>
              <p className="l-feature-desc">
                Matches your content idea to trending audio on Spotify, JioSaavn, and Instagram — so your Reels get the algorithmic boost that comes with the right sound.
              </p>
              <span className="l-feature-tag">Audio intelligence</span>
            </div>

            {/* Card 4 */}
            <div className="l-feature-card l-reveal l-reveal-d1">
              <div className="l-feature-icon">{ICONS.bar}</div>
              <div className="l-feature-name">Video DNA</div>
              <p className="l-feature-desc">
                Drop any YouTube URL and get a full breakdown — hook score, SEO score, retention analysis, and competitor gap. Know exactly why a video worked (or didn't).
              </p>
              <span className="l-feature-tag">Analytics</span>
            </div>

            {/* Card 5 */}
            <div className="l-feature-card l-reveal l-reveal-d2">
              <div className="l-feature-icon">{ICONS.rocket}</div>
              <div className="l-feature-name">Launch Planner</div>
              <p className="l-feature-desc">
                Optimal posting time, platform-specific caption, hashtag sets, and a full content calendar — all generated in one click from your script.
              </p>
              <span className="l-feature-tag">Growth</span>
            </div>

            {/* Card 6 */}
            <div className="l-feature-card l-reveal l-reveal-d1">
              <div className="l-feature-icon">{ICONS.chart}</div>
              <div className="l-feature-name">Creator Analytics</div>
              <p className="l-feature-desc">
                Connect your Instagram and YouTube accounts for a personalised growth dashboard — engagement trends, best performing content types, and AI-powered next steps.
              </p>
              <span className="l-feature-tag">Personalised</span>
            </div>
          </div>
        </section>

        {/* ── Live data strip ───────────────────────────────────────────────── */}
        <section id="live-strip" className="l-live-strip">
          <div className="l-live-strip-inner">
            <div className="l-live-strip-text">
              <div className="l-live-indicator">
                <span className="l-live-dot" />
                Live data
              </div>
              <h2 className="l-section-title l-reveal" style={{ fontSize:'clamp(28px,3vw,44px)' }}>
                Powered by real signals,<br />not guesswork.
              </h2>
              <p className="l-section-sub l-reveal l-reveal-d1" style={{ marginTop:12 }}>
                Every insight on AIRRA is backed by live scraping, real-time APIs, and AI trained on Indian creator data.
              </p>
            </div>

            <div className="l-live-cards l-reveal l-reveal-d2">
              <div className="l-live-card">
                <div className="l-live-card-label">Trends tracked</div>
                <div className="l-live-card-value">
                  <span className="l-loading-shimmer" ref={statTrendsLvRef} id="stat-trends-live" />
                </div>
                <div className="l-live-card-sub">refreshed every 5 min</div>
              </div>
              <div className="l-live-card">
                <div className="l-live-card-label">Songs live now</div>
                <div className="l-live-card-value">
                  <span className="l-loading-shimmer" ref={statSongsLvRef} id="stat-songs-live" />
                </div>
                <div className="l-live-card-sub">Spotify + JioSaavn</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section id="cta" className="l-cta">
          <div className="l-cta-glow" />
          <h2 className="l-cta-title l-reveal">
            Start creating content<br /><em>that actually works.</em>
          </h2>
          <p className="l-cta-sub l-reveal l-reveal-d1">
            Join creators across India who use AIRRA to stay ahead of every trend.
          </p>
          <div className="l-cta-actions l-reveal l-reveal-d2">
            <Link to="/register" className="l-btn-primary">Get started — it's free</Link>
          </div>
          <p className="l-cta-note l-reveal l-reveal-d3">No credit card required. Start in under 2 minutes.</p>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="l-footer">
          <div className="l-footer-top">
            <div>
              <div className="l-footer-brand-name">AIRRA</div>
              <p className="l-footer-brand-sub">Know what to post. Before anyone else.</p>
            </div>
            <div>
              <div className="l-footer-col-title">Product</div>
              <ul className="l-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#workflow">How it works</a></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/about">About</Link></li>
              </ul>
            </div>
            <div>
              <div className="l-footer-col-title">Legal</div>
              <ul className="l-footer-links">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/data-deletion">Data Deletion</Link></li>
              </ul>
            </div>
            <div>
              <div className="l-footer-col-title">Connect</div>
              <ul className="l-footer-links">
                <li><a href="https://instagram.com/airra.in" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://twitter.com/airra_in"  target="_blank" rel="noreferrer">Twitter / X</a></li>
                <li><a href="https://youtube.com/@airra"    target="_blank" rel="noreferrer">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="l-footer-bottom">
            <span className="l-footer-copy">© 2026 AIRRA. All rights reserved.</span>
            <span className="l-footer-made">Built for Indian creators 🇮🇳</span>
          </div>
        </footer>

      </div>{/* end .landing-root */}
    </>
  );
}