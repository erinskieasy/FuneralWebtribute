import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TributeItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import TributeForm from "./tribute-form";
import TributeCard from "./tribute-card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function TributeWall() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });
  const { isLoggedIn } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(true);
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery<TributeItem[]>({
    queryKey: ["/api/tributes"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/tributes?offset=${pageParam}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch tributes");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 5 ? allPages.flat().length : undefined;
    },
  });

  const tributes = data?.pages.flat() || [];

  const handleTributePosted = () => {
    refetch();
  };

  return (
    <section id="tributes" className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-heading font-bold text-center mb-4">Share Your Memories</h2>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
          Help us celebrate {settings?.siteTitle?.split(' ')[0]}'s life by sharing your favorite memories, photos, and stories.
        </p>
        
        {/* Tribute Form */}
        <TributeForm 
          onTributePosted={handleTributePosted} 
          visible={isFormVisible}
        />
        
        {/* Tribute Wall Feed */}
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tributes.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">No memories have been shared yet.</p>
              {isLoggedIn && (
                <p className="text-gray-600">Be the first to share a memory of {settings?.siteTitle?.split(' ')[0]}.</p>
              )}
            </div>
          ) : (
            <>
              {tributes.map((tribute) => (
                <TributeCard 
                  key={tribute.id} 
                  tribute={tribute} 
                  onUpdate={refetch}
                />
              ))}
              
              {(hasNextPage || isFetchingNextPage) && (
                <div className="text-center mt-8">
                  <Button
                    variant="link"
                    className="text-primary font-semibold hover:text-secondary"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Memories"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
