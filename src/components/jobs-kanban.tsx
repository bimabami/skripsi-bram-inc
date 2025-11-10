"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useJobs, Job, JobStatus, JobPriority } from "@/contexts/jobs-context";
import { User, Calendar } from "lucide-react";

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

const getProgressColor = (progress: number) => {
  if (progress === 100) return "bg-green-500";
  if (progress >= 50) return "bg-orange-500";
  return "bg-orange-400";
};

function DraggableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
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
      }} 
      {...listeners} 
      {...attributes}
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

      {/* Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-medium text-gray-900">{job.progress}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-1.5 w-full">
          <div
            className={`h-1.5 rounded-full ${getProgressColor(job.progress)}`}
            style={{ width: `${job.progress}%` }}
          ></div>
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
  const { getJobsBySubTopic, updateJob } = useJobs();
  const jobs = getJobsBySubTopic(teamId, topicId, subTopicId);
  const [activeJob, setActiveJob] = React.useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    // Update the job status
    updateJob(jobId, { status: newStatus });
    setActiveJob(null);
  };

  const getJobsByStatus = (status: JobStatus) => {
    return jobs.filter((job) => job.status === status);
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
            <DraggableJobCard key={job.id} job={job} />
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
