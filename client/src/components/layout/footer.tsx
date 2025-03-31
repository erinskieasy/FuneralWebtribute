import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  const { isAdmin } = useAuth();

  const footerMessage = settings?.footerMessage || "\"As long as we live, they too will live, for they are now a part of us, as we remember them.\""; 
  const contactEmail = settings?.contactEmail || "";
  const contactPhone = settings?.contactPhone || "";
  
  // Create an array of resources from the settings
  const resources = [];
  
  if (settings?.resourceName1 && settings?.resourceLink1) {
    resources.push({
      name: settings.resourceName1,
      link: settings.resourceLink1
    });
  }
  
  if (settings?.resourceName2 && settings?.resourceLink2) {
    resources.push({
      name: settings.resourceName2,
      link: settings.resourceLink2
    });
  }
  
  if (settings?.resourceName3 && settings?.resourceLink3) {
    resources.push({
      name: settings.resourceName3,
      link: settings.resourceLink3
    });
  }

  return (
    <footer className="bg-primary text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Contact Information</h3>
            <p className="mb-2">To get a webiste like this for your loved ones:</p>
            <p className="mb-4">
              <a 
                href={`mailto:${contactEmail}`}
                className="hover:text-secondary transition"
              >
                {contactEmail}
              </a>
            </p>
            <p className="mb-2">For other inquiries:</p>
            <p>
              <a 
                href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}
                className="hover:text-secondary transition"
              >
                {contactPhone}
              </a>
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Additional Resources</h3>
            <ul className="space-y-2">
              {resources.map((resource, index) => (
                <li key={index}>
                  <a href={resource.link} className="hover:text-secondary transition">
                    {resource.name}
                  </a>
                </li>
              ))}
              {resources.length === 0 && (
                <li className="text-white text-opacity-70">No resources available</li>
              )}
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
            © {new Date().getFullYear()} {settings?.siteTitle || 'Memorial'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
