import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { GalleryImage } from "@/lib/types";

interface ImageLightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  useEffect(() => {
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = "hidden";

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, onClose]);

  const goToPrevious = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    onIndexChange(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % images.length;
    onIndexChange(newIndex);
  };

  const currentImage = images[currentIndex];

  if (!currentImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate-fade-in">
      <button 
        className="absolute top-4 right-4 text-white text-4xl z-50 hover:text-gray-300"
        onClick={onClose}
      >
        <X size={32} />
      </button>
      
      <div className="flex justify-between items-center w-full h-full px-4">
        <button 
          className="text-white text-4xl z-40 hover:text-gray-300 p-4"
          onClick={goToPrevious}
        >
          <ChevronLeft size={48} />
        </button>
        
        <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center">
          <img 
            src={currentImage.imageUrl} 
            alt={currentImage.caption || "Gallery image"} 
            className="max-w-full max-h-full object-contain"
          />
          {currentImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 text-white text-center">
              {currentImage.caption}
            </div>
          )}
        </div>
        
        <button 
          className="text-white text-4xl z-40 hover:text-gray-300 p-4"
          onClick={goToNext}
        >
          <ChevronRight size={48} />
        </button>
      </div>
    </div>
  );
}
