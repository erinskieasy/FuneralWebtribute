import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteSettings } from "@/lib/types";
import { 
  DEFAULT_FOOTER_MESSAGE, 
  DEFAULT_CONTACT_EMAIL, 
  DEFAULT_CONTACT_PHONE,
  DEFAULT_RESOURCE_NAME_1,
  DEFAULT_RESOURCE_LINK_1,
  DEFAULT_RESOURCE_NAME_2,
  DEFAULT_RESOURCE_LINK_2,
  DEFAULT_RESOURCE_NAME_3,
  DEFAULT_RESOURCE_LINK_3
} from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  const { isAdmin } = useAuth();

  const footerMessage = settings?.footerMessage || DEFAULT_FOOTER_MESSAGE;
  const contactEmail = settings?.contactEmail || DEFAULT_CONTACT_EMAIL;
  const contactPhone = settings?.contactPhone || DEFAULT_CONTACT_PHONE;
  const resourceName1 = settings?.resourceName1 || DEFAULT_RESOURCE_NAME_1;
  const resourceLink1 = settings?.resourceLink1 || DEFAULT_RESOURCE_LINK_1;
  const resourceName2 = settings?.resourceName2 || DEFAULT_RESOURCE_NAME_2;
  const resourceLink2 = settings?.resourceLink2 || DEFAULT_RESOURCE_LINK_2;
  const resourceName3 = settings?.resourceName3 || DEFAULT_RESOURCE_NAME_3;
  const resourceLink3 = settings?.resourceLink3 || DEFAULT_RESOURCE_LINK_3;

  return (
    <footer className="bg-primary text-white py-12 px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">Contact Information</h3>
            <p className="mb-2">For questions about the memorial service:</p>
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
              {resourceName1 && resourceLink1 && (
                <li>
                  <a href={resourceLink1} className="hover:text-secondary transition">
                    {resourceName1}
                  </a>
                </li>
              )}
              {resourceName2 && resourceLink2 && (
                <li>
                  <a href={resourceLink2} className="hover:text-secondary transition">
                    {resourceName2}
                  </a>
                </li>
              )}
              {resourceName3 && resourceLink3 && (
                <li>
                  <a href={resourceLink3} className="hover:text-secondary transition">
                    {resourceName3}
                  </a>
                </li>
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
            © {new Date().getFullYear()} Chris Murphey Memorial. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
