/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

export default function VideoBackground() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0 bg-[#020305]"
      id="video-background-viewport"
    >
      {/* Background Video element */}
      <video
        id="hero-bg-video-element"
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-1000 ease-out ${
          videoLoaded ? 'opacity-80 scale-100' : 'opacity-0 scale-105'
        }`}
      >
        <source 
          src="https://res.cloudinary.com/dvqhu5xtr/video/upload/v1779969521/PixVerse_V6_Image_Text_720P_make_this_a_slow_t-ezremove_1_online-video-cutter.com_qgeytf.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark Vignette Overlay for premium visual styling & high content contrast */}
      <div 
        id="video-shading-mask"
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#020305] via-transparent to-[#020305] opacity-55 z-1" 
      />
      <div 
        id="video-radial-mask"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#020305_95%)] opacity-55 z-1" 
      />
    </div>
  );
}
