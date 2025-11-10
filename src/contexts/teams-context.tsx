"use client";

import * as React from "react";

export interface SubTopic {
  id: string;
  name: string;
  description: string;
}

export interface Topic {
  id: string;
  name: string;
  subTopics: SubTopic[];
}

export interface Team {
  id: string;
  name: string;
  topics: Topic[];
  createdAt: Date;
}

interface TeamsContextType {
  teams: Team[];
  addTeam: (team: Omit<Team, "id" | "createdAt">) => void;
  updateTeam: (
    id: string,
    updates: Partial<Omit<Team, "id" | "createdAt">>,
  ) => void;
  removeTeam: (id: string) => void;
  addTopic: (teamId: string, topicName: string) => void;
  updateTopic: (
    teamId: string,
    topicId: string,
    updates: { name: string },
  ) => void;
  addSubTopic: (teamId: string, topicId: string, subTopicName: string) => void;
  updateSubTopic: (
    teamId: string,
    topicId: string,
    subTopicId: string,
    updates: { name?: string; description?: string },
  ) => void;
  removeTopic: (teamId: string, topicId: string) => void;
  removeSubTopic: (teamId: string, topicId: string, subTopicId: string) => void;
  selectedSubTopic: {
    teamId: string;
    topicId: string;
    subTopicId: string;
    subTopicName: string;
    subTopicDescription: string;
    teamName: string;
    topicName: string;
    selectedJobId?: string;
  } | null;
  setSelectedSubTopic: (
    selected: {
      teamId: string;
      topicId: string;
      subTopicId: string;
      subTopicName: string;
      subTopicDescription: string;
      teamName: string;
      topicName: string;
      selectedJobId?: string;
    } | null,
  ) => void;
}

const TeamsContext = React.createContext<TeamsContextType | undefined>(
  undefined,
);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [selectedSubTopic, setSelectedSubTopic] = React.useState<{
    teamId: string;
    topicId: string;
    subTopicId: string;
    subTopicName: string;
    subTopicDescription: string;
    teamName: string;
    topicName: string;
    selectedJobId?: string;
  } | null>(null);

  const addTeam = React.useCallback((team: Omit<Team, "id" | "createdAt">) => {
    const newTeam: Team = {
      ...team,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
    };
    setTeams((prev) => [...prev, newTeam]);
  }, []);

  const updateTeam = React.useCallback(
    (id: string, updates: Partial<Omit<Team, "id" | "createdAt">>) => {
      setTeams((prev) =>
        prev.map((team) => (team.id === id ? { ...team, ...updates } : team)),
      );
    },
    [],
  );

  const removeTeam = React.useCallback((id: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== id));
  }, []);

  const addTopic = React.useCallback((teamId: string, topicName: string) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              topics: [
                ...team.topics,
                {
                  id: Math.random().toString(36).substring(7),
                  name: topicName,
                  subTopics: [],
                },
              ],
            }
          : team,
      ),
    );
  }, []);

  const updateTopic = React.useCallback(
    (teamId: string, topicId: string, updates: { name: string }) => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                topics: team.topics.map((topic) =>
                  topic.id === topicId ? { ...topic, ...updates } : topic,
                ),
              }
            : team,
        ),
      );
    },
    [],
  );

  const addSubTopic = React.useCallback(
    (teamId: string, topicId: string, subTopicName: string) => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                topics: team.topics.map((topic) =>
                  topic.id === topicId
                    ? {
                        ...topic,
                        subTopics: [
                          ...topic.subTopics,
                          {
                            id: Math.random().toString(36).substring(7),
                            name: subTopicName,
                            description: `Shopdrawing ${subTopicName} Lantai 1 – Lantai Roof`,
                          },
                        ],
                      }
                    : topic,
                ),
              }
            : team,
        ),
      );
    },
    [],
  );

  const updateSubTopic = React.useCallback(
    (
      teamId: string,
      topicId: string,
      subTopicId: string,
      updates: { name?: string; description?: string },
    ) => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                topics: team.topics.map((topic) =>
                  topic.id === topicId
                    ? {
                        ...topic,
                        subTopics: topic.subTopics.map((st) =>
                          st.id === subTopicId ? { ...st, ...updates } : st,
                        ),
                      }
                    : topic,
                ),
              }
            : team,
        ),
      );
      
      // Update selectedSubTopic if it's the one being updated
      setSelectedSubTopic((prev) => {
        if (prev && prev.subTopicId === subTopicId && prev.teamId === teamId && prev.topicId === topicId) {
          return {
            ...prev,
            ...(updates.name && { subTopicName: updates.name }),
            ...(updates.description && { subTopicDescription: updates.description }),
          };
        }
        return prev;
      });
    },
    [],
  );

  const removeTopic = React.useCallback((teamId: string, topicId: string) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              topics: team.topics.filter((topic) => topic.id !== topicId),
            }
          : team,
      ),
    );
  }, []);

  const removeSubTopic = React.useCallback(
    (teamId: string, topicId: string, subTopicId: string) => {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? {
                ...team,
                topics: team.topics.map((topic) =>
                  topic.id === topicId
                    ? {
                        ...topic,
                        subTopics: topic.subTopics.filter(
                          (st) => st.id !== subTopicId,
                        ),
                      }
                    : topic,
                ),
              }
            : team,
        ),
      );
    },
    [],
  );

  return (
    <TeamsContext.Provider
      value={{
        teams,
        addTeam,
        updateTeam,
        removeTeam,
        addTopic,
        updateTopic,
        addSubTopic,
        updateSubTopic,
        removeTopic,
        removeSubTopic,
        selectedSubTopic,
        setSelectedSubTopic,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = React.useContext(TeamsContext);
  if (context === undefined) {
    throw new Error("useTeams must be used within a TeamsProvider");
  }
  return context;
}
