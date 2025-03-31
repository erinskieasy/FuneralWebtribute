
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import AuthModal from "@/components/auth/auth-modal";
import { SITE_TITLE } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";
import { DEFAULT_BACKGROUND_IMAGE, DEFAULT_TRIBUTE_IMAGE, LIFE_DATES, TRIBUTE_HEADLINE } from "@/lib/constants";

// Interface defining the optional 'minimal' prop for the header
interface HeaderProps {
  minimal?: boolean; // When true, renders a simplified version of the header
}

export default function Header({ minimal = false }: HeaderProps) {
  // State management for UI interactions
  const [isScrolled, setIsScrolled] = useState(false);        // Tracks scroll position for header styling
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  // Controls mobile menu visibility
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);    // Controls auth modal visibility
  
  // Hook for authentication state and user data
  const { isLoggedIn, user, isAdmin, logoutMutation } = useAuth();
  
  // Current route location using wouter
  const [location] = useLocation();

  // Fetch site settings using React Query
  // This includes background and tribute images
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  // Use settings data or fall back to defaults
  const backgroundImage = settings?.backgroundImage || DEFAULT_BACKGROUND_IMAGE;
  const tributeImage = settings?.tributeImage || DEFAULT_TRIBUTE_IMAGE;
  const siteTitle = settings?.siteTitle || SITE_TITLE;
  const lifeDates = settings?.lifeDates || LIFE_DATES;
  const tributeHeadline = settings?.tributeHeadline || TRIBUTE_HEADLINE;
  
  // Log image paths for debugging
  useEffect(() => {
    if (settings) {
      console.log('Background Image Path:', backgroundImage);
      console.log('Background Image URL:', backgroundImage.startsWith('/uploads') ? `${window.location.origin}${backgroundImage}` : backgroundImage);
      console.log('Tribute Image Path:', tributeImage);
    }
  }, [settings, backgroundImage, tributeImage]);

  // Add scroll event listener to track page scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10); // Add background to header after scrolling 10px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll); // Cleanup
  }, []);

  // Handle authentication actions (login/logout)
  const handleAuthAction = () => {
    if (isLoggedIn) {
      logoutMutation.mutate();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Navigation links configuration
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
    { name: "Tributes", path: "/#tributes" },
    { name: "Funeral Program", path: "/program" },
  ];

  // Helper function to determine if a nav link is active
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.includes(path);
  };

  return (
    <>
      {/* Main header container with conditional full-screen height */}
      <header className={`${minimal ? "relative bg-primary" : "relative min-h-[750px] h-[92vh] max-h-[1000px] overflow-hidden"}`}>
        {/* Background image section - only shown in full header mode */}
        {!minimal && (
          <div className="absolute inset-0 z-0">
            <img 
              src={backgroundImage.startsWith('/uploads') ? `${window.location.origin}${backgroundImage}` : backgroundImage} 
              alt="Memorial background" 
              className="object-cover w-full h-full" 
              onError={(e) => {
                console.error('Failed to load image:', backgroundImage);
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Overlay removed as requested */}
          </div>
        )}

        {/* Navigation bar */}
        <nav className={`relative z-10 px-6 py-4 ${isScrolled ? "sticky top-0 bg-primary shadow-md transition-all duration-300" : ""}`}>
          <div className="container mx-auto flex justify-between items-center">
            {/* Site title/logo */}
            <Link href="/" className="text-white text-xl font-heading font-bold">
              {siteTitle}
            </Link>
            
            {/* Desktop navigation links */}
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`text-white hover:text-memorial-gray transition ${isActive(link.path) ? "border-b-2 border-memorial-blue" : ""}`}
                >
                  {link.name}
                </Link>
              ))}
              {/* Admin link - only shown to admin users */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`text-white hover:text-memorial-gray transition ${isActive("/admin") ? "border-b-2 border-memorial-blue" : ""}`}
                >
                  Admin
                </Link>
              )}
            </div>
            
            {/* Auth button and mobile menu toggle */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleAuthAction}
                variant="secondary" 
                className="text-white"
              >
                {isLoggedIn ? "Sign Out" : "Sign In"}
              </Button>
              
              {/* Mobile menu toggle button */}
              <Button
                variant="ghost"
                className="p-2 text-white md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute z-20 w-full bg-primary py-4 shadow-lg">
            <div className="container mx-auto px-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`text-white hover:text-memorial-gray transition py-2 ${isActive(link.path) ? "border-l-4 border-memorial-blue pl-2" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {/* Admin link in mobile menu */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`text-white hover:text-memorial-gray transition py-2 ${isActive("/admin") ? "border-l-4 border-memorial-blue pl-2" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Main content area - only shown in full header mode */}
        {!minimal && (
          <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center px-6 text-center">
            {/* Tribute image */}
            <div className="mb-8 w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={tributeImage.startsWith('/uploads') ? `${window.location.origin}${tributeImage}` : tributeImage} 
                alt="Chris Murphey" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Tribute information */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white mb-4">{siteTitle.replace(" Memorial", "")}</h1>
            <p className="text-xl text-white mb-8">{lifeDates}</p>
            <p className="text-lg text-white max-w-2xl mb-10">{tributeHeadline}</p>
            {/* Call-to-action buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="#tributes">
                <Button 
                  variant="default"
                  className="bg-white text-primary hover:bg-neutral-200 font-semibold"
                  size="lg"
                >
                  Share a Memory
                </Button>
              </Link>
              <Link href="#program">
                <Button
                  variant="secondary"
                  className="text-white font-semibold"
                  size="lg"
                >
                  View Funeral Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Authentication modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
