"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTeams } from "@/contexts/teams-context";
import { useJobs } from "@/contexts/jobs-context";
import {
  Search,
  Layers,
  Briefcase,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";

interface SearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: "team" | "topic" | "subtopic" | "job";
  title: string;
  subtitle?: string;
  metadata?: string;
  teamId?: string;
  topicId?: string;
  subTopicId?: string;
  teamName?: string;
  topicName?: string;
  subTopicName?: string;
  subTopicDescription?: string;
}

export function SearchDrawer({ open, onOpenChange }: SearchDrawerProps) {
  const { teams, setSelectedSubTopic } = useTeams();
  const { jobs } = useJobs();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset search when drawer closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
    }
  }, [open]);

  // Search function
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search teams
    teams.forEach((team) => {
      if (team.name.toLowerCase().includes(query)) {
        searchResults.push({
          id: team.id,
          type: "team",
          title: team.name,
          metadata: `${team.topics.length} topik`,
        });
      }

      // Search topics
      team.topics.forEach((topic) => {
        if (topic.name.toLowerCase().includes(query)) {
          searchResults.push({
            id: topic.id,
            type: "topic",
            title: topic.name,
            subtitle: team.name,
            metadata: `${topic.subTopics.length} sub topik`,
            teamId: team.id,
          });
        }

        // Search subtopics
        topic.subTopics.forEach((subTopic) => {
          if (
            subTopic.name.toLowerCase().includes(query) ||
            subTopic.description.toLowerCase().includes(query)
          ) {
            searchResults.push({
              id: subTopic.id,
              type: "subtopic",
              title: subTopic.name,
              subtitle: `${team.name} > ${topic.name}`,
              metadata: subTopic.description,
              teamId: team.id,
              topicId: topic.id,
              subTopicId: subTopic.id,
              teamName: team.name,
              topicName: topic.name,
              subTopicName: subTopic.name,
              subTopicDescription: subTopic.description,
            });
          }
        });
      });
    });

    // Search jobs
    jobs.forEach((job) => {
      if (
        job.name.toLowerCase().includes(query) ||
        job.workerName.toLowerCase().includes(query)
      ) {
        // Find the team, topic, and subtopic info
        const team = teams.find((t) => t.id === job.teamId);
        const topic = team?.topics.find((t) => t.id === job.topicId);
        const subTopic = topic?.subTopics.find((st) => st.id === job.subTopicId);

        if (team && topic && subTopic) {
          searchResults.push({
            id: job.id,
            type: "job",
            title: job.name,
            subtitle: `${team.name} > ${topic.name} > ${subTopic.name}`,
            metadata: `${job.workerName} · ${job.status}`,
            teamId: job.teamId,
            topicId: job.topicId,
            subTopicId: job.subTopicId,
            teamName: team.name,
            topicName: topic.name,
            subTopicName: subTopic.name,
            subTopicDescription: subTopic.description,
          });
        }
      }
    });

    setResults(searchResults);
  }, [searchQuery, teams, jobs]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "subtopic" || result.type === "job") {
      // Navigate to the subtopic
      setSelectedSubTopic({
        teamId: result.teamId!,
        topicId: result.topicId!,
        subTopicId: result.subTopicId!,
        subTopicName: result.subTopicName!,
        subTopicDescription: result.subTopicDescription!,
        teamName: result.teamName!,
        topicName: result.topicName!,
      });
      onOpenChange(false);
      setSearchQuery("");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "team":
        return <Users className="h-4 w-4" />;
      case "topic":
        return <Layers className="h-4 w-4" />;
      case "subtopic":
        return <Layers className="h-4 w-4" />;
      case "job":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "team":
        return "Tim";
      case "topic":
        return "Topik";
      case "subtopic":
        return "Sub Topik";
      case "job":
        return "Pekerjaan";
      default:
        return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">Search</SheetTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Cari tim, topik, sub topik, atau pekerjaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          {searchQuery.trim() === "" ? (
            <div className="flex flex-col items-center justify-center h-[300px] px-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Mulai mengetik untuk mencari
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] px-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Tidak ada hasil untuk &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-6 py-4 hover:bg-muted/50 transition-colors text-left"
                  disabled={result.type === "team" || result.type === "topic"}
                >
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 mt-1 text-muted-foreground">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm line-clamp-1">
                          {result.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs flex-shrink-0"
                        >
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                          {result.subtitle}
                        </p>
                      )}
                      {result.metadata && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.metadata}
                        </p>
                      )}
                    </div>
                    {(result.type === "subtopic" || result.type === "job") && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
