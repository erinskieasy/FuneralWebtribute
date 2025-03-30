import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { GalleryImage } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash, Image, Star, Upload } from "lucide-react";

export default function GalleryManager() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  
  // Form state
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState(0);
  
  // Fetch gallery images
  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });
  
  const resetForm = () => {
    setImageUrl("");
    setCaption("");
    setIsFeatured(false);
    setOrder(0);
    setCurrentImage(null);
    setSelectedFile(null);
    setUploadMode('url');
  };
  
  const populateFormForEdit = (image: GalleryImage) => {
    setImageUrl(image.imageUrl);
    setCaption(image.caption || "");
    setIsFeatured(image.isFeatured);
    setOrder(image.order);
    setCurrentImage(image);
    setIsEditDialogOpen(true);
  };
  
  const initiateDelete = (image: GalleryImage) => {
    setCurrentImage(image);
    setIsDeleteDialogOpen(true);
  };
  
  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: async (imageData: Omit<GalleryImage, "id">) => {
      const res = await apiRequest("POST", "/api/gallery", imageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/featured"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Image added to gallery",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add image",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, caption, isFeatured, order }: { 
      file: File;
      caption: string | null;
      isFeatured: boolean;
      order: number;
    }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption || '');
      formData.append('isFeatured', String(isFeatured));
      formData.append('order', String(order));
      
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/featured"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Image uploaded to gallery",
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
  
  // Edit image mutation
  const editImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GalleryImage> }) => {
      const res = await apiRequest("PUT", `/api/gallery/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/featured"] });
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Gallery image updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update image",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/gallery/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/featured"] });
      setIsDeleteDialogOpen(false);
      setCurrentImage(null);
      toast({
        title: "Success",
        description: "Image deleted from gallery",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete image",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddImage = () => {
    if (uploadMode === 'url') {
      if (!imageUrl) {
        toast({
          title: "Error",
          description: "Image URL is required",
          variant: "destructive",
        });
        return;
      }
      
      addImageMutation.mutate({
        imageUrl,
        caption: caption || null,
        isFeatured,
        order,
      } as any);
    } else {
      if (!selectedFile) {
        toast({
          title: "Error",
          description: "Please select an image file to upload",
          variant: "destructive",
        });
        return;
      }
      
      uploadImageMutation.mutate({
        file: selectedFile,
        caption: caption || null,
        isFeatured,
        order,
      });
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleEditImage = () => {
    if (!currentImage) return;
    
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Image URL is required",
        variant: "destructive",
      });
      return;
    }
    
    // Only send the image URL if it's actually changed to avoid large payloads
    const updateData: Record<string, any> = {
      caption: caption || null, // Explicitly use null for empty captions as per the DB schema
      isFeatured,
      order,
    };
    
    // Only include imageUrl if it's different from current image
    if (imageUrl !== currentImage.imageUrl) {
      updateData.imageUrl = imageUrl;
    }
    
    editImageMutation.mutate({
      id: currentImage.id,
      data: updateData,
    });
  };
  
  const handleDeleteImage = () => {
    if (!currentImage) return;
    deleteImageMutation.mutate(currentImage.id);
  };
  
  const isAddLoading = addImageMutation.isPending;
  const isUploadLoading = uploadImageMutation.isPending;
  const isEditLoading = editImageMutation.isPending;
  const isDeleteLoading = deleteImageMutation.isPending;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gallery Manager</CardTitle>
          <CardDescription>Add, edit, or remove images from the gallery</CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Image
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !images?.length ? (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No images in the gallery yet.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Your First Image
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Caption</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="w-16 h-16 overflow-hidden rounded-md">
                      <img 
                        src={image.imageUrl} 
                        alt={image.caption || `Gallery image ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {image.caption || <span className="text-gray-400 italic">No caption</span>}
                  </TableCell>
                  <TableCell>
                    {image.isFeatured ? (
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <Star className="h-5 w-5 text-gray-300" />
                    )}
                  </TableCell>
                  <TableCell>{image.order}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => populateFormForEdit(image)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => initiateDelete(image)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Add Image Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
              <DialogDescription>
                Add a new image to the memorial gallery.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex space-x-2 mb-4">
                <Button
                  type="button"
                  variant={uploadMode === 'url' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setUploadMode('url')}
                >
                  URL
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setUploadMode('file')}
                >
                  Upload File
                </Button>
              </div>
              
              {uploadMode === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL (required)</Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrl && (
                    <div className="mt-2 h-40 overflow-hidden rounded-md">
                      <img
                        src={imageUrl}
                        alt="Image preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="image-file">Upload Image (required)</Label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    id="image-file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary"
                    onClick={triggerFileInput}
                  >
                    {selectedFile ? (
                      <div className="space-y-2 w-full">
                        <div className="h-40 overflow-hidden rounded-md">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="Selected image preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-center">{selectedFile.name}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to select an image</p>
                        <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter a caption for this image"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="featured" 
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(checked === true)}
                />
                <Label htmlFor="featured">Feature on home page</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">Lower numbers appear first</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddImage} 
                disabled={uploadMode === 'url' ? isAddLoading : isUploadLoading}
              >
                {uploadMode === 'url' ? (
                  isAddLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Image"
                  )
                ) : (
                  isUploadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Image"
                  )
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Image Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Gallery Image</DialogTitle>
              <DialogDescription>
                Update this gallery image details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-image-url">Image URL (required)</Label>
                <Input
                  id="edit-image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrl && (
                  <div className="mt-2 h-40 overflow-hidden rounded-md">
                    <img
                      src={imageUrl}
                      alt="Image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Caption (optional)</Label>
                <Input
                  id="edit-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter a caption for this image"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-featured" 
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(checked === true)}
                />
                <Label htmlFor="edit-featured">Feature on home page</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-order">Display Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-500">Lower numbers appear first</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditImage} disabled={isEditLoading}>
                {isEditLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Gallery Image</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this image from the gallery? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {currentImage && (
              <div className="flex justify-center py-4">
                <div className="w-40 h-40 overflow-hidden rounded-md">
                  <img
                    src={currentImage.imageUrl}
                    alt={currentImage.caption || "Gallery image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteImage} 
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}