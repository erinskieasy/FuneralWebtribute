import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SiteSettings, FuneralProgram } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";

export default function ContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Fetch settings
  const { 
    data: settings,
    isLoading: isLoadingSettings
  } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  
  // Fetch funeral program
  const { 
    data: funeralProgram,
    isLoading: isLoadingProgram 
  } = useQuery<FuneralProgram>({
    queryKey: ["/api/funeral-program"],
  });
  
  // State for settings form
  const [backgroundImage, setBackgroundImage] = useState(settings?.backgroundImage || "");
  const [tributeImage, setTributeImage] = useState(settings?.tributeImage || "");
  const [footerMessage, setFooterMessage] = useState(settings?.footerMessage || "");
  
  // State for funeral program form
  const [programDate, setProgramDate] = useState(funeralProgram?.date || "");
  const [programTime, setProgramTime] = useState(funeralProgram?.time || "");
  const [programLocation, setProgramLocation] = useState(funeralProgram?.location || "");
  const [programAddress, setProgramAddress] = useState(funeralProgram?.address || "");
  const [programStreamLink, setProgramStreamLink] = useState(funeralProgram?.streamLink || "");
  const [programPdfUrl, setProgramPdfUrl] = useState(funeralProgram?.programPdfUrl || "");
  
  // Update settings when data is loaded
  useState(() => {
    if (settings) {
      setBackgroundImage(settings.backgroundImage || "");
      setTributeImage(settings.tributeImage || "");
      setFooterMessage(settings.footerMessage || "");
    }
    
    if (funeralProgram) {
      setProgramDate(funeralProgram.date || "");
      setProgramTime(funeralProgram.time || "");
      setProgramLocation(funeralProgram.location || "");
      setProgramAddress(funeralProgram.address || "");
      setProgramStreamLink(funeralProgram.streamLink || "");
      setProgramPdfUrl(funeralProgram.programPdfUrl || "");
    }
  }, [settings, funeralProgram]);
  
  // Settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", `/api/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Funeral program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async (programData: Partial<FuneralProgram>) => {
      const res = await apiRequest("PUT", "/api/funeral-program", programData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/funeral-program"] });
      toast({
        title: "Funeral program updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update funeral program",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSaveSettings = () => {
    // Update background image
    if (backgroundImage !== settings?.backgroundImage) {
      updateSettingMutation.mutate({ key: "backgroundImage", value: backgroundImage });
    }
    
    // Update tribute image
    if (tributeImage !== settings?.tributeImage) {
      updateSettingMutation.mutate({ key: "tributeImage", value: tributeImage });
    }
    
    // Update footer message
    if (footerMessage !== settings?.footerMessage) {
      updateSettingMutation.mutate({ key: "footerMessage", value: footerMessage });
    }
  };
  
  const handleSaveFuneralProgram = () => {
    const programData = {
      date: programDate,
      time: programTime,
      location: programLocation,
      address: programAddress,
      streamLink: programStreamLink,
      programPdfUrl: programPdfUrl,
    };
    
    updateProgramMutation.mutate(programData);
  };
  
  const isUpdatingSettings = updateSettingMutation.isPending;
  const isUpdatingProgram = updateProgramMutation.isPending;
  
  if (isLoadingSettings || isLoadingProgram) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="funeral">Funeral Program</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Customize the appearance and content of the memorial site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundImage">Header Background Image URL</Label>
                <Input
                  id="backgroundImage"
                  value={backgroundImage}
                  onChange={(e) => setBackgroundImage(e.target.value)}
                  placeholder="https://example.com/background.jpg"
                />
                {backgroundImage && (
                  <div className="mt-2 h-24 overflow-hidden rounded-md">
                    <img
                      src={backgroundImage}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tributeImage">Main Tribute Image URL</Label>
                <Input
                  id="tributeImage"
                  value={tributeImage}
                  onChange={(e) => setTributeImage(e.target.value)}
                  placeholder="https://example.com/chris.jpg"
                />
                {tributeImage && (
                  <div className="mt-2 h-24 w-24 overflow-hidden rounded-full mx-auto">
                    <img
                      src={tributeImage}
                      alt="Tribute preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="footerMessage">Footer Message</Label>
                <Textarea
                  id="footerMessage"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="Enter a message for the footer"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleSaveSettings}
                disabled={isUpdatingSettings}
                className="mt-4"
              >
                {isUpdatingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="funeral" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Funeral Program</CardTitle>
              <CardDescription>
                Update the funeral service details and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="programDate">Date</Label>
                  <Input
                    id="programDate"
                    value={programDate}
                    onChange={(e) => setProgramDate(e.target.value)}
                    placeholder="Saturday, October 21, 2023"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="programTime">Time</Label>
                  <Input
                    id="programTime"
                    value={programTime}
                    onChange={(e) => setProgramTime(e.target.value)}
                    placeholder="1:00 PM - 3:00 PM"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="programLocation">Location</Label>
                <Input
                  id="programLocation"
                  value={programLocation}
                  onChange={(e) => setProgramLocation(e.target.value)}
                  placeholder="Seaside Memorial Chapel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="programAddress">Address</Label>
                <Input
                  id="programAddress"
                  value={programAddress}
                  onChange={(e) => setProgramAddress(e.target.value)}
                  placeholder="1234 Coastal Highway, Oceanview, CA 92123"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="programStreamLink">Livestream Link (optional)</Label>
                <Input
                  id="programStreamLink"
                  value={programStreamLink}
                  onChange={(e) => setProgramStreamLink(e.target.value)}
                  placeholder="https://example.com/stream"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="programPdfUrl">Program PDF URL (optional)</Label>
                <Input
                  id="programPdfUrl"
                  value={programPdfUrl}
                  onChange={(e) => setProgramPdfUrl(e.target.value)}
                  placeholder="https://example.com/program.pdf"
                />
              </div>
              
              <Button 
                onClick={handleSaveFuneralProgram}
                disabled={isUpdatingProgram}
                className="mt-4"
              >
                {isUpdatingProgram ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
