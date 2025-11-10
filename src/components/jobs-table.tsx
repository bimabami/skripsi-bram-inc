"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Layers, 
  Home, 
  Pencil, 
  Check, 
  X, 
  Trash2,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  Zap,
  Calendar,
  File,
  List,
  LayoutGrid,
  PieChart
} from "lucide-react";
import { useJobs, JobStatus, JobPriority } from "@/contexts/jobs-context";
import { Checkbox } from "@/components/ui/checkbox";
import { JobsChart } from "@/components/jobs-chart";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTeams } from "@/contexts/teams-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobDetail } from "@/components/job-detail";
import { JobsKanban } from "@/components/jobs-kanban";

interface JobsTableProps {
  teamId: string;
  topicId: string;
  subTopicId: string;
  subTopicName: string;
  subTopicDescription: string;
  teamName: string;
  topicName: string;
}

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case "Selesai":
      return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
    case "Dikerjakan":
      return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "Belum dimulai":
      return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
    case "Pengajuan":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      };
    case "Approved":
      return { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
  }
};

const getPriorityColor = (priority: JobPriority) => {
  switch (priority) {
    case "Tinggi":
      return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "Sedang":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      };
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

export function JobsTable({
  teamId,
  topicId,
  subTopicId,
  subTopicName,
  subTopicDescription,
  teamName,
  topicName,
}: JobsTableProps) {
  const { getJobsBySubTopic, addJob, updateJob, removeJob } = useJobs();
  const { updateSubTopic } = useTeams();
  const jobs = getJobsBySubTopic(teamId, topicId, subTopicId);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [editedDescription, setEditedDescription] = React.useState(
    subTopicDescription || "",
  );
  const [isAddJobOpen, setIsAddJobOpen] = React.useState(false);
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"list" | "status" | "chart">("list");
  const [selectedJobs, setSelectedJobs] = React.useState<Set<string>>(
    new Set(),
  );
  const [editingJobId, setEditingJobId] = React.useState<string | null>(null);
  const [editingJob, setEditingJob] = React.useState<{
    name: string;
    workerName: string;
    status: JobStatus;
    priority: JobPriority;
    progress: number;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [newJob, setNewJob] = React.useState({
    name: "",
    workerName: "",
    status: "Belum dimulai" as JobStatus,
    priority: "Sedang" as JobPriority,
    progress: 0,
    document: "",
    startDate: "",
    endDate: "",
  });
  const itemsPerPage = 10;

  // Update edited description when prop changes
  React.useEffect(() => {
    setEditedDescription(subTopicDescription || "");
  }, [subTopicDescription]);

  const handleSaveDescription = () => {
    updateSubTopic(teamId, topicId, subTopicId, {
      description: editedDescription,
    });
    setIsEditingDescription(false);
  };

  const handleCancelDescriptionEdit = () => {
    setEditedDescription(subTopicDescription || "");
    setIsEditingDescription(false);
  };

  const handleAddJob = () => {
    if (
      !newJob.name ||
      !newJob.workerName ||
      !newJob.startDate ||
      !newJob.endDate
    ) {
      return;
    }

    // Convert date format from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    };

    addJob({
      ...newJob,
      startDate: formatDate(newJob.startDate),
      endDate: formatDate(newJob.endDate),
      teamId,
      topicId,
      subTopicId,
    });

    // Reset form
    setNewJob({
      name: "",
      workerName: "",
      status: "Belum dimulai" as JobStatus,
      priority: "Sedang" as JobPriority,
      progress: 0,
      document: "",
      startDate: "",
      endDate: "",
    });
    setIsAddJobOpen(false);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allJobIds = currentJobs.map((job) => job.id);
      setSelectedJobs(new Set(allJobIds));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    const newSelected = new Set(selectedJobs);
    if (checked) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleDeleteSelected = () => {
    selectedJobs.forEach((jobId) => {
      removeJob(jobId);
    });
    setSelectedJobs(new Set());
  };

  const handleEditJob = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD for input
      const formatDateForInput = (dateString: string) => {
        const [day, month, year] = dateString.split("/");
        return `${year}-${month}-${day}`;
      };

      setEditingJobId(jobId);
      setEditingJob({
        name: job.name,
        workerName: job.workerName,
        status: job.status,
        priority: job.priority,
        progress: job.progress,
        startDate: formatDateForInput(job.startDate),
        endDate: formatDateForInput(job.endDate),
      });
    }
  };

  const handleSaveEdit = () => {
    if (!editingJobId || !editingJob) return;

    // Convert date format from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateString: string) => {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    };

    updateJob(editingJobId, {
      ...editingJob,
      startDate: formatDate(editingJob.startDate),
      endDate: formatDate(editingJob.endDate),
    });

    setEditingJobId(null);
    setEditingJob(null);
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditingJob(null);
  };

  // Calculate pagination
  const totalPages = Math.ceil(jobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs = jobs.slice(startIndex, endIndex);
  const showingStart = jobs.length > 0 ? startIndex + 1 : 0;
  const showingEnd = Math.min(endIndex, jobs.length);

  // Reset to page 1 when jobs change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [teamId, topicId, subTopicId]);

  // Add sample data for demonstration
  React.useEffect(() => {
    if (jobs.length === 0 && !hasInitialized) {
      // Add some sample jobs
      const sampleJobs = [
        {
          name: `${subTopicName} Lantai 1`,
          workerName: "Bima",
          status: "Belum dimulai" as JobStatus,
          priority: "Tinggi" as JobPriority,
          progress: 0,
          document: "",
          startDate: "07/08/2025",
          endDate: "14/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
        {
          name: `${subTopicName} Lantai 2`,
          workerName: "Bima",
          status: "Selesai" as JobStatus,
          priority: "Tinggi" as JobPriority,
          progress: 0,
          document: "DLT_2.pdf",
          startDate: "01/08/2025",
          endDate: "07/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
        {
          name: `${subTopicName} Lantai 3`,
          workerName: "Hendra",
          status: "Dikerjakan" as JobStatus,
          priority: "Sedang" as JobPriority,
          progress: 50,
          document: "",
          startDate: "03/08/2025",
          endDate: "10/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
        {
          name: `${subTopicName} Lantai 4`,
          workerName: "Hendra",
          status: "Belum dimulai" as JobStatus,
          priority: "Sedang" as JobPriority,
          progress: 50,
          document: "",
          startDate: "07/08/2025",
          endDate: "14/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
        {
          name: `${subTopicName} Lantai 5`,
          workerName: "Bram",
          status: "Selesai" as JobStatus,
          priority: "Rendah" as JobPriority,
          progress: 100,
          document: "DLT_5.pdf",
          startDate: "01/08/2025",
          endDate: "07/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
        {
          name: `${subTopicName} Lantai 6`,
          workerName: "Bram",
          status: "Dikerjakan" as JobStatus,
          priority: "Rendah" as JobPriority,
          progress: 100,
          document: "",
          startDate: "03/08/2025",
          endDate: "10/08/2025",
          teamId,
          topicId,
          subTopicId,
        },
      ];
      sampleJobs.forEach((job) => addJob(job));
      setHasInitialized(true);
    }
  }, [
    teamId,
    topicId,
    subTopicId,
    jobs.length,
    hasInitialized,
    addJob,
    subTopicName,
  ]);

  // Show job detail if a job is selected
  if (selectedJobId) {
    return (
      <JobDetail
        jobId={selectedJobId}
        teamName={teamName}
        topicName={topicName}
        subTopicName={subTopicName}
        onBack={() => setSelectedJobId(null)}
      />
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      {/* Breadcrumbs */}
      <div className="mb-4 md:mb-6">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                className="flex items-center gap-1 text-sm md:text-base text-gray-600 hover:text-gray-900"
              >
                <Home className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{teamName}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                className="text-sm md:text-base text-gray-600 hover:text-gray-900 truncate max-w-[100px] sm:max-w-none"
              >
                {topicName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm md:text-base text-gray-900 font-medium truncate max-w-[120px] sm:max-w-none">
                <Layers className="h-3 w-3 md:h-4 md:w-4" />
                {subTopicName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
            <Layers className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">{subTopicName}</h1>
        </div>
        {isEditingDescription ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              placeholder="Tambahkan deskripsi di sini..."
              className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDescription}
              className="h-7 w-7 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelDescriptionEdit}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p
              className={`text-xs md:text-sm ${subTopicDescription?.trim() ? "text-gray-600" : "text-gray-400 italic"}`}
            >
              {subTopicDescription?.trim() || "Tambahkan deskripsi di sini..."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDescription(true)}
              className="h-6 w-6 p-0"
            >
              <Pencil className="h-3 w-3 text-gray-500" />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 md:mb-6 border-b overflow-x-auto">
        <div className="flex gap-4 md:gap-6 min-w-max">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-2 md:pb-3 px-1 font-medium text-xs md:text-sm flex items-center gap-1.5 md:gap-2 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "list"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            List Pekerjaan
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`pb-2 md:pb-3 px-1 font-medium text-xs md:text-sm flex items-center gap-1.5 md:gap-2 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "status"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <LayoutGrid className="w-3 h-3 md:w-4 md:h-4" />
            Status Pekerjaan
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className={`pb-2 md:pb-3 px-1 font-medium text-xs md:text-sm flex items-center gap-1.5 md:gap-2 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === "chart"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Chart
          </button>
        </div>
      </div>

      {/* Action buttons for selected items */}
      {selectedJobs.size > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="text-sm text-gray-700">
            {selectedJobs.size} item dipilih
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </div>
      )}

      {/* Render based on active tab */}
      {activeTab === "list" && (
        <>
          {/* Table */}
          <div className="border rounded-lg overflow-x-auto bg-white">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    currentJobs.length > 0 &&
                    selectedJobs.size === currentJobs.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-24 font-semibold text-gray-700 text-center">
                Edit
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nama Pekerjaan
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nama Pekerja
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Prioritas
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Progress
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tanggal Mulai
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tanggal Selesai
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-700 text-left">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Dokumen
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-12 text-gray-500"
                >
                  Belum ada pekerjaan. Klik tombol &quot;+ Tambah
                  Pekerjaan&quot; untuk menambahkan.
                </TableCell>
              </TableRow>
            ) : (
              currentJobs.map((job) => {
                const isEditing = editingJobId === job.id;
                return (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onCheckedChange={(checked) =>
                          handleSelectJob(job.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSaveEdit}
                            className="h-7 w-7 p-0"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditJob(job.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="h-3 w-3 text-gray-500" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-center">
                      {isEditing ? (
                        <Input
                          value={editingJob?.name || ""}
                          onChange={(e) =>
                            editingJob &&
                            setEditingJob({
                              ...editingJob,
                              name: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        <button
                          onClick={() => setSelectedJobId(job.id)}
                          className="text-gray-900 hover:text-gray-700 font-medium text-left transition-colors"
                        >
                          {job.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          value={editingJob?.workerName || ""}
                          onChange={(e) =>
                            editingJob &&
                            setEditingJob({
                              ...editingJob,
                              workerName: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        job.workerName
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Select
                          value={editingJob?.status}
                          onValueChange={(value: JobStatus) =>
                            editingJob &&
                            setEditingJob({ ...editingJob, status: value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Belum dimulai">
                              Belum dimulai
                            </SelectItem>
                            <SelectItem value="Dikerjakan">
                              Dikerjakan
                            </SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                            <SelectItem value="Pengajuan">Pengajuan</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(job.status).bg}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job.status).dot}`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${getStatusColor(job.status).text}`}
                          >
                            {job.status}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Select
                          value={editingJob?.priority}
                          onValueChange={(value: JobPriority) =>
                            editingJob &&
                            setEditingJob({ ...editingJob, priority: value })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Rendah">Rendah</SelectItem>
                            <SelectItem value="Sedang">Sedang</SelectItem>
                            <SelectItem value="Tinggi">Tinggi</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getPriorityColor(job.priority).bg}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(job.priority).dot}`}
                          ></div>
                          <span
                            className={`text-sm font-medium ${getPriorityColor(job.priority).text}`}
                          >
                            {job.priority}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editingJob?.progress || 0}
                          onChange={(e) =>
                            editingJob &&
                            setEditingJob({
                              ...editingJob,
                              progress: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-20"
                        />
                      ) : (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(job.progress)}`}
                              style={{ width: `${job.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 min-w-[35px]">
                            {job.progress}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editingJob?.startDate || ""}
                          onChange={(e) =>
                            editingJob &&
                            setEditingJob({
                              ...editingJob,
                              startDate: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        job.startDate
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editingJob?.endDate || ""}
                          onChange={(e) =>
                            editingJob &&
                            setEditingJob({
                              ...editingJob,
                              endDate: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      ) : (
                        job.endDate
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {job.document ? (
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-sm">{job.document}</span>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-gray-500"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {/* Add Job Row */}
            <TableRow className="hover:bg-gray-50">
              <TableCell colSpan={10} className="py-3">
                <Dialog open={isAddJobOpen} onOpenChange={setIsAddJobOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-500 hover:text-gray-900"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pekerjaan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tambah Pekerjaan Baru</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nama Pekerjaan *</Label>
                        <Input
                          id="name"
                          value={newJob.name}
                          onChange={(e) =>
                            setNewJob({ ...newJob, name: e.target.value })
                          }
                          placeholder="Masukkan nama pekerjaan"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="workerName">Nama Pekerja *</Label>
                        <Input
                          id="workerName"
                          value={newJob.workerName}
                          onChange={(e) =>
                            setNewJob({ ...newJob, workerName: e.target.value })
                          }
                          placeholder="Masukkan nama pekerja"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={newJob.status}
                            onValueChange={(value: JobStatus) =>
                              setNewJob({ ...newJob, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Belum dimulai">
                                Belum dimulai
                              </SelectItem>
                              <SelectItem value="Dikerjakan">
                                Dikerjakan
                              </SelectItem>
                              <SelectItem value="Selesai">Selesai</SelectItem>
                              <SelectItem value="Pengajuan">
                                Pengajuan
                              </SelectItem>
                              <SelectItem value="Approved">Approved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="priority">Prioritas</Label>
                          <Select
                            value={newJob.priority}
                            onValueChange={(value: JobPriority) =>
                              setNewJob({ ...newJob, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Rendah">Rendah</SelectItem>
                              <SelectItem value="Sedang">Sedang</SelectItem>
                              <SelectItem value="Tinggi">Tinggi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="progress">Progress (%)</Label>
                        <Input
                          id="progress"
                          type="number"
                          min="0"
                          max="100"
                          value={newJob.progress}
                          onChange={(e) =>
                            setNewJob({
                              ...newJob,
                              progress: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="startDate">Tanggal Mulai *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newJob.startDate}
                            onChange={(e) =>
                              setNewJob({
                                ...newJob,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="endDate">Tanggal Selesai *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newJob.endDate}
                            onChange={(e) =>
                              setNewJob({ ...newJob, endDate: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddJobOpen(false)}
                        >
                          Batal
                        </Button>
                        <Button
                          onClick={handleAddJob}
                          disabled={
                            !newJob.name ||
                            !newJob.workerName ||
                            !newJob.startDate ||
                            !newJob.endDate
                          }
                        >
                          Tambah Pekerjaan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {jobs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 px-2 gap-3">
          <div className="text-xs md:text-sm text-gray-600">
            Showing {showingStart} to {showingEnd} of {jobs.length} entries
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-4"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first page, last page, current page, and pages around current
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-7 w-7 md:h-8 md:w-8 text-xs md:text-sm ${
                        currentPage === page ? "bg-gray-900 text-white" : ""
                      }`}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-4"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      </>
      )}

      {/* Kanban Board View */}
      {activeTab === "status" && (
        <JobsKanban 
          teamId={teamId} 
          topicId={topicId} 
          subTopicId={subTopicId} 
        />
      )}

      {/* Chart View */}
      {activeTab === "chart" && (
        <JobsChart 
          teamId={teamId} 
          topicId={topicId} 
          subTopicId={subTopicId} 
        />
      )}
    </div>
  );
}
