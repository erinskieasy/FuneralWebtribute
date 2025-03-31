import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, Video } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AuthModal from "@/components/auth/auth-modal";
import {SiteSettings } from "@/lib/types";

interface TributeFormProps {
  onTributePosted: () => void;
  visible: boolean;
}

export default function TributeForm({ onTributePosted, visible }: TributeFormProps) {
  const { isLoggedIn, user } = useAuth();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  const tributeMutation = useMutation({
    mutationFn: async (formData: { content: string; mediaUrl?: string; mediaType?: string }) => {
      const res = await apiRequest("POST", "/api/tributes", formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Memory shared",
        description: "Your memory has been posted to the tribute wall.",
      });
      // Reset form
      setContent("");
      setMediaUrl("");
      setMediaType(null);
      // Refresh tributes
      onTributePosted();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to share memory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Cannot post empty memory",
        description: "Please write something to share your memory.",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      content,
      ...(mediaUrl && mediaType ? { mediaUrl, mediaType } : {}),
    };

    tributeMutation.mutate(formData);
  };

  const handleAddMedia = (type: "image" | "video") => {
    const url = prompt(`Enter the URL for your ${type}:`);
    if (url) {
      setMediaUrl(url);
      setMediaType(type);
    }
  };

  const userInitials = user?.name 
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "";

  if (!visible) return null;

  return (
    <div className="bg-neutral-100 rounded-lg p-6 max-w-3xl mx-auto mb-12">
      {!isLoggedIn ? (
        <div className="text-center py-4">
          <p className="mb-4">Please sign in to share your memory of {settings?.siteTitle?.split(' ')[0]}</p>
          <Button 
            className="bg-primary text-white hover:bg-opacity-90"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Sign In / Create Account
          </Button>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl">
              {userInitials}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-500">Sharing a memory</p>
            </div>
          </div>
          
          <Textarea
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Share your memory of Chris..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {mediaUrl && (
            <div className="mb-4 p-2 border rounded-lg">
              {mediaType === "image" ? (
                <div className="relative">
                  <img 
                    src={mediaUrl} 
                    alt="Attached media" 
                    className="max-h-48 rounded"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setMediaUrl("");
                      setMediaType(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-900 text-white p-4 rounded text-center">
                  <p>Video URL: {mediaUrl}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setMediaUrl("");
                      setMediaType(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="text-gray-600 hover:text-primary"
              onClick={() => handleAddMedia("image")}
            >
              <Image className="mr-2 h-4 w-4" /> Add Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-gray-600 hover:text-primary"
              onClick={() => handleAddMedia("video")}
            >
              <Video className="mr-2 h-4 w-4" /> Add Video
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-opacity-90"
              disabled={tributeMutation.isPending}
            >
              {tributeMutation.isPending ? "Posting..." : "Post Memory"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
