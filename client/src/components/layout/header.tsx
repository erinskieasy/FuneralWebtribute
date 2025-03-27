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

interface HeaderProps {
  minimal?: boolean;
}

export default function Header({ minimal = false }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isLoggedIn, user, isAdmin, logoutMutation } = useAuth();
  const [location] = useLocation();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  const backgroundImage = settings?.backgroundImage || DEFAULT_BACKGROUND_IMAGE;
  const tributeImage = settings?.tributeImage || DEFAULT_TRIBUTE_IMAGE;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      logoutMutation.mutate();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
    { name: "Tributes", path: "/#tributes" },
    { name: "Funeral Program", path: "/program" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.includes(path);
  };

  return (
    <>
      <header className={`${minimal ? "relative bg-primary" : "relative h-screen max-h-[800px] overflow-hidden"}`}>
        {!minimal && (
          <div className="absolute inset-0 z-0">
            <img 
              src={backgroundImage} 
              alt="Memorial background" 
              className="object-cover w-full h-full"
              onError={(e) => {
                console.error('Failed to load image:', backgroundImage);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-primary bg-opacity-40"></div>
          </div>
        )}

        <nav className={`relative z-10 px-6 py-4 ${isScrolled ? "sticky top-0 bg-primary shadow-md transition-all duration-300" : ""}`}>
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-white text-xl font-heading font-bold">
              {SITE_TITLE}
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`text-white hover:text-secondary transition ${isActive(link.path) ? "border-b-2 border-secondary" : ""}`}
                >
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`text-white hover:text-secondary transition ${isActive("/admin") ? "border-b-2 border-secondary" : ""}`}
                >
                  Admin
                </Link>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleAuthAction}
                variant="secondary" 
                className="text-white"
              >
                {isLoggedIn ? "Sign Out" : "Sign In"}
              </Button>
              
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute z-20 w-full bg-primary py-4 shadow-lg">
            <div className="container mx-auto px-6 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`text-white hover:text-secondary transition py-2 ${isActive(link.path) ? "border-l-4 border-secondary pl-2" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`text-white hover:text-secondary transition py-2 ${isActive("/admin") ? "border-l-4 border-secondary pl-2" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}

        {!minimal && (
          <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center px-6 text-center">
            <div className="mb-8 w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <img 
                src={tributeImage} 
                alt="Chris Murphey" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-white mb-4">Chris Murphey</h1>
            <p className="text-xl text-white mb-8">{LIFE_DATES}</p>
            <p className="text-lg text-white max-w-2xl mb-12">{TRIBUTE_HEADLINE}</p>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
