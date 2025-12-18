"use client";

import * as React from "react";
import { axiosInstance } from "@/lib/axios";
import { useSocket } from "./socket-context";

// Frontend status (Indonesian) -> Backend status mapping
export type JobStatus =
  | "Belum dimulai"
  | "Dikerjakan"
  | "Selesai"
  | "Pengajuan"
  | "Approved";

export type JobPriority = "Tinggi" | "Sedang" | "Rendah";

// Backend status enum values
type BackendStatus = "TODO" | "IN_PROGRESS" | "DONE" | "SUBMITTED" | "APPROVED";
type BackendPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Status mappings
const statusToBackend: Record<JobStatus, BackendStatus> = {
  "Belum dimulai": "TODO",
  "Dikerjakan": "IN_PROGRESS",
  "Selesai": "DONE",
  "Pengajuan": "SUBMITTED",
  "Approved": "APPROVED",
};

const statusToFrontend: Record<BackendStatus, JobStatus> = {
  "TODO": "Belum dimulai",
  "IN_PROGRESS": "Dikerjakan",
  "DONE": "Selesai",
  "SUBMITTED": "Pengajuan",
  "APPROVED": "Approved",
};

const priorityToBackend: Record<JobPriority, BackendPriority> = {
  "Tinggi": "HIGH",
  "Sedang": "MEDIUM",
  "Rendah": "LOW",
};

const priorityToFrontend: Record<BackendPriority, JobPriority> = {
  "HIGH": "Tinggi",
  "MEDIUM": "Sedang",
  "LOW": "Rendah",
  "URGENT": "Tinggi",
};

export interface Job {
  id: string;
  name: string;
  workerName: string;
  workerId?: string;
  status: JobStatus;
  priority: JobPriority;
  document: string;
  startDate: string;
  endDate: string;
  teamId: string;
  topicId: string;
  subTopicId: string;
}

interface BackendTask {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    id: string;
    name: string;
    username: string;
  };
  assigneeId?: string;
  status: BackendStatus;
  priority: BackendPriority;
  startDate?: string;
  dueDate?: string;
  subtopicId: string;
  documents?: Array<{ id: string; fileName: string }>;
}

interface JobsContextType {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (teamId: string, topicId: string, subTopicId: string) => Promise<void>;
  addJob: (teamId: string, job: Omit<Job, "id">) => Promise<void>;
  updateJob: (teamId: string, id: string, updates: Partial<Omit<Job, "id">>) => Promise<void>;
  removeJob: (teamId: string, id: string) => Promise<void>;
  updateJobStatus: (teamId: string, id: string, status: JobStatus) => Promise<void>;
  getJobsBySubTopic: (teamId: string, topicId: string, subTopicId: string) => Job[];
}

const JobsContext = React.createContext<JobsContextType | undefined>(undefined);

// Transform backend task to frontend job
function transformTaskToJob(task: BackendTask, teamId: string, topicId: string): Job {
  return {
    id: task.id,
    name: task.title,
    workerName: task.assignee?.name || task.assignee?.username || "",
    workerId: task.assigneeId,
    status: statusToFrontend[task.status] || "Belum dimulai",
    priority: priorityToFrontend[task.priority] || "Sedang",
    document: task.documents?.map(d => d.fileName).join(", ") || "",
    startDate: task.startDate ? new Date(task.startDate).toLocaleDateString('en-CA') : "",
    endDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-CA') : "",
    teamId: teamId,
    topicId: topicId,
    subTopicId: task.subtopicId,
  };
}

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Use ref to access current jobs in WebSocket handlers without stale closure
  const jobsRef = React.useRef<Job[]>([]);
  jobsRef.current = jobs;

  // WebSocket event listeners for real-time updates
  React.useEffect(() => {
    if (!socket) return;

    const handleTaskCreated = (data: { subtopicId: string; task: BackendTask }) => {
      // Find teamId and topicId from existing jobs with same subtopicId using ref
      // This includes temp jobs from optimistic updates
      // Note: Frontend uses subTopicId, backend sends subtopicId - handle both
      const existingJob = jobsRef.current.find(j => j.subTopicId === data.subtopicId || j.subTopicId === data.task.subtopicId);
      if (existingJob) {
        const newJob = transformTaskToJob(data.task, existingJob.teamId, existingJob.topicId);
        setJobs(prev => {
          // Check if job already exists (avoid duplicates)
          if (prev.some(j => j.id === newJob.id)) return prev;
          // Check if there's a temp job for this - if so, just return prev
          // Let the API response handler replace the temp job
          const hasTempJob = prev.some(j => j.subTopicId === newJob.subTopicId && j.id.startsWith('temp-'));
          if (hasTempJob) return prev;
          // No temp job, just add the new job (from another user)
          return [...prev, newJob];
        });
      }
    };

    const handleTaskUpdated = (task: BackendTask) => {
      setJobs(prev => prev.map(job => {
        if (job.id === task.id) {
          return {
            ...job,
            name: task.title,
            workerName: task.assignee?.name || task.assignee?.username || "",
            workerId: task.assigneeId,
            status: statusToFrontend[task.status] || "Belum dimulai",
            priority: priorityToFrontend[task.priority] || "Sedang",
            startDate: task.startDate ? new Date(task.startDate).toLocaleDateString('en-CA') : "",
            endDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-CA') : "",
          };
        }
        return job;
      }));
    };

    const handleTaskDeleted = (data: { taskId: string }) => {
      setJobs(prev => prev.filter(job => job.id !== data.taskId));
    };

    const handleTaskStatus = (data: { taskId: string; status: BackendStatus }) => {
      setJobs(prev => prev.map(job => 
        job.id === data.taskId 
          ? { ...job, status: statusToFrontend[data.status] || job.status }
          : job
      ));
    };

    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);
    socket.on("task:status", handleTaskStatus);

    return () => {
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
      socket.off("task:status", handleTaskStatus);
    };
  }, [socket, jobs]);

  const fetchJobs = React.useCallback(async (teamId: string, topicId: string, subTopicId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/teams/${teamId}/subtopics/${subTopicId}/tasks`);
      const tasks: BackendTask[] = response.data.data;
      
      // Transform and merge with existing jobs (remove old jobs from this subtopic, add new ones)
      setJobs(prev => {
        const otherJobs = prev.filter(j => j.subTopicId !== subTopicId);
        const newJobs = tasks.map(task => transformTaskToJob(task, teamId, topicId));
        return [...otherJobs, ...newJobs];
      });
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  const addJob = React.useCallback(async (teamId: string, job: Omit<Job, "id">) => {
    // Create a temporary job with a temp ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempJob: Job = {
      id: tempId,
      name: job.name,
      workerName: job.workerName,
      workerId: job.workerId,
      status: job.status,
      priority: job.priority,
      document: job.document,
      startDate: job.startDate,
      endDate: job.endDate,
      teamId: teamId,
      topicId: job.topicId,
      subTopicId: job.subTopicId,
    };
    
    // Update ref SYNCHRONOUSLY FIRST before setJobs (which is async/batched)
    // This ensures WebSocket handler can find the temp job immediately
    jobsRef.current = [...jobsRef.current, tempJob];
    
    // Then update React state
    setJobs(jobsRef.current);
    
    try {
      const payload: Record<string, unknown> = {
        title: job.name,
        priority: priorityToBackend[job.priority],
      };
      
      if (job.startDate) payload.startDate = new Date(job.startDate).toISOString();
      if (job.endDate) payload.dueDate = new Date(job.endDate).toISOString();
      if (job.workerId) payload.assigneeId = job.workerId;
      
      const response = await axiosInstance.post(
        `/teams/${teamId}/subtopics/${job.subTopicId}/tasks`,
        payload
      );
      
      // Replace temp job with real job from server, preserving workerName if backend doesn't return it
      const newTask = response.data.data;
      const realJob = transformTaskToJob(newTask, teamId, job.topicId);
      // If backend doesn't return assignee name but we have it, use our data
      if (!realJob.workerName && job.workerName) {
        realJob.workerName = job.workerName;
        realJob.workerId = job.workerId;
      }
      // Update ref synchronously first, then state
      jobsRef.current = jobsRef.current.map(j => j.id === tempId ? realJob : j);
      setJobs(jobsRef.current);
    } catch (err) {
      // Remove temp job on error - update ref first then state
      jobsRef.current = jobsRef.current.filter(j => j.id !== tempId);
      setJobs(jobsRef.current);
      console.error("Failed to add job:", err);
      setError("Failed to add job");
      throw err;
    }
  }, []);

  const updateJob = React.useCallback(async (teamId: string, id: string, updates: Partial<Omit<Job, "id">>) => {
    // Store old job for rollback
    const oldJobs = jobs;
    
    // Optimistic update FIRST
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
    
    try {
      const payload: Record<string, unknown> = {};
      
      if (updates.name) payload.title = updates.name;
      if (updates.priority) payload.priority = priorityToBackend[updates.priority];
      if (updates.status) payload.status = statusToBackend[updates.status];
      if (updates.startDate) payload.startDate = new Date(updates.startDate).toISOString();
      if (updates.endDate) payload.dueDate = new Date(updates.endDate).toISOString();
      if (updates.workerId) payload.assigneeId = updates.workerId;
      
      await axiosInstance.put(`/teams/${teamId}/task/${id}`, payload);
    } catch (err) {
      // Rollback on error
      setJobs(oldJobs);
      console.error("Failed to update job:", err);
      setError("Failed to update job");
      throw err;
    }
  }, [jobs]);

  const removeJob = React.useCallback(async (teamId: string, id: string) => {
    // Store job for rollback
    const removedJob = jobs.find(j => j.id === id);
    
    // Optimistic update FIRST
    setJobs(prev => prev.filter(job => job.id !== id));
    
    try {
      await axiosInstance.delete(`/teams/${teamId}/task/${id}`);
    } catch (err) {
      // Rollback on error
      if (removedJob) {
        setJobs(prev => [...prev, removedJob]);
      }
      console.error("Failed to remove job:", err);
      setError("Failed to remove job");
      throw err;
    }
  }, [jobs]);

  const updateJobStatus = React.useCallback(async (teamId: string, id: string, status: JobStatus) => {
    // Optimistic update FIRST for instant UI response
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status } : job
    ));
    
    try {
      const backendStatus = statusToBackend[status];
      await axiosInstance.put(`/teams/${teamId}/task/${id}/status`, { status: backendStatus });
    } catch (err) {
      // Revert on error - refetch jobs
      console.error("Failed to update job status:", err);
      setError("Failed to update job status");
      throw err;
    }
  }, []);

  const getJobsBySubTopic = React.useCallback(
    (teamId: string, topicId: string, subTopicId: string) => {
      return jobs.filter(
        (job) =>
          job.teamId === teamId &&
          job.topicId === topicId &&
          job.subTopicId === subTopicId,
      );
    },
    [jobs],
  );

  return (
    <JobsContext.Provider
      value={{
        jobs,
        loading,
        error,
        fetchJobs,
        addJob,
        updateJob,
        removeJob,
        updateJobStatus,
        getJobsBySubTopic,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = React.useContext(JobsContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}
