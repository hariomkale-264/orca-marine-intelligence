import React, { useRef, useEffect } from 'react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4';

interface MainAppBackgroundProps {
  children?: React.ReactNode;
}

export const MainAppBackground: React.FC<MainAppBackgroundProps> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay may be restricted in some browser contexts until user interaction
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-black select-none -z-10 pointer-events-none">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: '70% center' }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {children}
    </div>
  );
};
