import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { GalleryImage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import ImageLightbox from "./image-lightbox";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryPreview() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  if (isLoading) {
    return <GalleryPreviewSkeleton />;
  }

  if (!images || images.length === 0) {
    return (
      <section id="gallery" className="py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Gallery of Memories</h2>
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No gallery images available.</p>
          </div>
        </div>
      </section>
    );
  }

  // Sort images by order
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const featuredImages = sortedImages.slice(0, 7);

  return (
    <section id="gallery" className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">Gallery of Memories</h2>
        
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Main Image */}
          <div 
            className="md:col-span-2 overflow-hidden rounded-lg shadow-md h-80 cursor-pointer"
            onClick={() => handleImageClick(0)}
          >
            <img 
              src={featuredImages[0]?.imageUrl} 
              alt={featuredImages[0]?.caption || "Featured memory"} 
              className="w-full h-full object-cover hover:scale-105 transition duration-500"
            />
          </div>

          <div className="flex flex-col gap-6">
            {featuredImages.slice(1, 3).map((image, index) => (
              <div 
                key={image.id}
                className="overflow-hidden rounded-lg shadow-md h-[152px] cursor-pointer"
                onClick={() => handleImageClick(index + 1)}
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.caption || `Memory ${index + 2}`} 
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredImages.slice(3).map((image, index) => (
            <div 
              key={image.id}
              className="overflow-hidden rounded-lg shadow-md h-40 cursor-pointer"
              onClick={() => handleImageClick(index + 3)}
            >
              <img 
                src={image.imageUrl} 
                alt={image.caption || `Memory ${index + 4}`} 
                className="w-full h-full object-cover hover:scale-105 transition duration-500"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/gallery">
            <Button
              variant="link"
              className="text-primary font-semibold hover:text-secondary"
            >
              View Full Gallery
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {isLightboxOpen && (
        <ImageLightbox
          images={featuredImages}
          currentIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </section>
  );
}

function GalleryPreviewSkeleton() {
  return (
    <section id="gallery" className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">Gallery of Memories</h2>
        
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-80 rounded-lg" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-[152px] rounded-lg" />
            <Skeleton className="h-[152px] rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>

        <div className="text-center mt-12">
          <Skeleton className="h-10 w-40 mx-auto rounded-md" />
        </div>
      </div>
    </section>
  );
}
