'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import { OverlayProtection } from './overlay-protection';

interface VideoPlayerProps {
  youtubeId: string;
  title: string;
  primaryColor?: string;
  onProgress?: (position: number) => void;
  onComplete?: () => void;
  initialPosition?: number;
}

/**
 * Masked YouTube video player built on Video.js with the videojs-youtube plugin.
 *
 * FR-024: Custom Video.js player with videojs-youtube plugin
 * FR-025: Completely masks YouTube UI (logo, title, suggestions, watermark)
 * FR-026: Overlay protection layer (delegated to OverlayProtection component)
 * FR-027: Custom controls styled with platform primary color
 * FR-028: Quality selection support (auto + manual)
 * FR-029: Resume playback from last known position
 * FR-030: Mobile-friendly with touch controls and native fullscreen
 */
export function VideoPlayer({
  youtubeId,
  title,
  primaryColor = '#6366F1',
  onProgress,
  onComplete,
  initialPosition = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const completeFiredRef = useRef(false);

  const handleProgress = useCallback(
    (position: number) => {
      onProgress?.(position);
    },
    [onProgress],
  );

  const handleComplete = useCallback(() => {
    if (!completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!videoRef.current) return;

    // Reset completion flag on video change
    completeFiredRef.current = false;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered', 'vjs-hmembers');
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      techOrder: ['youtube'],
      sources: [
        {
          type: 'video/youtube',
          src: `https://www.youtube.com/watch?v=${youtubeId}`,
        },
      ],
      youtube: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        disablekb: 0,
        controls: 0,
        fs: 0,
        playsinline: 1,
      },
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'progressControl',
          'playbackRateMenuButton',
          'qualitySelector',
          'fullscreenToggle',
        ],
      },
    });

    player.ready(() => {
      setIsReady(true);
      if (initialPosition > 0) {
        player.currentTime(initialPosition);
      }
    });

    // Track progress every 10 seconds
    let lastReportedTime = 0;
    player.on('timeupdate', () => {
      const currentTime = Math.floor(player.currentTime() ?? 0);
      if (currentTime - lastReportedTime >= 10) {
        lastReportedTime = currentTime;
        handleProgress(currentTime);
      }
    });

    // Mark as complete when 90% watched
    player.on('timeupdate', () => {
      const duration = player.duration() ?? 0;
      const current = player.currentTime() ?? 0;
      if (duration > 0 && current / duration >= 0.9) {
        handleComplete();
      }
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [youtubeId, initialPosition, handleProgress, handleComplete]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black group">
      {/* Video container */}
      <div ref={videoRef} className="w-full h-full" />

      {/* Overlay protection — blocks right-click and hides YouTube UI */}
      <OverlayProtection />

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${primaryColor}40`, borderTopColor: primaryColor }}
          />
        </div>
      )}

      {/* Custom CSS to hide YouTube elements and apply branding */}
      <style jsx global>{`
        .vjs-hmembers .vjs-youtube .ytp-chrome-top,
        .vjs-hmembers .vjs-youtube .ytp-show-cards-title,
        .vjs-hmembers .vjs-youtube .ytp-watermark,
        .vjs-hmembers .vjs-youtube .ytp-youtube-button,
        .vjs-hmembers .vjs-youtube .ytp-impression-link,
        .vjs-hmembers .vjs-youtube .ytp-pause-overlay,
        .vjs-hmembers .vjs-youtube .ytp-endscreen-content,
        .vjs-hmembers .vjs-youtube .ytp-ce-element,
        .vjs-hmembers .vjs-youtube .ytp-title,
        .vjs-hmembers .vjs-youtube .ytp-share-button-visible,
        .vjs-hmembers .vjs-youtube .ytp-menuitem[aria-label="Watch on YouTube"],
        .vjs-hmembers .vjs-youtube .ytp-chrome-bottom {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .vjs-hmembers .vjs-control-bar {
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.85)) !important;
          height: 48px !important;
          padding: 0 8px !important;
        }

        .vjs-hmembers .vjs-play-progress,
        .vjs-hmembers .vjs-volume-level {
          background-color: ${primaryColor} !important;
        }

        .vjs-hmembers .vjs-load-progress {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .vjs-hmembers .vjs-big-play-button {
          background-color: ${primaryColor} !important;
          border: none !important;
          border-radius: 50% !important;
          width: 70px !important;
          height: 70px !important;
          line-height: 70px !important;
          font-size: 2.5rem !important;
          transition: transform 0.2s ease, opacity 0.2s ease !important;
        }

        .vjs-hmembers .vjs-big-play-button:hover {
          transform: scale(1.1) !important;
          background-color: ${primaryColor} !important;
          opacity: 0.9 !important;
        }

        .vjs-hmembers .vjs-slider:focus {
          box-shadow: 0 0 0 2px ${primaryColor}80 !important;
        }

        .vjs-hmembers .vjs-playback-rate .vjs-playback-rate-value {
          font-size: 1rem !important;
          line-height: 48px !important;
        }

        /* Block right-click on entire player area */
        .vjs-hmembers {
          -webkit-user-select: none;
          user-select: none;
        }

        /* Mobile touch-friendly controls */
        @media (max-width: 640px) {
          .vjs-hmembers .vjs-control-bar {
            height: 40px !important;
          }

          .vjs-hmembers .vjs-big-play-button {
            width: 56px !important;
            height: 56px !important;
            line-height: 56px !important;
            font-size: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
