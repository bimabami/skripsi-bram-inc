"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useJobs, Job, JobStatus, JobPriority } from "@/contexts/jobs-context";
import { useMembersContext } from "@/contexts/members-context";
import { useAuth } from "@/contexts/auth-context";
import { User, Calendar, Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobsKanbanProps {
  teamId: string;
  topicId: string;
  subTopicId: string;
}

const statusColumns: JobStatus[] = [
  "Belum dimulai",
  "Dikerjakan",
  "Selesai",
  "Pengajuan",
  "Approved",
];

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case "Belum dimulai":
      return { bg: "bg-gray-100", border: "border-gray-300", header: "bg-gray-200" };
    case "Dikerjakan":
      return { bg: "bg-blue-100", border: "border-blue-300", header: "bg-blue-200" };
    case "Selesai":
      return { bg: "bg-green-100", border: "border-green-300", header: "bg-green-200" };
    case "Pengajuan":
      return { bg: "bg-yellow-100", border: "border-yellow-300", header: "bg-yellow-200" };
    case "Approved":
      return { bg: "bg-pink-100", border: "border-pink-300", header: "bg-pink-200" };
    default:
      return { bg: "bg-gray-100", border: "border-gray-300", header: "bg-gray-200" };
  }
};

const getPriorityColor = (priority: JobPriority) => {
  switch (priority) {
    case "Tinggi":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "Sedang":
      return { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" };
    case "Rendah":
      return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
  }
};

function DraggableJobCard({ job, canDrag = true }: { job: Job; canDrag?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    disabled: !canDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        opacity: isDragging ? 0 : 1,
        touchAction: canDrag ? "none" : "auto",
      }} 
      {...(canDrag ? listeners : {})} 
      {...attributes}
      className={canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
    >
      <JobCard job={job} />
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900 mb-2 text-sm">{job.name}</h3>
      
      {/* Worker */}
      <div className="flex items-center gap-2 mb-2">
        <User className="h-3 w-3 text-gray-500" />
        <span className="text-xs text-gray-600">{job.workerName}</span>
      </div>

      {/* Priority */}
      <div className="mb-2">
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${getPriorityColor(job.priority).bg}`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(job.priority).dot}`}
          ></div>
          <span className={`text-xs font-medium ${getPriorityColor(job.priority).text}`}>
            {job.priority}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        <span>{job.startDate} - {job.endDate}</span>
      </div>
    </div>
  );
}

export function JobsKanban({ teamId, topicId, subTopicId }: JobsKanbanProps) {
  const { getJobsBySubTopic, updateJobStatus } = useJobs();
  const { currentUserRole } = useMembersContext();
  const { user } = useAuth();
  const jobs = getJobsBySubTopic(teamId, topicId, subTopicId);
  const [activeJob, setActiveJob] = React.useState<Job | null>(null);
  const [selectedWorkers, setSelectedWorkers] = React.useState<string[]>([]);
  
  // Role-based restrictions
  const isManager = currentUserRole === "MANAGER";
  const currentUserId = user?.id;
  // Staff can only move between: Belum dimulai, Dikerjakan, Selesai
  const staffAllowedStatuses: JobStatus[] = ["Belum dimulai", "Dikerjakan", "Selesai"];

  // Get unique workers from jobs
  const uniqueWorkers = React.useMemo(() => {
    const workers = new Set(jobs.map((job) => job.workerName));
    return Array.from(workers).sort();
  }, [jobs]);

  // Filter jobs based on selected workers (for managers) or current user (for staff)
  const filteredJobs = React.useMemo(() => {
    // Staff can only see their own tasks
    if (!isManager) {
      return jobs.filter((job) => job.workerId === currentUserId);
    }
    // Managers can filter by selected workers
    if (selectedWorkers.length === 0) return jobs;
    return jobs.filter((job) => selectedWorkers.includes(job.workerName));
  }, [jobs, selectedWorkers, isManager, currentUserId]);

  const toggleWorker = (workerName: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerName)
        ? prev.filter((w) => w !== workerName)
        : [...prev, workerName]
    );
  };

  const clearFilters = () => {
    setSelectedWorkers([]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find((j) => j.id === active.id);
    if (job) {
      setActiveJob(job);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveJob(null);
      return;
    }

    const jobId = active.id as string;
    const newStatus = over.id as JobStatus;
    const currentJob = jobs.find(j => j.id === jobId);
    
    // Check role-based restrictions for staff
    if (!isManager && currentJob) {
      const currentStatus = currentJob.status;
      
      // Staff can only move their own tasks
      if (currentJob.workerId !== currentUserId) {
        setActiveJob(null);
        return; // Staff cannot move tasks assigned to others
      }
      
      // Staff can only move within allowed statuses
      if (!staffAllowedStatuses.includes(currentStatus) || !staffAllowedStatuses.includes(newStatus)) {
        setActiveJob(null);
        return; // Staff cannot move to/from Pengajuan or Approved
      }
    }

    // Update the job status
    updateJobStatus(teamId, jobId, newStatus);
    setActiveJob(null);
  };

  const getJobsByStatus = (status: JobStatus) => {
    return filteredJobs.filter((job) => job.status === status);
  };

  // Helper to check if staff can drag a specific job
  const canStaffDragJob = (job: Job, status: JobStatus) => {
    if (isManager) return true;
    // Staff can only drag their own tasks in allowed statuses
    return job.workerId === currentUserId && staffAllowedStatuses.includes(status);
  };

  function DroppableColumn({ status }: { status: JobStatus }) {
    const { setNodeRef } = useDroppable({
      id: status,
    });

    const statusJobs = getJobsByStatus(status);
    const colors = getStatusColor(status);

    return (
      <div className="flex-shrink-0 w-80">
        {/* Column Header */}
        <div
          className={`${colors.header} ${colors.border} border-2 rounded-t-lg px-4 py-3 flex items-center justify-between`}
        >
          <h3 className="font-semibold text-gray-900 text-sm">{status}</h3>
          <span className="bg-white px-2 py-0.5 rounded-full text-xs font-medium text-gray-700">
            {statusJobs.length}
          </span>
        </div>

        {/* Droppable Area */}
        <div
          ref={setNodeRef}
          className={`${colors.bg} ${colors.border} border-2 border-t-0 rounded-b-lg p-4 min-h-[500px]`}
        >
          {statusJobs.map((job) => (
            <DraggableJobCard key={job.id} job={job} canDrag={canStaffDragJob(job, status)} />
          ))}

          {statusJobs.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Tidak ada pekerjaan
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        {/* Hide filter pekerja for staff - only show for managers */}
        {isManager && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter Pekerja
              {selectedWorkers.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {selectedWorkers.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter berdasarkan pekerja</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueWorkers.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                Tidak ada pekerja
              </div>
            ) : (
              uniqueWorkers.map((worker) => (
                <DropdownMenuCheckboxItem
                  key={worker}
                  checked={selectedWorkers.includes(worker)}
                  onCheckedChange={() => toggleWorker(worker)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {worker}
                  </div>
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* Active Filters - only for managers */}
        {isManager && selectedWorkers.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedWorkers.map((worker) => (
              <Badge
                key={worker}
                variant="secondary"
                className="gap-1 pr-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                <User className="h-3 w-3" />
                {worker}
                <button
                  onClick={() => toggleWorker(worker)}
                  className="ml-1 rounded-full p-0.5 hover:bg-blue-300 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Hapus Filter
            </Button>
          </div>
        )}

        {/* Results count - only for managers */}
        {isManager && selectedWorkers.length > 0 && (
          <div className="text-sm text-muted-foreground ml-auto">
            Menampilkan {filteredJobs.length} dari {jobs.length} pekerjaan
          </div>
        )}
      </div>

      <div className="flex gap-4 pb-4">
        {statusColumns.map((status) => (
          <DroppableColumn key={status} status={status} />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="rotate-2 scale-105 cursor-grabbing">
            <JobCard job={activeJob} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
