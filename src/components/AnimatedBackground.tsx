import React, { useRef, useState, useEffect } from 'react';
import { ShootingStar } from './ShootingStar.tsx';

interface AnimatedBackgroundProps {
  children?: React.ReactNode;
}

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4';
const LOCAL_VIDEO_URL = '/Marine_intelligence_platform_animation.mp4';

// Pre-computed stars for consistent subtle twinkling effect
const BACKGROUND_STARS = [
  { top: '8%', left: '12%', size: '1.5px', delay: '0s', opacity: 0.6 },
  { top: '15%', left: '85%', size: '2px', delay: '1.2s', opacity: 0.8 },
  { top: '24%', left: '38%', size: '1px', delay: '2.4s', opacity: 0.5 },
  { top: '32%', left: '72%', size: '2px', delay: '0.8s', opacity: 0.7 },
  { top: '45%', left: '9%', size: '1.5px', delay: '3.1s', opacity: 0.6 },
  { top: '58%', left: '92%', size: '1px', delay: '1.7s', opacity: 0.4 },
  { top: '70%', left: '18%', size: '2px', delay: '2.9s', opacity: 0.7 },
  { top: '82%', left: '64%', size: '1.5px', delay: '0.4s', opacity: 0.5 },
  { top: '88%', left: '30%', size: '1px', delay: '2.1s', opacity: 0.4 },
  { top: '92%', left: '80%', size: '2px', delay: '1.5s', opacity: 0.6 },
  { top: '6%', left: '60%', size: '1.5px', delay: '3.6s', opacity: 0.5 },
  { top: '65%', left: '84%', size: '1.2px', delay: '4.2s', opacity: 0.6 },
];

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay may be restricted in some iframe contexts until user interaction
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#020817] select-none">
      {/* Deep Space / Ocean fallback gradient behind video */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#031329] to-[#010915]" />

      {/* Earth from Space cinematic rotating video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-90' : 'opacity-40'
        }`}
      >
        <source src={LOCAL_VIDEO_URL} type="video/mp4" />
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark Overlay as requested: absolute inset-0 bg-black/40 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Atmospheric oceanic teal/cyan and space depth gradients */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#020817]/60 to-[#010511]/90"
        style={{ mixBlendMode: 'multiply' }}
      />

      <div
        className="atmospheric-glow absolute -top-40 left-1/4 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="atmospheric-glow absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none"
        style={{ animationDelay: '-7s' }}
        aria-hidden="true"
      />

      {/* Very subtle stars layer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {BACKGROUND_STARS.map((star, idx) => (
          <div
            key={idx}
            className="star-twinkle absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: star.delay,
              boxShadow: `0 0 4px rgba(255, 255, 255, ${star.opacity})`,
            }}
          />
        ))}
      </div>

      {/* Continuous seamless Shooting Star / Meteor */}
      <ShootingStar />

      {/* Telemetry Grid Overlay (ultra-subtle oceanic coordinates mesh) */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top subtle beacon line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {children}
    </div>
  );
};
