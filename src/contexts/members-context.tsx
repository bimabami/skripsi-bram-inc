"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "./socket-context";

export type MemberRole = "MANAGER" | "STAFF";

export interface TeamMember {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
  avatarUrl?: string;
}

interface MembersContextType {
  members: TeamMember[];
  currentUserRole: MemberRole | null;
  loading: boolean;
  error: string | null;
  inviteMember: (teamId: string, email: string, role: MemberRole) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberId: string, role: MemberRole) => Promise<void>;
  fetchTeamMembers: (teamId: string) => Promise<void>;
}

const MembersContext = createContext<MembersContextType | undefined>(undefined);

export function MembersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTeamIdRef = useRef<string | null>(null);
  
  // Use the user's global role from auth context (fixed at account creation)
  const currentUserRole: MemberRole | null = user?.role || null;

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    currentTeamIdRef.current = teamId;
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/teams/${teamId}`);
      const teamData = response.data.data;
      
      // Transform members data from API
      const transformedMembers: TeamMember[] = teamData.members.map((member: {
        id: string;
        role: MemberRole;
        joinedAt: string;
        user: {
          id: string;
          name: string;
          email: string;
          avatarUrl?: string;
        };
      }) => ({
        id: member.user.id,
        membershipId: member.id,
        name: member.user.name || member.user.email.split('@')[0],
        email: member.user.email,
        role: member.role,
        joinedAt: member.joinedAt,
        avatarUrl: member.user.avatarUrl,
      }));
      
      setMembers(transformedMembers);
    } catch (err) {
      setError("Failed to fetch team members");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket event listeners for real-time member updates
  useEffect(() => {
    if (!socket) return;

    const handleMemberAdded = (data: { teamId: string; member: { id: string; role: MemberRole; joinedAt: string; user: { id: string; name: string; email: string } } }) => {
      if (data.teamId === currentTeamIdRef.current) {
        const newMember: TeamMember = {
          id: data.member.user.id,
          membershipId: data.member.id,
          name: data.member.user.name || data.member.user.email.split('@')[0],
          email: data.member.user.email,
          role: data.member.role,
          joinedAt: data.member.joinedAt,
        };
        setMembers(prev => {
          if (prev.some(m => m.membershipId === newMember.membershipId)) return prev;
          return [...prev, newMember];
        });
      }
    };

    const handleMemberRemoved = (data: { teamId: string; memberId: string }) => {
      if (data.teamId === currentTeamIdRef.current) {
        setMembers(prev => prev.filter(m => m.membershipId !== data.memberId));
      }
    };

    const handleMemberUpdated = (data: { teamId: string; memberId: string; member: { role: MemberRole } }) => {
      if (data.teamId === currentTeamIdRef.current) {
        setMembers(prev => prev.map(m => 
          m.membershipId === data.memberId ? { ...m, role: data.member.role } : m
        ));
      }
    };

    socket.on("member:added", handleMemberAdded);
    socket.on("member:removed", handleMemberRemoved);
    socket.on("member:updated", handleMemberUpdated);

    return () => {
      socket.off("member:added", handleMemberAdded);
      socket.off("member:removed", handleMemberRemoved);
      socket.off("member:updated", handleMemberUpdated);
    };
  }, [socket]);

  const inviteMember = useCallback(
    async (teamId: string, email: string, role: MemberRole) => {
      const tempId = `temp-${Date.now()}`;
      const tempMember: TeamMember = {
        id: tempId,
        membershipId: tempId,
        name: email.split('@')[0],
        email,
        role,
        joinedAt: new Date().toISOString(),
      };
      
      // Optimistic update first
      setMembers(prev => [...prev, tempMember]);
      
      try {
        await axiosInstance.post(`/teams/${teamId}/members`, {
          email,
          role,
        });
        
        // Refetch to get complete member data with real IDs
        await fetchTeamMembers(teamId);
      } catch (err: unknown) {
        // Rollback on error
        setMembers(prev => prev.filter(m => m.id !== tempId));
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to invite member";
        setError(errorMessage);
        console.error(err);
        throw err;
      }
    },
    [fetchTeamMembers]
  );

  const removeMember = useCallback(async (teamId: string, membershipId: string) => {
    // Store for rollback
    const removedMember = members.find(m => m.membershipId === membershipId);
    
    // Optimistic update first
    setMembers(prev => prev.filter(member => member.membershipId !== membershipId));
    
    try {
      await axiosInstance.delete(`/teams/${teamId}/members/${membershipId}`);
    } catch (err: unknown) {
      // Rollback on error
      if (removedMember) {
        setMembers(prev => [...prev, removedMember]);
      }
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to remove member";
      setError(errorMessage);
      console.error(err);
      throw err;
    }
  }, [members]);

  const updateMemberRole = useCallback(
    async (teamId: string, membershipId: string, role: MemberRole) => {
      // Store for rollback
      const member = members.find(m => m.membershipId === membershipId);
      const oldRole = member?.role;
      
      // Optimistic update first
      setMembers(prev =>
        prev.map(m =>
          m.membershipId === membershipId ? { ...m, role } : m
        )
      );
      
      try {
        await axiosInstance.put(`/teams/${teamId}/members/${membershipId}`, { role });
      } catch (err: unknown) {
        // Rollback on error
        if (oldRole) {
          setMembers(prev =>
            prev.map(m =>
              m.membershipId === membershipId ? { ...m, role: oldRole } : m
            )
          );
        }
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update member role";
        setError(errorMessage);
        console.error(err);
        throw err;
      }
    },
    [members]
  );

  return (
    <MembersContext.Provider
      value={{
        members,
        currentUserRole,
        loading,
        error,
        inviteMember,
        removeMember,
        updateMemberRole,
        fetchTeamMembers,
      }}
    >
      {children}
    </MembersContext.Provider>
  );
}

export function useMembersContext() {
  const context = useContext(MembersContext);
  if (context === undefined) {
    throw new Error("useMembersContext must be used within a MembersProvider");
  }
  return context;
}
