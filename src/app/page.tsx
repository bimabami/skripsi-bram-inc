"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TeamsProvider, useTeams } from "@/contexts/teams-context";
import { JobsProvider } from "@/contexts/jobs-context";
import { JobsTable } from "@/components/jobs-table";

function HomeContent() {
  const { selectedSubTopic } = useTeams();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="flex items-center gap-2 md:gap-4 p-2 md:p-4">
            <SidebarTrigger />
            <h1 className="text-base md:text-lg font-medium">Bram Inc</h1>
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
                    B
                  </span>
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  Halo User!
                </h2>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                  Selamat Datang di Bram Inc.
                </h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-600">
                  Silahkan untuk membuat tim baru pada side bar di kiri
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
        <HomeContent />
      </TeamsProvider>
    </JobsProvider>
  );
}
