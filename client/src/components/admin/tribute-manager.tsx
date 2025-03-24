import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TributeItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TributeManager() {
  const { toast } = useToast();
  const [selectedTribute, setSelectedTribute] = useState<TributeItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: tributes, isLoading, refetch } = useQuery<TributeItem[]>({
    queryKey: ["/api/tributes"],
  });

  const deleteTributeMutation = useMutation({
    mutationFn: async (tributeId: number) => {
      await apiRequest("DELETE", `/api/tributes/${tributeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tributes"] });
      toast({
        title: "Tribute deleted",
        description: "The tribute has been successfully removed.",
      });
      setIsDeleteModalOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete tribute",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewTribute = (tribute: TributeItem) => {
    setSelectedTribute(tribute);
    setIsViewModalOpen(true);
  };

  const handleDeleteTribute = (tribute: TributeItem) => {
    setSelectedTribute(tribute);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTribute = () => {
    if (selectedTribute) {
      deleteTributeMutation.mutate(selectedTribute.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Tribute Management</CardTitle>
        </CardHeader>
        <CardContent>
          {!tributes || tributes.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No tributes have been submitted yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Candles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tributes.map((tribute) => {
                  const createdAt = new Date(tribute.createdAt);
                  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
                  
                  return (
                    <TableRow key={tribute.id}>
                      <TableCell>
                        {tribute.user?.name || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        {tribute.content.length > 50
                          ? `${tribute.content.substring(0, 50)}...`
                          : tribute.content}
                      </TableCell>
                      <TableCell>{timeAgo}</TableCell>
                      <TableCell>{tribute.candleCount}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTribute(tribute)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTribute(tribute)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Tribute Modal */}
      {selectedTribute && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Tribute Details</DialogTitle>
              <DialogDescription>
                Posted by {selectedTribute.user?.name || "Anonymous"} on{" "}
                {new Date(selectedTribute.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div>
                <p className="whitespace-pre-line">{selectedTribute.content}</p>
              </div>
              
              {selectedTribute.mediaUrl && selectedTribute.mediaType === "image" && (
                <div className="overflow-hidden rounded-lg">
                  <img 
                    src={selectedTribute.mediaUrl} 
                    alt="Shared memory" 
                    className="w-full"
                  />
                </div>
              )}
              
              {selectedTribute.mediaUrl && selectedTribute.mediaType === "video" && (
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-900">
                  <iframe
                    src={selectedTribute.mediaUrl}
                    title="Video memory"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-500">
                  Candles lit: {selectedTribute.candleCount}
                </span>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsDeleteModalOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Tribute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {selectedTribute && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this tribute? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTribute}
                disabled={deleteTributeMutation.isPending}
              >
                {deleteTributeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
