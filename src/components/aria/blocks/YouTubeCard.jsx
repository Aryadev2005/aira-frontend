import React from "react";
import { motion } from "framer-motion";
import {
  Youtube,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

const formatNumber = (n) => {
  if (!n && n !== 0) return "—";
  const num =
    typeof n === "string" ? parseInt(n.replace(/,/g, ""), 10) : Number(n);
  if (isNaN(num)) return String(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
};

const engagementColor = (rate) => {
  if (rate >= 8) return "text-green-600 bg-green-500/10 border-green-500/20";
  if (rate >= 4) return "text-primary bg-primary/10 border-primary/20";
  if (rate >= 2) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
  return "text-muted-foreground bg-muted border-border";
};

const hookStrengthLabel = (rate) => {
  if (rate >= 8) return "🔥 Viral";
  if (rate >= 4) return "📈 Strong";
  if (rate >= 2) return "✅ Average";
  return "⚠️ Weak";
};

function StatBox({ icon: Icon, label, value, cls = "" }) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-muted/40 min-w-[64px] ${cls}`}
    >
      <Icon size={12} className="text-muted-foreground" />
      <span className="font-heading text-sm text-foreground leading-tight">
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground font-body">
        {label}
      </span>
    </div>
  );
}

function VideoCard({ video, index }) {
  const views = formatNumber(video.viewCount || video.views);
  const likes = formatNumber(video.likeCount || video.likes);
  const comments = formatNumber(video.commentCount || video.comments);
  const duration = video.duration || video.contentDetails?.duration || "";
  const title = video.title || video.snippet?.title || "YouTube Video";
  const channel = video.channelTitle || video.channel || "";
  const thumb =
    video.thumbnail ||
    video.snippet?.thumbnails?.medium?.url ||
    video.snippet?.thumbnails?.default?.url;
  const engRate = video.engagementRate || video.engagement_rate || 0;
  const url =
    video.url ||
    (video.videoId ? `https://youtube.com/watch?v=${video.videoId}` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="bg-background border border-border rounded-xl overflow-hidden"
    >
      {/* Thumbnail */}
      {thumb ? (
        <div className="relative aspect-video bg-muted">
          <img src={thumb} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-body rounded">
              {duration}
            </span>
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
              <Youtube size={18} className="text-white" />
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-muted/50 flex items-center justify-center">
          <Youtube size={28} className="text-red-500/40" />
        </div>
      )}

      <div className="p-3">
        {/* Title */}
        <p className="font-body font-semibold text-sm text-foreground leading-snug line-clamp-2 mb-1">
          {title}
        </p>
        {channel && (
          <p className="font-body text-xs text-muted-foreground mb-2">
            {channel}
          </p>
        )}

        {/* Stats row */}
        <div className="flex gap-2 flex-wrap mb-2">
          <StatBox icon={Eye} label="Views" value={views} />
          <StatBox icon={ThumbsUp} label="Likes" value={likes} />
          <StatBox icon={MessageSquare} label="Comments" value={comments} />
          {engRate > 0 && (
            <div
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border min-w-[64px] ${engagementColor(engRate)}`}
            >
              <TrendingUp size={12} />
              <span className="font-heading text-sm leading-tight">
                {Number(engRate).toFixed(1)}%
              </span>
              <span className="text-[10px] font-body">
                {hookStrengthLabel(engRate)}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            <Youtube size={12} />
            Watch on YouTube
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function ChannelCard({ channel }) {
  const subs = formatNumber(channel.subscriberCount || channel.subscribers);
  const videos = formatNumber(channel.videoCount || channel.videos);
  const views = formatNumber(channel.viewCount || channel.totalViews);
  const name =
    channel.title || channel.name || channel.channelTitle || "YouTube Channel";
  const thumb = channel.thumbnail || channel.profileImage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-background border border-border rounded-xl p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        {thumb ? (
          <img
            src={thumb}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <Youtube size={20} className="text-red-500" />
          </div>
        )}
        <div>
          <p className="font-body font-semibold text-sm text-foreground">
            {name}
          </p>
          {channel.country && (
            <p className="font-body text-xs text-muted-foreground">
              {channel.country}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <StatBox icon={TrendingUp} label="Subscribers" value={subs} />
        <StatBox icon={Eye} label="Total Views" value={views} />
        <StatBox icon={Youtube} label="Videos" value={videos} />
      </div>
    </motion.div>
  );
}

export default function YouTubeCard({ data }) {
  if (!data) return null;

  // Detect whether this is a video, channel, or search results
  const isChannel = !!(
    data.subscriberCount ||
    data.subscribers ||
    data.kind === "youtube#channel"
  );
  const isSearch =
    Array.isArray(data.items) ||
    Array.isArray(data.results) ||
    Array.isArray(data.videos);

  const videos = isSearch
    ? (data.items || data.results || data.videos || []).slice(0, 3)
    : isChannel
      ? []
      : [data];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-3 w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Youtube size={14} className="text-red-600" />
        </div>
        <span className="font-heading text-sm text-foreground">
          {isChannel
            ? "Channel Stats"
            : isSearch
              ? "YouTube Results"
              : "Video Stats"}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {isChannel && <ChannelCard channel={data} />}
        {!isChannel &&
          videos.map((v, i) => <VideoCard key={i} video={v} index={i} />)}
      </div>
    </motion.div>
  );
}
