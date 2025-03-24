import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { isLoggedIn, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Set page title
  useEffect(() => {
    document.title = "Admin Dashboard - Chris Murphey Memorial";
  }, []);
  
  // Redirect non-admin users
  useEffect(() => {
    if (isLoggedIn && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges to access this page.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isLoggedIn, isAdmin, setLocation, toast]);
  
  if (!isLoggedIn || !isAdmin) {
    return null; // Protected route component will handle redirection
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header minimal />
      
      <main className="flex-grow bg-neutral-100">
        <AdminDashboard />
      </main>
      
      <Footer />
    </div>
  );
}
