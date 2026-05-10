import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, TrendingUp, Clock, Mic2 } from 'lucide-react';

const platformStyle = (platform = '') => {
  const p = platform.toLowerCase();
  if (p.includes('spotify'))  return { label: 'Spotify',  dot: 'bg-green-500',  badge: 'bg-green-500/15 text-green-700 border-green-500/20' };
  if (p.includes('jiosaavn') || p.includes('saavn')) return { label: 'JioSaavn', dot: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-700 border-blue-500/20' };
  if (p.includes('youtube'))  return { label: 'YouTube',  dot: 'bg-red-500',    badge: 'bg-red-500/15 text-red-700 border-red-500/20' };
  return { label: platform || 'Music', dot: 'bg-primary', badge: 'bg-primary/15 text-primary border-primary/20' };
};

const lifecycleStyle = (lc = '') => {
  const l = lc.toLowerCase();
  if (l.includes('peak') || l.includes('viral'))   return { label: 'Peak 🔥',    cls: 'text-red-600 bg-red-50 border-red-200' };
  if (l.includes('rising') || l.includes('rise'))  return { label: 'Rising 📈',  cls: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (l.includes('emerging') || l.includes('new')) return { label: 'Emerging ✨', cls: 'text-primary bg-primary/5 border-primary/20' };
  if (l.includes('decay') || l.includes('falling'))return { label: 'Fading ↓',   cls: 'text-muted-foreground bg-muted border-border' };
  return { label: lc, cls: 'text-muted-foreground bg-muted border-border' };
};

function SongRow({ song, index }) {
  const platform = platformStyle(song.platform || song.source);
  const lifecycle = song.lifecycle ? lifecycleStyle(song.lifecycle) : null;
  const artist = song.artist || song.artists || song.primaryArtists || 'Unknown Artist';
  const title = song.title || song.name || song.song || 'Untitled';
  const plays = song.plays || song.playCount || song.streams;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.2 }}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors group"
    >
      {/* Album art placeholder */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center shrink-0 relative overflow-hidden">
        {song.image || song.albumArt ? (
          <img
            src={song.image || song.albumArt}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Music size={14} className="text-primary/60" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={12} className="text-white fill-white" />
        </div>
        {/* Platform dot */}
        <span className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ${platform.dot} border border-card`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm text-foreground leading-tight line-clamp-1">
          {title}
        </p>
        <p className="font-body text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {Array.isArray(artist) ? artist.join(', ') : artist}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold font-body border ${platform.badge}`}>
            {platform.label}
          </span>
          {lifecycle && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold font-body border ${lifecycle.cls}`}>
              {lifecycle.label}
            </span>
          )}
          {plays && (
            <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
              <TrendingUp size={9} />
              {typeof plays === 'number' ? plays.toLocaleString('en-IN') : plays}
            </span>
          )}
        </div>
      </div>

      {/* Duration */}
      {song.duration && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Clock size={10} />
          {song.duration}
        </div>
      )}
    </motion.div>
  );
}

export default function SongCard({ data }) {
  const [showAll, setShowAll] = useState(false);

  // Normalise: { songs: [...] } or raw array
  const rawSongs = Array.isArray(data)
    ? data
    : Array.isArray(data?.songs)
    ? data.songs
    : Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.trending)
    ? data.trending
    : [];

  const songs = showAll ? rawSongs.slice(0, 10) : rawSongs.slice(0, 5);

  if (!songs.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-3 w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Music size={14} className="text-green-600" />
          </div>
          <span className="font-heading text-sm text-foreground">Trending Songs</span>
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 text-[10px] font-bold font-body">
            {rawSongs.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Mic2 size={11} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-body">Live data</span>
        </div>
      </div>

      {/* Songs list */}
      <div className="px-1 py-1.5 space-y-0.5">
        {songs.map((s, i) => (
          <SongRow key={i} song={s} index={i} />
        ))}
      </div>

      {/* Show more */}
      {rawSongs.length > 5 && (
        <div className="px-4 py-2.5 border-t border-border">
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? '▲ Show less' : `▼ Show ${rawSongs.length - 5} more songs`}
          </button>
        </div>
      )}
    </motion.div>
  );
}
