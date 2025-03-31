import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { GalleryImage, SiteSettings } from "@/lib/types";
import ImageLightbox from "@/components/gallery/image-lightbox";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryPage() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Fetch settings
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  
  // Set page title
  useEffect(() => {
    document.title = `Gallery of Memories - ${settings?.siteTitle || "Memorial"}`;
  }, [settings]);
  
  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });
  
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header minimal />
      
      <main className="flex-grow py-16 px-6 bg-white">
        <div className="container mx-auto">
          <h1 className="text-4xl font-heading font-bold text-center mb-12">Gallery of Memories</h1>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : !images || images.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No gallery images available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image, index) => (
                <div 
                  key={image.id}
                  className="overflow-hidden rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleImageClick(index)}
                >
                  <div className="aspect-square">
                    <img 
                      src={image.imageUrl} 
                      alt={image.caption || `Memory ${index + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  </div>
                  {image.caption && (
                    <div className="p-3 bg-white">
                      <p className="text-sm text-gray-700">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {isLightboxOpen && images && (
        <ImageLightbox
          images={images}
          currentIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </div>
  );
}
