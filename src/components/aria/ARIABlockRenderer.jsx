import React from "react";
import { motion } from "framer-motion";
import TrendCard from "./blocks/TrendCard";
import SongCard from "./blocks/SongCard";
import ProfileCard from "./blocks/ProfileCard";
// @ts-ignore - IdeaList is a JS component without type declarations
import IdeaList from "./blocks/IdeaList";
import YouTubeCard from "./blocks/YouTubeCard";

// Maps tool name → React component
const BLOCK_MAP = {
  get_db_live_trends: TrendCard,
  find_similar_trends: TrendCard,
  get_hybrid_context: TrendCard,
  get_db_trending_songs: SongCard,
  get_user_profile: ProfileCard,
  get_user_content_history: ProfileCard,
  viral_ideas_engine: IdeaList,
  get_youtube_video_stats: YouTubeCard,
  get_youtube_channel_stats: YouTubeCard,
  get_youtube_search: YouTubeCard,
};

/**
 * Renders a generative UI card based on the tool that fired.
 * Called from AriaBrain.jsx's message renderer when a message has blocks.
 *
 * @param {*} blockType - tool name (e.g. "get_db_live_trends")
 * @param {*} payload   - the parsed tool result from the backend
 * @param {*} index     - position in the blocks array (for stagger)
 */
// @ts-ignore - JSDoc type annotations for JavaScript file
export default function ARIABlockRenderer({ blockType, payload, index = 0 }) {
  const Component = BLOCK_MAP[blockType];
  if (!Component || !payload) return null;

  return (
    <motion.div
      key={blockType}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 24,
        delay: index * 0.05,
      }}
      className="w-full"
    >
      <Component data={payload} />
    </motion.div>
  );
}
