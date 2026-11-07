'use client';

import Lottie from 'lottie-react';
import animation from '@/assets/landing-illustration.json';

export default function LandingArt() {
  return (
    <Lottie
      animationData={animation}
      loop
      className="mx-auto h-80 w-full max-w-md md:h-[28rem]"
      aria-label="A house agreement being prepared"
    />
  );
}
