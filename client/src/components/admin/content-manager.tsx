import { useState, useEffect, useRef } from "react";
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
import { Loader2, Save, Upload } from "lucide-react";

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
  const [backgroundImage, setBackgroundImage] = useState("");
  // Use the data directly from the query instead of local state
  const tributeImage = settings?.tributeImage || "";

  // Debug the image loading without affecting state
  useEffect(() => {
    if (settings?.tributeImage) {
      const img = new Image();
      img.onload = () => console.log('Image loaded successfully');
      img.onerror = (e) => console.error('Image load error:', e);
      img.src = settings.tributeImage;
    }
  }, [settings?.tributeImage]);

  const [footerMessage, setFooterMessage] = useState("");

  // Refs for file inputs
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const tributeFileInputRef = useRef<HTMLInputElement>(null);

  // State for funeral program form
  const [programDate, setProgramDate] = useState("");
  const [programTime, setProgramTime] = useState("");
  const [programLocation, setProgramLocation] = useState("");
  const [programAddress, setProgramAddress] = useState("");
  const [programStreamLink, setProgramStreamLink] = useState("");
  const [programPdfUrl, setProgramPdfUrl] = useState("");

  // Update settings when data is loaded
  useEffect(() => {
    if (settings) {
      console.log('Settings loaded:', settings);
      setBackgroundImage(settings.backgroundImage || "");
      setFooterMessage(settings.footerMessage || "");
    }
  }, [settings]);

  useEffect(() => {
    if (funeralProgram) {
      setProgramDate(funeralProgram.date || "");
      setProgramTime(funeralProgram.time || "");
      setProgramLocation(funeralProgram.location || "");
      setProgramAddress(funeralProgram.address || "");
      setProgramStreamLink(funeralProgram.streamLink || "");
      setProgramPdfUrl(funeralProgram.programPdfUrl || "");
    }
  }, [funeralProgram]);

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

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ key, file }: { key: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);

      // Use fetch directly since we're sending FormData
      const res = await fetch(`/api/settings/upload/${key}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      return res.json();
    },
    onSuccess: (data) => {
      console.log('Upload Success Response:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      // Verify the state after upload
      console.log('Current Tribute Image State:', tributeImage);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload image",
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

  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadImageMutation.mutate({ key, file });
    }
  };

  const handleUploadBackgroundImage = () => {
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.click();
    }
  };

  const handleUploadTributeImage = () => {
    if (tributeFileInputRef.current) {
      tributeFileInputRef.current.click();
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
                <Label htmlFor="backgroundImage">Header Background Image</Label>
                <div className="flex space-x-2">
                  <Input
                    id="backgroundImage"
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                    placeholder="https://example.com/background.jpg"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={backgroundFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "backgroundImage")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadBackgroundImage}
                    disabled={uploadImageMutation.isPending}
                  >
                    {uploadImageMutation.isPending && uploadImageMutation.variables?.key === "backgroundImage" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {backgroundImage && (
                  <div className="mt-2 h-24 overflow-hidden rounded-md">
                    <img
                      src={backgroundImage}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter an image URL or upload an image file (up to 50MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tributeImage">Main Tribute Image</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tributeImage"
                    value={tributeImage}
                    onChange={(e) => setTributeImage(e.target.value)}
                    placeholder="https://example.com/chris.jpg"
                    className="flex-1"
                  />
                  <input
                    type="file"
                    ref={tributeFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "tributeImage")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUploadTributeImage}
                    disabled={uploadImageMutation.isPending}
                  >
                    {uploadImageMutation.isPending && uploadImageMutation.variables?.key === "tributeImage" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {tributeImage && (
                  <div className="mt-2 relative w-full max-w-[16rem] mx-auto aspect-square rounded-full border-2 border-primary overflow-hidden">
                    <img
                      src={tributeImage}
                      alt="Tribute preview"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load tribute image:', tributeImage?.slice(0, 100));
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter an image URL or upload an image file (up to 50MB)
                </p>
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