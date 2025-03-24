import { useQuery } from "@tanstack/react-query";
import { FuneralProgram } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, FileText, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function FuneralService() {
  const { data: program, isLoading } = useQuery<FuneralProgram>({
    queryKey: ["/api/funeral-program"],
  });

  if (isLoading) {
    return <FuneralServiceSkeleton />;
  }

  if (!program) {
    return (
      <section id="program" className="py-16 px-6 bg-neutral-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Funeral Service</h2>
          <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-white">
            <p className="text-gray-500">Funeral service details are not available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="program" className="py-16 px-6 bg-neutral-100">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">Funeral Service</h2>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3">
              <div className="aspect-w-3 aspect-h-4 rounded-lg overflow-hidden shadow-md">
                <img 
                  src="https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                  alt="Funeral program" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-2xl font-heading font-bold mb-4">Celebration of Life</h3>
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <Calendar className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Date</p>
                    <p>{program.date}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Time</p>
                    <p>{program.time}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="text-primary mt-1 h-5 w-5" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p>{program.location}</p>
                    <p>{program.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {program.programPdfUrl && (
                  <Button 
                    className="bg-primary text-white hover:bg-opacity-90"
                    asChild
                  >
                    <a 
                      href={program.programPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" /> Download Program
                    </a>
                  </Button>
                )}
                
                {program.streamLink && (
                  <Button 
                    variant="secondary"
                    className="text-white hover:bg-opacity-90"
                    asChild
                  >
                    <a 
                      href={program.streamLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Video className="mr-2 h-4 w-4" /> Live Stream
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg mb-6">For those unable to attend in person, the service will be livestreamed.</p>
          <p className="italic text-gray-600">In lieu of flowers, the family requests donations to the Ocean Conservation Society, a cause dear to Chris's heart.</p>
        </div>
      </div>
    </section>
  );
}

function FuneralServiceSkeleton() {
  return (
    <section id="program" className="py-16 px-6 bg-neutral-100">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">Funeral Service</h2>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3">
              <Skeleton className="aspect-w-3 aspect-h-4 rounded-lg h-64" />
            </div>
            <div className="md:w-2/3">
              <Skeleton className="h-8 w-2/3 mb-4" />
              <div className="space-y-6 mb-6">
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-5 mt-1" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-5 mt-1" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-5 w-5 mt-1" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Skeleton className="h-6 w-1/2 mx-auto mb-6" />
          <Skeleton className="h-5 w-2/3 mx-auto" />
        </div>
      </div>
    </section>
  );
}
