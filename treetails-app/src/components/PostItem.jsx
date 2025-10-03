import React, { useState, useEffect, useMemo } from "react";
import "../pages/pages.css";

const PostItem = ({ post }) => {
  const { title, content, author, imageUrls, imageUrl } = post;
  const images = useMemo(() => imageUrls || (imageUrl ? [imageUrl] : []), [imageUrls, imageUrl]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (playing && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 2000); // speed (ms)
    }
    return () => clearInterval(interval);
  }, [playing, images]);

  const handleTap = () => {
    setPlaying(prev => !prev); // toggle play/pause on tap
  };

  return (
    <div className="post-item">
      {images.length > 0 && (
        <div className="hover-image-wrapper" onClick={handleTap}>
          <img
            src={images[currentIndex]}
            alt={title}
            className="hover-image-cycle fade-slide"
          />
        </div>
      )}

      <h4>{title}</h4>
      <p>{content}</p>
      <small>Posted by: {author}</small>
    </div>
  );
};

export default PostItem;
