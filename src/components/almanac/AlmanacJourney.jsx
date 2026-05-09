import React from 'react';

const AlmanacJourney = ({ active, setActive }) => {
  const stages = [
    {
      id: 'discover',
      ord: '01',
      glyph: 'D',
      label: 'Chapter II',
      title: <>What to <em>make</em></>,
      desc: 'Niche trends, viral angles, competitor moves — surfaced 48 hours before the algorithm catches on.',
      meta: [<span key="c" className="almanac-chip hot">Hot · 12 today</span>, <span key="d">2m read</span>],
      cta: 'Browse the brief',
    },
    {
      id: 'studio',
      ord: '02',
      glyph: 'S',
      label: 'Chapter III',
      title: <>How to <em>make it</em></>,
      desc: 'Script builder, BGM matcher, hook variations and editing assistant — without losing your voice.',
      meta: [<span key="c" className="almanac-chip live">Drafting · 2</span>, <span key="d">Resume</span>],
      cta: 'Open studio',
    },
    {
      id: 'launch',
      ord: '03',
      glyph: 'L',
      label: 'Chapter IV',
      title: <>Drop it <em>right</em></>,
      desc: 'Optimal timing, posting package, and brand‑deal alerts so a hit doesn\'t slip past the algorithm.',
      meta: [<span key="c" className="almanac-chip queue">Queued · 1</span>, <span key="d">Tonight 8:42 PM</span>],
      cta: 'Schedule launch',
    },
  ];

  return (
    <section className="almanac-section">
      <div className="almanac-section-head">
        <span className="num">I.</span>
        <h2 className="title">Your <em>workflow</em> today</h2>
        <p className="blurb">A three‑step ritual: read the brief, make the thing, drop it on the perfect minute.</p>
      </div>
      <div className="almanac-journey">
        <div className="almanac-journey-path">
          <div className="almanac-journey-track"></div>
          {stages.map(s => (
            <div
              key={s.id}
              className="almanac-stage"
              data-active={active === s.id}
              onClick={() => setActive && setActive(s.id)}
            >
              <span className="glyph">{s.glyph}</span>
              <div className="marker">
                <span className="ord">{s.ord}</span>
                {s.glyph}
              </div>
              <div className="label">{s.label}</div>
              <div className="title">{s.title}</div>
              <div className="desc">{s.desc}</div>
              <div className="meta">{s.meta}</div>
              <div className="arrow">
                <span>{s.cta}</span>
                <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
                  <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AlmanacJourney;
