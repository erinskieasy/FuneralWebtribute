import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import GalleryPreview from "@/components/gallery/gallery-preview";
import FuneralService from "@/components/funeral/funeral-service";
import TributeWall from "@/components/tributes/tribute-wall";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";

export default function HomePage() {
  // Get site settings
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  
  // Set page title based on site settings
  useEffect(() => {
    if (settings?.siteTitle) {
      document.title = `${settings.siteTitle} - Digital Memorial`;
    } else {
      document.title = "Remembering Chris Murphey - Digital Memorial";
    }
  }, [settings?.siteTitle]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow mt-8">
        <GalleryPreview />
        <FuneralService />
        <TributeWall />
      </main>
      
      <Footer />
    </div>
  );
}
