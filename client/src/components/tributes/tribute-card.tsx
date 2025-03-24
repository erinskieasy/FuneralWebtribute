import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TributeItem } from "@/lib/types";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import AuthModal from "@/components/auth/auth-modal";

interface TributeCardProps {
  tribute: TributeItem;
  onUpdate: () => void;
}

export default function TributeCard({ tribute, onUpdate }: TributeCardProps) {
  const { isLoggedIn, user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toast } = useToast();
  
  const createdAtDate = new Date(tribute.createdAt);
  const formattedDate = createdAtDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });
  
  const candleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tributes/${tribute.id}/candle`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tributes"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to light candle",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCandleToggle = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    
    candleMutation.mutate();
  };
  
  const userInitials = tribute.user?.name 
    ? tribute.user.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "?";
  
  // Determine background color based on user ID (for visual variety)
  const getProfileColor = () => {
    const colors = ["bg-primary", "bg-secondary", "bg-neutral-900", "bg-accent"];
    if (!tribute.user) return colors[0];
    return colors[tribute.user.id % colors.length];
  };

  return (
    <div className="tribute-card bg-white rounded-lg shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${getProfileColor()} text-white flex items-center justify-center font-bold text-xl`}>
          {userInitials}
        </div>
        <div>
          <p className="font-semibold">{tribute.user?.name || "Anonymous"}</p>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>
      
      <p className="mb-6 whitespace-pre-line">{tribute.content}</p>
      
      {tribute.mediaUrl && tribute.mediaType === "image" && (
        <div className="overflow-hidden rounded-lg mb-6">
          <img 
            src={tribute.mediaUrl} 
            alt="Shared memory" 
            className="w-full"
          />
        </div>
      )}
      
      {tribute.mediaUrl && tribute.mediaType === "video" && (
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-900 mb-6 flex items-center justify-center">
          <iframe
            src={tribute.mediaUrl}
            title="Video memory"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          className={`inline-flex items-center ${tribute.hasLitCandle ? "text-accent" : "text-gray-600"} hover:text-accent transition`}
          onClick={handleCandleToggle}
          disabled={candleMutation.isPending}
        >
          <Flame className={`mr-2 ${tribute.hasLitCandle ? "fill-accent" : ""}`} /> 
          Light a Candle <span className="ml-2">({tribute.candleCount})</span>
        </Button>
        <span className="text-sm text-gray-500">{timeAgo}</span>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
