import { useState } from 'react';
import { Shirt } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-[#F2ECE1] via-[#E8DFD1] to-[#DDD0BC] flex flex-col items-center justify-center p-4 text-center text-[#7D6959] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Shirt className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium line-clamp-2 max-w-[16ch] text-[#5C4A3D]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
