import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";
import { DEFAULT_FOOTER_MESSAGE } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  const { isAdmin } = useAuth();

  const footerMessage = settings?.footerMessage || DEFAULT_FOOTER_MESSAGE;

  return (
    <footer className="bg-primary text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Contact Information</h3>
            <p className="mb-2">For questions about the memorial service:</p>
            <p className="mb-4">
              <a 
                href="mailto:memorial@example.com" 
                className="hover:text-secondary transition"
              >
                memorial@example.com
              </a>
            </p>
            <p className="mb-2">For other inquiries:</p>
            <p>
              <a 
                href="tel:+1234567890" 
                className="hover:text-secondary transition"
              >
                (123) 456-7890
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Additional Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-secondary transition">
                  Grief Support Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition">
                  Ocean Conservation Society
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-secondary transition">
                  Memorial Fund
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">In Loving Memory</h3>
            <p className="italic">
              {footerMessage}
            </p>
            {isAdmin && (
              <div className="mt-6">
                <Link href="/admin" className="text-sm hover:text-secondary transition">
                  Admin Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-20 mt-8 pt-8 text-center">
          <p className="text-sm text-white text-opacity-70">
            © {new Date().getFullYear()} Chris Murphey Memorial. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
