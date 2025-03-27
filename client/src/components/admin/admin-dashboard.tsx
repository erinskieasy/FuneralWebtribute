import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ContentManager from "./content-manager";
import TributeManager from "./tribute-manager";
import { useQuery } from "@tanstack/react-query";
import { TributeItem } from "@/lib/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("content");
  
  const { data: tributes } = useQuery<TributeItem[]>({
    queryKey: ["/api/tributes"],
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
            Welcome, {user?.name}. Manage the Chris Murphey memorial site from this dashboard.
          </p>
        </div>
        
        {/* Dashboard Overview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
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
          </TabsList>
          
          <TabsContent value="content" className="mt-4">
            <ContentManager />
          </TabsContent>
          
          <TabsContent value="tributes" className="mt-4">
            <TributeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
