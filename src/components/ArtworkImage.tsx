import React, { useState } from 'react';

interface ArtworkImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio,
  ...props
}) => {
  const [error, setError] = useState(false);

  // Artistic abstract gradient placeholder if image fails
  const fallbackSrc = "https://picsum.photos/seed/artflow/600/600";

  return (
    <img
      src={error ? fallbackSrc : src}
      alt={alt}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      className={`object-cover ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      {...props}
    />
  );
};
