"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TeamsProvider, useTeams } from "@/contexts/teams-context";
import { JobsProvider } from "@/contexts/jobs-context";
import { InboxProvider } from "@/contexts/inbox-context";
import { MembersProvider } from "@/contexts/members-context";
import { JobsTable } from "@/components/jobs-table";
import { useAuth } from "@/contexts/auth-context";

function HomeContent() {
  const { selectedSubTopic } = useTeams();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="flex items-center gap-2 md:gap-4 p-2 md:p-4">
            <SidebarTrigger />
            <h1 className="text-base md:text-lg font-medium">DrawTrack</h1>
          </div>
        </header>

        {/* Main Content */}
        {selectedSubTopic ? (
          <JobsTable
            teamId={selectedSubTopic.teamId}
            topicId={selectedSubTopic.topicId}
            subTopicId={selectedSubTopic.subTopicId}
            subTopicName={selectedSubTopic.subTopicName}
            subTopicDescription={selectedSubTopic.subTopicDescription}
            teamName={selectedSubTopic.teamName}
            topicName={selectedSubTopic.topicName}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-73px)] bg-white px-4">
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-4xl sm:text-6xl">
                    D
                  </span>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  DrawTrack
                </h2>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Kelola Shop Drawing dalam Satu Platform
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-600">
                  Pengelolaan dokumen, kontrol revisi, dan pemantauan progres pekerjaan dokumen shop drawing.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <JobsProvider>
      <TeamsProvider>
        <InboxProvider>
          <MembersProvider>
            <HomeContent />
          </MembersProvider>
        </InboxProvider>
      </TeamsProvider>
    </JobsProvider>
  );
}
