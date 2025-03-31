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
import { Loader2, Save, Upload, Plus, Trash } from "lucide-react";

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
  // Replace individual resource states with an array of resources
  const [resources, setResources] = useState<Array<{name: string, link: string}>>([]);

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
  const [serviceDescription, setServiceDescription] = useState("");

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
      
      // Resources - Convert the flat settings to an array of resource objects
      const resourcesArray: Array<{name: string, link: string}> = [];
      
      // Add resources only if they have a name
      if (settings.resourceName1) {
        resourcesArray.push({
          name: settings.resourceName1 || "",
          link: settings.resourceLink1 || "#"
        });
      }
      
      if (settings.resourceName2) {
        resourcesArray.push({
          name: settings.resourceName2 || "",
          link: settings.resourceLink2 || "#"
        });
      }
      
      if (settings.resourceName3) {
        resourcesArray.push({
          name: settings.resourceName3 || "",
          link: settings.resourceLink3 || "#"
        });
      }
      
      setResources(resourcesArray);
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
      setServiceDescription(funeralProgram.serviceDescription || "");
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
    
    // Update resources (limited to 3) with new values
    // For each resource slot, either set it to the value from our resources array
    // or update it with placeholder values if not present
    
    // Resource 1
    if (resources.length >= 1) {
      // We have data for this resource
      updateSettingMutation.mutate({ key: "resourceName1", value: resources[0].name || "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink1", value: resources[0].link || "#" });
      updatedCount += 2;
    } else if (settings?.resourceName1) {
      // No resource but we need to clear an existing one, use placeholder instead of empty
      updateSettingMutation.mutate({ key: "resourceName1", value: "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink1", value: "#" });
      updatedCount += 2;
    }
    
    // Resource 2
    if (resources.length >= 2) {
      // We have data for this resource
      updateSettingMutation.mutate({ key: "resourceName2", value: resources[1].name || "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink2", value: resources[1].link || "#" });
      updatedCount += 2;
    } else if (settings?.resourceName2) {
      // No resource but we need to clear an existing one, use placeholder instead of empty
      updateSettingMutation.mutate({ key: "resourceName2", value: "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink2", value: "#" });
      updatedCount += 2;
    }
    
    // Resource 3
    if (resources.length >= 3) {
      // We have data for this resource
      updateSettingMutation.mutate({ key: "resourceName3", value: resources[2].name || "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink3", value: resources[2].link || "#" });
      updatedCount += 2;
    } else if (settings?.resourceName3) {
      // No resource but we need to clear an existing one, use placeholder instead of empty
      updateSettingMutation.mutate({ key: "resourceName3", value: "Resource" });
      updateSettingMutation.mutate({ key: "resourceLink3", value: "#" });
      updatedCount += 2;
    }
    
    if (resources.length > 3) {
      toast({
        title: "Resource limit",
        description: "Only the first 3 resources will be saved. To save more resources, please contact support.",
        variant: "destructive"
      });
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
      serviceDescription: serviceDescription,
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

              <div className="space-y-2">
                <Label htmlFor="serviceDescription">About the Service</Label>
                <Textarea
                  id="serviceDescription"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Enter a description of the service..."
                  rows={6}
                  className="min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  Provide details about the service, what to expect, and any special instructions for attendees
                </p>
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
                  {resources.map((resource, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 pb-4 border-b border-border">
                      <div className="space-y-2">
                        <Label htmlFor={`resourceName-${index}`}>Resource Name</Label>
                        <Input
                          id={`resourceName-${index}`}
                          value={resource.name}
                          onChange={(e) => {
                            const newResources = [...resources];
                            newResources[index].name = e.target.value;
                            setResources(newResources);
                          }}
                          placeholder="Resource Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`resourceLink-${index}`}>Resource URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            id={`resourceLink-${index}`}
                            value={resource.link}
                            onChange={(e) => {
                              const newResources = [...resources];
                              newResources[index].link = e.target.value;
                              setResources(newResources);
                            }}
                            placeholder="https://example.com"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newResources = [...resources];
                              newResources.splice(index, 1);
                              setResources(newResources);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Limit to maximum 10 resources
                      if (resources.length < 10) {
                        setResources([...resources, { name: '', link: '' }]);
                      } else {
                        toast({
                          title: "Maximum resources reached",
                          description: "You can only have up to 10 resources.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                  </Button>
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