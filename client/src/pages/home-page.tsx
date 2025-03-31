import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import GalleryPreview from "@/components/gallery/gallery-preview";
import FuneralService from "@/components/funeral/funeral-service";
import TributeWall from "@/components/tributes/tribute-wall";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";

export default function HomePage() {
  // Set page title
  useEffect(() => {
    document.title = "Remembering Chris Murphey - Digital Memorial";
  }, []);
  
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
