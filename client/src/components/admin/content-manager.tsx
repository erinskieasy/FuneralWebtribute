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
  const [tributeImage, setTributeImage] = useState("");

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
  
  // Contact information
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Additional resources
  const [resourceName1, setResourceName1] = useState("");
  const [resourceLink1, setResourceLink1] = useState("");
  const [resourceName2, setResourceName2] = useState("");
  const [resourceLink2, setResourceLink2] = useState("");
  const [resourceName3, setResourceName3] = useState("");
  const [resourceLink3, setResourceLink3] = useState("");

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
      setTributeImage(settings.tributeImage || "");
      setFooterMessage(settings.footerMessage || "");
      
      // Contact information
      setContactEmail(settings.contactEmail || "");
      setContactPhone(settings.contactPhone || "");
      
      // Resources
      setResourceName1(settings.resourceName1 || "");
      setResourceLink1(settings.resourceLink1 || "");
      setResourceName2(settings.resourceName2 || "");
      setResourceLink2(settings.resourceLink2 || "");
      setResourceName3(settings.resourceName3 || "");
      setResourceLink3(settings.resourceLink3 || "");
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
      
      // Update local state immediately based on the key that was uploaded
      if (data.key === "backgroundImage") {
        setBackgroundImage(data.value);
      } else if (data.key === "tributeImage") {
        setTributeImage(data.value);
      }
      
      // Then invalidate the query to refresh all settings
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
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
  
  // Handle specifically the footer message save button from footer tab
  const handleSaveFooterMessage = () => {
    if (footerMessage !== settings?.footerMessage) {
      updateSettingMutation.mutate({ 
        key: "footerMessage", 
        value: footerMessage 
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
          toast({
            title: "Footer message updated",
            description: "Your footer message has been saved successfully.",
          });
        }
      });
    } else {
      toast({
        title: "No changes detected",
        description: "The footer message hasn't changed.",
      });
    }
  };
  
  // Handle saving all footer settings at once
  const handleSaveFooterSettings = () => {
    let updatedCount = 0;
    
    // Update footer message
    if (footerMessage !== settings?.footerMessage) {
      updateSettingMutation.mutate({ key: "footerMessage", value: footerMessage });
      updatedCount++;
    }
    
    // Update contact information
    if (contactEmail !== settings?.contactEmail) {
      updateSettingMutation.mutate({ key: "contactEmail", value: contactEmail });
      updatedCount++;
    }
    
    if (contactPhone !== settings?.contactPhone) {
      updateSettingMutation.mutate({ key: "contactPhone", value: contactPhone });
      updatedCount++;
    }
    
    // Update resource links
    if (resourceName1 !== settings?.resourceName1) {
      updateSettingMutation.mutate({ key: "resourceName1", value: resourceName1 });
      updatedCount++;
    }
    
    if (resourceLink1 !== settings?.resourceLink1) {
      updateSettingMutation.mutate({ key: "resourceLink1", value: resourceLink1 });
      updatedCount++;
    }
    
    if (resourceName2 !== settings?.resourceName2) {
      updateSettingMutation.mutate({ key: "resourceName2", value: resourceName2 });
      updatedCount++;
    }
    
    if (resourceLink2 !== settings?.resourceLink2) {
      updateSettingMutation.mutate({ key: "resourceLink2", value: resourceLink2 });
      updatedCount++;
    }
    
    if (resourceName3 !== settings?.resourceName3) {
      updateSettingMutation.mutate({ key: "resourceName3", value: resourceName3 });
      updatedCount++;
    }
    
    if (resourceLink3 !== settings?.resourceLink3) {
      updateSettingMutation.mutate({ key: "resourceLink3", value: resourceLink3 });
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      // Since we've potentially made multiple mutations, we'll provide feedback once
      toast({
        title: "Footer settings updated",
        description: `Successfully updated ${updatedCount} setting${updatedCount !== 1 ? 's' : ''}.`,
      });
      
      // Make sure the data is refreshed
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    } else {
      toast({
        title: "No changes detected",
        description: "No footer settings have been changed.",
      });
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
          <TabsTrigger value="footer">Footer Settings</TabsTrigger>
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
                  <div className="mt-2 flex justify-center">
                    <div className="w-40 h-40 border border-border rounded-md overflow-hidden">
                      <img
                        src={tributeImage}
                        alt="Tribute preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load tribute image:', tributeImage?.slice(0, 100));
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter an image URL or upload an image file (up to 50MB)
                </p>
              </div>

              {/* Footer message moved to its own tab */}

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

        <TabsContent value="footer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>
                Customize the information displayed in the website footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Remembrance Message</h3>
                <div className="space-y-2">
                  <Label htmlFor="footerMessageArea">Footer Message</Label>
                  <Textarea
                    id="footerMessageArea"
                    value={footerMessage}
                    onChange={(e) => setFooterMessage(e.target.value)}
                    placeholder="Enter a message for the footer"
                    rows={5}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter an inspirational quote, remembrance message, or any text you'd like to appear in the footer
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email Address</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="memorial@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address for memorial service inquiries
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="(123) 456-7890"
                    />
                    <p className="text-xs text-muted-foreground">
                      Phone number for general inquiries
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Additional Resources</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resourceName1">Resource 1 Name</Label>
                      <Input
                        id="resourceName1"
                        value={resourceName1}
                        onChange={(e) => setResourceName1(e.target.value)}
                        placeholder="Grief Support Services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceLink1">Resource 1 URL</Label>
                      <Input
                        id="resourceLink1"
                        value={resourceLink1}
                        onChange={(e) => setResourceLink1(e.target.value)}
                        placeholder="https://example.com/support"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resourceName2">Resource 2 Name</Label>
                      <Input
                        id="resourceName2"
                        value={resourceName2}
                        onChange={(e) => setResourceName2(e.target.value)}
                        placeholder="Ocean Conservation Society"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceLink2">Resource 2 URL</Label>
                      <Input
                        id="resourceLink2"
                        value={resourceLink2}
                        onChange={(e) => setResourceLink2(e.target.value)}
                        placeholder="https://example.com/conservation"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resourceName3">Resource 3 Name</Label>
                      <Input
                        id="resourceName3"
                        value={resourceName3}
                        onChange={(e) => setResourceName3(e.target.value)}
                        placeholder="Memorial Fund"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceLink3">Resource 3 URL</Label>
                      <Input
                        id="resourceLink3"
                        value={resourceLink3}
                        onChange={(e) => setResourceLink3(e.target.value)}
                        placeholder="https://example.com/fund"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveFooterSettings}
                disabled={isUpdatingSettings}
                className="mt-8"
              >
                {isUpdatingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Footer Settings
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