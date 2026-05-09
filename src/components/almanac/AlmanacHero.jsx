import React from 'react';

const AlmanacHero = ({ name = 'Creator' }) => {
  const greet = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const dials = [
    { num: '+12', sub: '%', label: 'Reach', dir: 'up' },
    { num: '7.4', sub: 'k', label: 'Saves', dir: 'up' },
    { num: '48', sub: 'hrs', label: 'Lead', dir: 'up' },
    { num: '03', sub: '', label: 'Drops', dir: 'down' },
  ];

  return (
    <section className="almanac-hero">
      <div>
        <div className="almanac-kicker">
          <span className="rule"></span>
          <span>{greet} · Volume 24 · Issue 09</span>
        </div>
        <h1>
          Hey,
          <span className="name">{name}<span className="punc">.</span></span>
        </h1>
        <p className="almanac-hero-meta">
          The wind is on your side today. <em>Three trends</em> in your niche broke into Top‑10 in the last six hours, and your average watch‑time is climbing for the fourth day running. Today is a making day.
        </p>
      </div>

      <div className="almanac-forecast">
        <div className="almanac-forecast-head">— Today's reading —</div>
        <div className="almanac-forecast-headline">
          <span className="hot">Warm front</span> rolling through <em>Skincare</em> &amp; <em>Studyvlog</em>.
        </div>
        <div className="almanac-windrose">
          {dials.map(d => (
            <div key={d.label} className="almanac-dial" data-down={d.dir === 'down'}>
              <div className="num">
                {d.num.startsWith('+') ? <em>{d.num}</em> : d.num}
                {d.sub && <span style={{fontFamily:'var(--almanac-mono)',fontSize:11,marginLeft:2,color:'var(--almanac-bark)'}}>{d.sub}</span>}
              </div>
              <div className="arrow">{d.dir === 'up' ? '▲' : '▼'}</div>
              <div className="lbl">{d.label}</div>
            </div>
          ))}
        </div>

        <div className="almanac-ticker" aria-hidden="true">
          <div className="almanac-ticker-track">
            <span className="up">Skincare GRWM <em>+34%</em></span>
            <span className="up">Productivity hooks <em>+22%</em></span>
            <span className="dn">Daily vlog <em>‑6%</em></span>
            <span className="up">Marathi reels <em>+58%</em></span>
            <span className="up">"Quiet luxury" <em>+19%</em></span>
            <span className="up">Skincare GRWM <em>+34%</em></span>
            <span className="up">Productivity hooks <em>+22%</em></span>
            <span className="dn">Daily vlog <em>‑6%</em></span>
            <span className="up">Marathi reels <em>+58%</em></span>
            <span className="up">"Quiet luxury" <em>+19%</em></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlmanacHero;
