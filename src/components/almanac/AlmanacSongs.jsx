import React from 'react';

// Static fallback data - replace with API data when available
const DEFAULT_SONGS = [
  { id:1, rank:'i.', title:'Husn', artist:'Anuv Jain', streams:'4.2M', delta:'+18%', dir:'up' },
  { id:2, rank:'ii.', title:'Sajni', artist:'Arijit · Ram Sampath', streams:'9.8M', delta:'+42%', dir:'up' },
  { id:3, rank:'iii.', title:'Tum Se', artist:'Sachet–Parampara', streams:'2.4M', delta:'NEW', dir:'up' },
  { id:4, rank:'iv.', title:'Apna Bana Le', artist:'Arijit Singh', streams:'12.1M', delta:'‑4%', dir:'down' },
];

const Wave = ({ count = 18, hot = false }) => {
  const bars = Array.from({length: count}, (_, i) => {
    const h = 20 + Math.abs(Math.sin(i * 0.7)) * 80;
    return <i key={i} style={{ height: `${h}%`, opacity: hot ? 1 : 0.6 }} />;
  });
  return <div className="almanac-wave">{bars}</div>;
};

const AlmanacSongs = ({ songs: propSongs }) => {
  const songs = propSongs || DEFAULT_SONGS;

  return (
    <section className="almanac-section">
      <div className="almanac-section-head">
        <span className="num">III.</span>
        <h2 className="title">Songs <em>spinning</em> right now</h2>
        <p className="blurb">Curated by what your niche is actually using — not the global Top‑40.</p>
        <a className="more" href="/dashboard/songs">All records →</a>
      </div>

      <div className="almanac-songs">
        {songs.map((s, i) => (
          <div key={s.id} className="almanac-song">
            <div style={{position:'relative'}}>
              <div className="almanac-vinyl"></div>
            </div>
            <div>
              <span className="almanac-song-rank">{s.rank}</span>
              <h4>{s.title}</h4>
              <div className="artist">{s.artist}</div>
              <div style={{marginTop:8}}>
                <Wave count={20} hot={i < 2} />
              </div>
            </div>
            <div className="almanac-song-meta">
              <div>{s.streams}</div>
              <div className={`delta ${s.dir === 'down' ? 'down' : ''}`}>
                {s.dir === 'up' ? '▲' : '▼'} {s.delta}
              </div>
              <button className="almanac-btn almanac-btn-ghost" style={{padding:'6px 10px',fontSize:11,letterSpacing:'0.06em'}}>Use</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AlmanacSongs;
