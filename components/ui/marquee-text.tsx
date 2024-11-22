// app/components/ui/marquee-text.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
  text: string;
  isCardHovered: boolean;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, isCardHovered }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isTextOverflowing = textRef.current.offsetWidth > containerRef.current.offsetWidth;
        setIsOverflowing(isTextOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  const shouldAnimate = isOverflowing;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden whitespace-nowrap"
    >
      <div
        className={`flex gap-4 ${shouldAnimate ? 'animate-marquee whitespace-nowrap' : ''}`}
      >
        <div ref={textRef} className="whitespace-nowrap min-w-fit">
          {text}
        </div>
        {shouldAnimate && (
          <div className="whitespace-nowrap min-w-fit">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};