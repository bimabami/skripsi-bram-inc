"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useJobs, JobStatus, JobPriority } from "@/contexts/jobs-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Calendar,
  File
} from "lucide-react";

interface JobsChartProps {
  teamId: string;
  topicId: string;
  subTopicId: string;
}

const statusColors: Record<JobStatus, string> = {
  "Belum dimulai": "#6B7280",
  "Dikerjakan": "#3B82F6",
  "Selesai": "#10B981",
  "Pengajuan": "#F59E0B",
  "Approved": "#EC4899",
};

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case "Selesai":
      return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
    case "Dikerjakan":
      return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "Belum dimulai":
      return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
    case "Pengajuan":
      return { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" };
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

export function JobsChart({ teamId, topicId, subTopicId }: JobsChartProps) {
  const { getJobsBySubTopic } = useJobs();
  const jobs = getJobsBySubTopic(teamId, topicId, subTopicId);
  const [selectedStatus, setSelectedStatus] = React.useState<JobStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Calculate status distribution
  const statusData = React.useMemo(() => {
    const statusCount: Record<JobStatus, number> = {
      "Belum dimulai": 0,
      "Dikerjakan": 0,
      "Selesai": 0,
      "Pengajuan": 0,
      "Approved": 0,
    };

    jobs.forEach((job) => {
      statusCount[job.status]++;
    });

    return Object.entries(statusCount)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        percentage: ((count / jobs.length) * 100).toFixed(1),
      }));
  }, [jobs]);

  const handlePieClick = (data: { name: string; value: number }) => {
    setSelectedStatus(data.name as JobStatus);
    setIsDialogOpen(true);
  };

  const filteredJobs = selectedStatus
    ? jobs.filter((job) => job.status === selectedStatus)
    : [];

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-500">
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Distribusi Status Pekerjaan
        </h2>

        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              label={(entry) => `${entry.percentage}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              style={{ cursor: "pointer" }}
            >
              {statusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={statusColors[entry.name as JobStatus]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} pekerjaan`, "Jumlah"]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                const item = statusData.find((d) => d.name === value);
                return `${value} (${item?.percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Status Pekerjaan - {selectedStatus}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Nama Pekerjaan
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nama Pekerja
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700 min-w-[40px]">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Status
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Prioritas
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Progress
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Tanggal Mulai
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Tanggal Selesai
                      </div>
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4" />
                        Dokumen
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => {
                    const statusColors = getStatusColor(job.status);
                    const priorityColors = getPriorityColor(job.priority);
                    return (
                      <tr key={job.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <button className="text-black-600 hover:text-gray-800 hover:underline text-left">
                            {job.name}
                          </button>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {job.workerName}
                        </td>
                        <td className="p-3 min-w-[180px]">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusColors.bg}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`}
                            ></div>
                            <span className={`text-xs font-medium ${statusColors.text}`}>
                              {job.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${priorityColors.bg}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${priorityColors.dot}`}
                            ></div>
                            <span className={`text-xs font-medium ${priorityColors.text}`}>
                              {job.priority}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-20">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(job.progress)}`}
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 min-w-[3rem]">
                              {job.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {job.startDate}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {job.endDate}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {job.document ? (
                            <span className="text-blue-600">{job.document}</span>
                          ) : (
                            <button className="text-gray-400 hover:text-gray-600">
                              +
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Tidak ada pekerjaan dengan status ini
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
