"use client";

import * as React from "react";

export type JobStatus =
  | "Belum dimulai"
  | "Dikerjakan"
  | "Selesai"
  | "Pengajuan"
  | "Approved";
export type JobPriority = "Tinggi" | "Sedang" | "Rendah";

export interface Job {
  id: string;
  name: string;
  workerName: string;
  status: JobStatus;
  priority: JobPriority;
  progress: number;
  document: string;
  startDate: string;
  endDate: string;
  teamId: string;
  topicId: string;
  subTopicId: string;
}

interface JobsContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, "id">) => void;
  updateJob: (id: string, updates: Partial<Omit<Job, "id">>) => void;
  removeJob: (id: string) => void;
  getJobsBySubTopic: (
    teamId: string,
    topicId: string,
    subTopicId: string,
  ) => Job[];
}

const JobsContext = React.createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = React.useState<Job[]>([]);

  const addJob = React.useCallback((job: Omit<Job, "id">) => {
    const newJob: Job = {
      ...job,
      id: Math.random().toString(36).substring(7),
    };
    setJobs((prev) => [...prev, newJob]);
  }, []);

  const updateJob = React.useCallback(
    (id: string, updates: Partial<Omit<Job, "id">>) => {
      setJobs((prev) =>
        prev.map((job) => (job.id === id ? { ...job, ...updates } : job)),
      );
    },
    [],
  );

  const removeJob = React.useCallback((id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
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
        addJob,
        updateJob,
        removeJob,
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
