import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContentManager from "./content-manager";
import TributeManager from "./tribute-manager";
import GalleryManager from "./gallery-manager";
import UserManager from "./user-manager";
import { useQuery } from "@tanstack/react-query";
import { TributeItem, GalleryImage, SiteSettings } from "@/lib/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("content");
  
  const { data: tributes } = useQuery<TributeItem[]>({
    queryKey: ["/api/tributes"],
  });
  
  const { data: images } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });
  
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  
  // Count of tributes
  const tributeCount = Array.isArray(tributes) ? tributes.length : 0;
  
  // Count of candles
  const candleCount = Array.isArray(tributes) 
    ? tributes.reduce((sum, tribute) => sum + (tribute.candleCount || 0), 0) 
    : 0;
  
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome, {user?.name}. Manage the {settings?.siteTitle || 'Memorial'} site from this dashboard.
          </p>
        </div>
        
        {/* Dashboard Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tributes</CardTitle>
              <CardDescription>Total shared memories</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tributeCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Candles</CardTitle>
              <CardDescription>Digital candles lit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{candleCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Gallery</CardTitle>
              <CardDescription>Images in collection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{Array.isArray(images) ? images.length : 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Last Updated</CardTitle>
              <CardDescription>Latest site changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-md">{new Date().toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="content">Content Management</TabsTrigger>
            <TabsTrigger value="tributes">Tribute Management</TabsTrigger>
            <TabsTrigger value="gallery">Gallery Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-4">
            <ContentManager />
          </TabsContent>
          
          <TabsContent value="tributes" className="mt-4">
            <TributeManager />
          </TabsContent>
          
          <TabsContent value="gallery" className="mt-4">
            <GalleryManager />
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <UserManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
