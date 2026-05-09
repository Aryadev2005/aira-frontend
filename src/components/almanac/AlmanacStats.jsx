import React from 'react';

const AlmanacStats = ({ analytics }) => {
  // Spark path for growth chart
  const sparkPts = [4, 8, 6, 12, 10, 16, 14, 20, 22, 19, 26, 30, 28, 34];
  const max = 34;
  const w = 220, h = 36;
  const pts = sparkPts.map((v, i) => {
    const x = (i / (sparkPts.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y.toFixed(1)}`;
  }).join(' ');

  // Health ring - use analytics data if available
  const health = analytics?.healthScore ?? analytics?.currentHealthScore ?? 84;
  const circ = 2 * Math.PI * 26;
  const dash = (health / 100) * circ;

  // Growth value from analytics or default
  const growth = analytics?.growthRate ?? '+18.2';
  const ideas = analytics?.contentIdeas ?? analytics?.weeklyIdeas ?? 27;
  const bestWindow = analytics?.bestWindow ?? '8:42';

  return (
    <section className="almanac-section">
      <div className="almanac-section-head">
        <span className="num">IV.</span>
        <h2 className="title">The <em>almanac</em></h2>
        <p className="blurb">Your channel, engraved. A weekly readout of the numbers that actually matter.</p>
      </div>

      <div className="almanac-stats">
        <div className="almanac-stats-cell almanac-stats-hero">
          <div className="lbl">— Growth · 7 days —</div>
          <div className="val">+<em>{growth}</em><span className="unit"> %</span></div>
          <div className="sub">Compounding faster than 84% of creators in your niche.</div>
          <svg className="almanac-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
            <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={`${pts} ${w},${h} 0,${h}`} fill="currentColor" opacity="0.18" />
          </svg>
        </div>

        <div className="almanac-stats-cell">
          <div className="lbl">— Health score —</div>
          <div className="almanac-ring-wrap">
            <div className="almanac-ring">
              <svg width="64" height="64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(244,234,216,0.18)" strokeWidth="4" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--almanac-terracotta)" strokeWidth="4"
                        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
              </svg>
              <div className="num">{health}</div>
            </div>
            <div>
              <div style={{fontFamily:'var(--almanac-serif)',fontSize:24,lineHeight:1,color:'var(--almanac-ivory)'}}>Excellent</div>
              <div className="delta">▲ +6 vs. last week</div>
            </div>
          </div>
        </div>

        <div className="almanac-stats-cell">
          <div className="lbl">— Content ideas —</div>
          <div className="val"><em>{ideas}</em></div>
          <div className="delta">▲ 9 fresh today</div>
          <div style={{marginTop:8,fontFamily:'var(--almanac-mono)',fontSize:10.5,letterSpacing:'0.14em',color:'rgba(244,234,216,0.55)',textTransform:'uppercase'}}>
            Top: GRWM · Hooks · Vlog
          </div>
        </div>

        <div className="almanac-stats-cell">
          <div className="lbl">— Best window —</div>
          <div className="val" style={{fontSize:34}}>{bestWindow.split(':')[0]}:<em>{bestWindow.split(':')[1] || '42'}</em><span className="unit"> PM</span></div>
          <div className="delta">▲ 32% lift vs. avg slot</div>
          <div style={{marginTop:8,fontFamily:'var(--almanac-mono)',fontSize:10.5,letterSpacing:'0.14em',color:'rgba(244,234,216,0.55)',textTransform:'uppercase'}}>
            Tonight · Tue
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlmanacStats;
