import React, { useState } from 'react';

// Static fallback data - replace with API data when available
const DEFAULT_TRENDS = [
  { id:'t1', x: 22, y: 30, tier:'lg', kind:'hot', label:'GRWM',
    title: <>3‑step <em>GRWM</em></>,
    blurb: 'Skincare creators are pivoting to a 3‑step morning routine paired with first‑person POV. Average watch time +38% over 7 days.',
    velocity:'+34%', window:'48h', match:'94%' },
  { id:'t2', x: 60, y: 18, tier:'md', kind:'hot', label:'Quiet Lux',
    title: <>Quiet <em>luxury</em></>,
    blurb: 'Beige‑tone product styling outperforming bright palettes by 2× on saves. Pairs well with ASMR voice‑over.',
    velocity:'+19%', window:'72h', match:'81%' },
  { id:'t3', x: 78, y: 52, tier:'md', kind:'rising', label:'Marathi',
    title: <>Marathi <em>reels</em></>,
    blurb: 'Regional content surging — algorithmic boost during festival window. Strong fit if you have language flexibility.',
    velocity:'+58%', window:'5d', match:'62%' },
  { id:'t4', x: 38, y: 64, tier:'sm', kind:'rising', label:'Studyvlog',
    title: <>Pomodoro <em>vlogs</em></>,
    blurb: 'Long‑form (8–12 min) study sessions with lo‑fi BGM are climbing the explore page.',
    velocity:'+22%', window:'7d', match:'58%' },
  { id:'t5', x: 14, y: 70, tier:'sm', kind:'new', label:'POV Café',
    title: <>POV <em>café days</em></>,
    blurb: 'New format — silent first‑person café visits with on‑screen typewriter notes. Niche but breaking out fast.',
    velocity:'NEW', window:'24h', match:'47%' },
  { id:'t6', x: 56, y: 78, tier:'sm', kind:'new', label:'Niche Stack',
    title: <>The <em>niche stack</em></>,
    blurb: 'Layered creator series stacking 3 micro‑niches into one channel. Pioneers are getting 6‑figure follows.',
    velocity:'NEW', window:'36h', match:'70%' },
  { id:'t7', x: 86, y: 28, tier:'sm', kind:'hot', label:'Hooks',
    title: <>"Wait, what?" <em>hooks</em></>,
    blurb: 'Pattern‑interrupt opening lines pushing 3‑second retention 2× over baseline.',
    velocity:'+27%', window:'48h', match:'88%' },
];

const AlmanacConstellation = ({ trends: propTrends }) => {
  const [active, setActive] = useState('t1');
  const trends = propTrends || DEFAULT_TRENDS;
  const cur = trends.find(t => t.id === active) || trends[0];

  return (
    <section className="almanac-section">
      <div className="almanac-section-head">
        <span className="num">II.</span>
        <h2 className="title">A <em>constellation</em> of trends</h2>
        <p className="blurb">Mapped to your niche, sized by velocity. Tap a star to read its story.</p>
        <a className="more" href="/dashboard/discover">View atlas →</a>
      </div>

      <div className="almanac-constellation">
        <div className="almanac-constellation-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(31,20,12,0.06)" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            {/* Connecting lines from active node */}
            {trends.filter(t => t.id !== cur.id).map((t) => (
              <line
                key={t.id}
                x1={cur.x} y1={cur.y} x2={t.x} y2={t.y}
                stroke="rgba(31,20,12,0.18)"
                strokeWidth="0.2"
                strokeDasharray="0.6 0.8"
              />
            ))}
          </svg>
          <div className="almanac-compass">
            <span>N</span>
            <div className="almanac-compass-rose"></div>
          </div>
          {trends.map(t => (
            <button
              key={t.id}
              className="almanac-node"
              data-tier={t.tier}
              data-kind={t.kind}
              data-active={active === t.id}
              style={{ left:`calc(${t.x}% - 35px)`, top:`calc(${t.y}% - 35px)` }}
              onClick={() => setActive(t.id)}
              title={t.label}
            >
              {t.label}
            </button>
          ))}
          <div className="almanac-legend">
            <span className="pin"><span className="sw hot"></span>Hot</span>
            <span className="pin"><span className="sw ris"></span>Rising</span>
            <span className="pin"><span className="sw new"></span>New</span>
          </div>
        </div>

        <div className="almanac-detail">
          <div className="almanac-detail-tag">Trend dossier · {cur.label.toUpperCase()}</div>
          <h3>{cur.title}</h3>
          <p>{cur.blurb}</p>
          <div className="almanac-detail-stats">
            <div>
              <div className="lbl">Velocity</div>
              <div className="val"><em>{cur.velocity}</em></div>
            </div>
            <div>
              <div className="lbl">Window</div>
              <div className="val">{cur.window}</div>
            </div>
            <div>
              <div className="lbl">Niche fit</div>
              <div className="val"><em>{cur.match}</em></div>
            </div>
          </div>
          <div className="almanac-detail-actions">
            <button className="almanac-btn almanac-btn-primary">
              Open in Studio
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M0 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="almanac-btn almanac-btn-ghost">Save to brief</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlmanacConstellation;
