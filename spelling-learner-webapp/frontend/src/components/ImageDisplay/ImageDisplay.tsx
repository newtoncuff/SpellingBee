import React from 'react';
import './ImageDisplay.css';

/**
 * ImageDisplay component shows the image related to the current word.
 * 
 * @param imageUrl - URL of the image to display
 * @param altText - Alternative text for accessibility
 */
interface ImageDisplayProps {
  imageUrl: string;
  altText: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imageUrl,
  altText
}) => {
  console.log('DEBUG: ImageDisplay received imageUrl:', imageUrl);
  
  return (
    <div className="image-display">
      <img
        src={imageUrl}
        alt={altText}
        className="word-image"
        onError={(e) => console.log('DEBUG: Image failed to load:', imageUrl)}
        onLoad={() => console.log('DEBUG: Image loaded successfully:', imageUrl)}
      />
    </div>
  );
};

export default ImageDisplay;