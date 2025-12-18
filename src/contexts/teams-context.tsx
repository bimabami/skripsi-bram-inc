"use client";

import * as React from "react";
import { axiosInstance } from "@/lib/axios";
import { useSocket } from "./socket-context";

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

// Types for creating new items (without id)
interface NewSubTopic {
  name: string;
  description: string;
}

interface NewTopic {
  name: string;
  subTopics: NewSubTopic[];
}

interface NewTeam {
  name: string;
  topics: NewTopic[];
}

interface TeamsContextType {
  teams: Team[];
  loading: boolean;
  error: string | null;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  addTeam: (team: NewTeam) => Promise<void>;
  updateTeam: (
    id: string,
    updates: Partial<Omit<Team, "id" | "createdAt">>,
  ) => Promise<void>;
  removeTeam: (id: string) => Promise<void>;
  addTopic: (teamId: string, topicName: string) => Promise<void>;
  updateTopic: (
    teamId: string,
    topicId: string,
    updates: { name: string },
  ) => Promise<void>;
  addSubTopic: (teamId: string, topicId: string, subTopicName: string) => Promise<void>;
  updateSubTopic: (
    teamId: string,
    topicId: string,
    subTopicId: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
  removeTopic: (teamId: string, topicId: string) => Promise<void>;
  removeSubTopic: (teamId: string, topicId: string, subTopicId: string) => Promise<void>;
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

// Backend response types
interface BackendSubtopic {
  id: string;
  title: string;
  description?: string;
}

interface BackendTopic {
  id: string;
  title: string;
  subtopics?: BackendSubtopic[];
}

interface BackendTeam {
  id: string;
  name: string;
  createdAt?: string;
  topics?: BackendTopic[];
}

// Transform backend team to frontend format
function transformTeam(team: BackendTeam): Team {
  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt ? new Date(team.createdAt) : new Date(),
    topics: team.topics?.map((topic) => ({
      id: topic.id,
      name: topic.title,
      subTopics: topic.subtopics?.map((subtopic) => ({
        id: subtopic.id,
        name: subtopic.title,
        description: subtopic.description || "",
      })) || [],
    })) || [],
  };
}

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const { socket, joinTeam, leaveTeam } = useSocket();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
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
  
  // Track joined team rooms
  const joinedTeamsRef = React.useRef<Set<string>>(new Set());

  // Fetch teams from API
  const fetchTeams = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/teams");
      if (response.data.success) {
        const transformedTeams = response.data.data.map(transformTeam);
        setTeams(transformedTeams);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load teams");
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Join team rooms when teams change
  React.useEffect(() => {
    if (!socket) return;
    
    // Join new team rooms
    teams.forEach(team => {
      if (!joinedTeamsRef.current.has(team.id) && !team.id.startsWith('temp-')) {
        joinTeam(team.id);
        joinedTeamsRef.current.add(team.id);
      }
    });
    
    // Leave team rooms that are no longer in teams list
    joinedTeamsRef.current.forEach(teamId => {
      if (!teams.some(t => t.id === teamId)) {
        leaveTeam(teamId);
        joinedTeamsRef.current.delete(teamId);
      }
    });
  }, [socket, teams, joinTeam, leaveTeam]);

  // Fetch teams on mount
  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // WebSocket event listeners for real-time updates
  React.useEffect(() => {
    if (!socket) return;

    // Team events - no team:created listener needed since creator gets team from API response
    // Other users get teams when invited via member:invited

    const handleTeamUpdated = (team: BackendTeam) => {
      const transformedTeam = transformTeam(team);
      setTeams(prev => prev.map(t => t.id === transformedTeam.id ? transformedTeam : t));
    };

    const handleTeamDeleted = (teamId: string) => {
      setTeams(prev => prev.filter(t => t.id !== teamId));
    };

    // Topic events
    const handleTopicCreated = (data: { teamId: string; topic: { id: string; title: string } }) => {
      setTeams(prev => prev.map(team => {
        if (team.id !== data.teamId) return team;
        // Check if topic already exists (avoid duplicates from optimistic update)
        if (team.topics.some(t => t.id === data.topic.id)) return team;
        return { ...team, topics: [...team.topics.filter(t => !t.id.startsWith('temp-')), { id: data.topic.id, name: data.topic.title, subTopics: [] }] };
      }));
    };

    const handleTopicUpdated = (data: { topicId: string; topic: { id: string; title: string } }) => {
      setTeams(prev => prev.map(team => ({
        ...team,
        topics: team.topics.map(topic => 
          topic.id === data.topicId ? { ...topic, name: data.topic.title } : topic
        ),
      })));
    };

    const handleTopicDeleted = (data: { topicId: string }) => {
      setTeams(prev => prev.map(team => ({
        ...team,
        topics: team.topics.filter(topic => topic.id !== data.topicId),
      })));
    };

    // Subtopic events
    const handleSubtopicCreated = (data: { topicId: string; subtopic: BackendSubtopic }) => {
      setTeams(prev => prev.map(team => ({
        ...team,
        topics: team.topics.map(topic => {
          if (topic.id !== data.topicId) return topic;
          // Check if subtopic already exists (avoid duplicates from optimistic update)
          if (topic.subTopics.some(st => st.id === data.subtopic.id)) return topic;
          // Remove temp subtopics and add the real one
          return { 
            ...topic, 
            subTopics: [...topic.subTopics.filter(st => !st.id.startsWith('temp-')), { id: data.subtopic.id, name: data.subtopic.title, description: data.subtopic.description || "" }] 
          };
        }),
      })));
    };

    const handleSubtopicUpdated = (data: { subtopicId: string; subtopic: BackendSubtopic }) => {
      setTeams(prev => prev.map(team => ({
        ...team,
        topics: team.topics.map(topic => ({
          ...topic,
          subTopics: topic.subTopics.map(st => 
            st.id === data.subtopicId ? { ...st, name: data.subtopic.title, description: data.subtopic.description || "" } : st
          ),
        })),
      })));
    };

    const handleSubtopicDeleted = (data: { subtopicId: string }) => {
      setTeams(prev => prev.map(team => ({
        ...team,
        topics: team.topics.map(topic => ({
          ...topic,
          subTopics: topic.subTopics.filter(st => st.id !== data.subtopicId),
        })),
      })));
    };

    // Member invited - refetch teams to get new team
    const handleMemberInvited = () => {
      fetchTeams();
    };

    socket.on("team:updated", handleTeamUpdated);
    socket.on("team:deleted", handleTeamDeleted);
    socket.on("topic:created", handleTopicCreated);
    socket.on("topic:updated", handleTopicUpdated);
    socket.on("topic:deleted", handleTopicDeleted);
    socket.on("subtopic:created", handleSubtopicCreated);
    socket.on("subtopic:updated", handleSubtopicUpdated);
    socket.on("subtopic:deleted", handleSubtopicDeleted);
    socket.on("member:invited", handleMemberInvited);

    return () => {
      socket.off("team:updated", handleTeamUpdated);
      socket.off("team:deleted", handleTeamDeleted);
      socket.off("topic:created", handleTopicCreated);
      socket.off("topic:updated", handleTopicUpdated);
      socket.off("topic:deleted", handleTopicDeleted);
      socket.off("subtopic:created", handleSubtopicCreated);
      socket.off("subtopic:updated", handleSubtopicUpdated);
      socket.off("subtopic:deleted", handleSubtopicDeleted);
      socket.off("member:invited", handleMemberInvited);
    };
  }, [socket, fetchTeams]);

  // ADD TEAM - Optimistic update with temp ID
  const addTeam = React.useCallback(async (team: NewTeam) => {
    const tempId = `temp-${Date.now()}`;
    const tempTeam: Team = {
      id: tempId,
      name: team.name,
      createdAt: new Date(),
      topics: team.topics?.map((t, tIdx) => ({
        id: `temp-topic-${tIdx}`,
        name: t.name,
        subTopics: t.subTopics?.map((st, stIdx) => ({
          id: `temp-subtopic-${tIdx}-${stIdx}`,
          name: st.name,
          description: st.description || "",
        })) || [],
      })) || [],
    };
    
    // Optimistic update first
    setTeams(prev => [...prev, tempTeam]);
    
    try {
      const response = await axiosInstance.post("/teams", {
        name: team.name,
        description: team.topics?.[0]?.subTopics?.[0]?.description || "",
        topics: team.topics
      });
      
      if (response.data.success) {
        // Replace temp team with real one from API response
        const realTeam = transformTeam(response.data.data);
        setTeams(prev => prev.map(t => t.id === tempId ? realTeam : t));
      }
    } catch (err: unknown) {
      // Rollback on error
      setTeams(prev => prev.filter(t => t.id !== tempId));
      console.error("Error creating team:", err);
      throw err;
    }
  }, []);

  // UPDATE TEAM - Immediate state update
  const updateTeam = React.useCallback(
    async (id: string, updates: Partial<Omit<Team, "id" | "createdAt">>) => {
      // Optimistic update first
      setTeams(prev => prev.map(team => 
        team.id === id ? { ...team, ...updates } : team
      ));
      
      try {
        await axiosInstance.put(`/teams/${id}`, updates);
      } catch (err: unknown) {
        // Revert on error by refetching
        await fetchTeams();
        console.error("Error updating team:", err);
        throw err;
      }
    },
    [fetchTeams],
  );

  // REMOVE TEAM - Optimistic update
  const removeTeam = React.useCallback(async (id: string) => {
    // Optimistic update first
    setTeams(prev => prev.filter(team => team.id !== id));
    
    try {
      await axiosInstance.delete(`/teams/${id}`);
    } catch (err: unknown) {
      // Revert on error
      await fetchTeams();
      console.error("Error deleting team:", err);
      throw err;
    }
  }, [fetchTeams]);

  // ADD TOPIC - Optimistic update with temp ID
  const addTopic = React.useCallback(async (teamId: string, topicName: string) => {
    const tempId = `temp-topic-${Date.now()}`;
    const tempTopic: Topic = {
      id: tempId,
      name: topicName,
      subTopics: [],
    };
    
    // Optimistic update
    setTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, topics: [...team.topics, tempTopic] }
        : team
    ));
    
    try {
      const response = await axiosInstance.post(`/teams/${teamId}/topics`, {
        title: topicName,
      });
      
      if (response.data.success) {
        // Replace temp topic with real one
        const realTopic = response.data.data;
        setTeams(prev => prev.map(team => 
          team.id === teamId 
            ? {
                ...team,
                topics: team.topics.map(t => 
                  t.id === tempId 
                    ? { id: realTopic.id, name: realTopic.title, subTopics: [] }
                    : t
                ),
              }
            : team
        ));
      }
    } catch (err: unknown) {
      // Rollback on error
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { ...team, topics: team.topics.filter(t => t.id !== tempId) }
          : team
      ));
      console.error("Error creating topic:", err);
      throw err;
    }
  }, []);

  // UPDATE TOPIC - Optimistic update
  const updateTopic = React.useCallback(
    async (teamId: string, topicId: string, updates: { name: string }) => {
      // Optimistic update
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? {
              ...team,
              topics: team.topics.map(topic =>
                topic.id === topicId ? { ...topic, name: updates.name } : topic
              ),
            }
          : team
      ));
      
      try {
        await axiosInstance.put(`/teams/topics/${topicId}`, {
          title: updates.name,
        });
      } catch (err: unknown) {
        await fetchTeams();
        console.error("Error updating topic:", err);
        throw err;
      }
    },
    [fetchTeams],
  );

  // REMOVE TOPIC - Optimistic update
  const removeTopic = React.useCallback(async (teamId: string, topicId: string) => {
    // Optimistic update
    setTeams(prev => prev.map(team => 
      team.id === teamId 
        ? { ...team, topics: team.topics.filter(topic => topic.id !== topicId) }
        : team
    ));
    
    try {
      await axiosInstance.delete(`/teams/topics/${topicId}`);
    } catch (err: unknown) {
      await fetchTeams();
      console.error("Error deleting topic:", err);
      throw err;
    }
  }, [fetchTeams]);

  // ADD SUBTOPIC - Optimistic update with temp ID
  const addSubTopic = React.useCallback(
    async (teamId: string, topicId: string, subTopicName: string) => {
      const tempId = `temp-subtopic-${Date.now()}`;
      const tempSubTopic: SubTopic = {
        id: tempId,
        name: subTopicName,
        description: "",
      };
      
      // Optimistic update
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? {
              ...team,
              topics: team.topics.map(topic =>
                topic.id === topicId 
                  ? { ...topic, subTopics: [...topic.subTopics, tempSubTopic] }
                  : topic
              ),
            }
          : team
      ));
      
      try {
        const response = await axiosInstance.post(`/teams/topics/${topicId}/subtopics`, {
          title: subTopicName,
        });
        
        if (response.data.success) {
          // Replace temp subtopic with real one
          const realSubTopic = response.data.data;
          setTeams(prev => prev.map(team => 
            team.id === teamId 
              ? {
                  ...team,
                  topics: team.topics.map(topic =>
                    topic.id === topicId 
                      ? {
                          ...topic,
                          subTopics: topic.subTopics.map(st =>
                            st.id === tempId 
                              ? { id: realSubTopic.id, name: realSubTopic.title, description: realSubTopic.description || "" }
                              : st
                          ),
                        }
                      : topic
                  ),
                }
              : team
          ));
        }
      } catch (err: unknown) {
        // Rollback on error
        setTeams(prev => prev.map(team => 
          team.id === teamId 
            ? {
                ...team,
                topics: team.topics.map(topic =>
                  topic.id === topicId 
                    ? { ...topic, subTopics: topic.subTopics.filter(st => st.id !== tempId) }
                    : topic
                ),
              }
            : team
        ));
        console.error("Error creating subtopic:", err);
        throw err;
      }
    },
    [],
  );

  // UPDATE SUBTOPIC - Optimistic update
  const updateSubTopic = React.useCallback(
    async (
      teamId: string,
      topicId: string,
      subTopicId: string,
      updates: { name?: string; description?: string },
    ) => {
      // Optimistic update
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? {
              ...team,
              topics: team.topics.map(topic =>
                topic.id === topicId 
                  ? {
                      ...topic,
                      subTopics: topic.subTopics.map(subTopic =>
                        subTopic.id === subTopicId 
                          ? { 
                              ...subTopic, 
                              ...(updates.name && { name: updates.name }),
                              ...(updates.description !== undefined && { description: updates.description }),
                            }
                          : subTopic
                      ),
                    }
                  : topic
              ),
            }
          : team
      ));
      
      // Update selectedSubTopic if it's the one being updated
      setSelectedSubTopic(prev => {
        if (prev && prev.subTopicId === subTopicId) {
          return {
            ...prev,
            ...(updates.name && { subTopicName: updates.name }),
            ...(updates.description !== undefined && { subTopicDescription: updates.description }),
          };
        }
        return prev;
      });
      
      try {
        await axiosInstance.put(`/teams/subtopics/${subTopicId}`, {
          title: updates.name,
          description: updates.description,
        });
      } catch (err: unknown) {
        await fetchTeams();
        console.error("Error updating subtopic:", err);
        throw err;
      }
    },
    [fetchTeams],
  );

  // REMOVE SUBTOPIC - Optimistic update
  const removeSubTopic = React.useCallback(
    async (teamId: string, topicId: string, subTopicId: string) => {
      // Optimistic update
      setTeams(prev => prev.map(team => 
        team.id === teamId 
          ? {
              ...team,
              topics: team.topics.map(topic =>
                topic.id === topicId 
                  ? { ...topic, subTopics: topic.subTopics.filter(st => st.id !== subTopicId) }
                  : topic
              ),
            }
          : team
      ));
      
      try {
        await axiosInstance.delete(`/teams/subtopics/${subTopicId}`);
      } catch (err: unknown) {
        await fetchTeams();
        console.error("Error deleting subtopic:", err);
        throw err;
      }
    },
    [fetchTeams],
  );

  return (
    <TeamsContext.Provider
      value={{
        teams,
        loading,
        error,
        selectedTeam,
        setSelectedTeam,
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
