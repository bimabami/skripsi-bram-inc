"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Layers,
  User,
  Upload,
  Paperclip,
  AtSign,
  Send,
  X,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useJobs, JobStatus, JobPriority } from "@/contexts/jobs-context";

interface JobDetailProps {
  jobId: string;
  teamName: string;
  topicName: string;
  subTopicName: string;
  onBack: () => void;
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

export function JobDetail({
  jobId,
  teamName,
  topicName,
  subTopicName,
  onBack,
}: JobDetailProps) {
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === jobId);
  const [comment, setComment] = React.useState("");
  const [documents, setDocuments] = React.useState<
    Array<{ id: string; name: string; size: string }>
  >([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [commentAttachment, setCommentAttachment] = React.useState<{
    name: string;
    size: string;
  } | null>(null);
  const [comments, setComments] = React.useState<
    Array<{
      id: string;
      author: string;
      time: string;
      text: string;
      attachment?: { name: string; size: string };
    }>
  >([
    {
      id: "1",
      author: "Galang",
      time: "15m",
      text: "Ini direvisi lagi ya mas, sesuai sama yang saya coret merah @Bima",
      attachment: {
        name: "DLT1-AB-25092025-PEMBESI...",
        size: "10.9 MB",
      },
    },
    {
      id: "2",
      author: "Bima",
      time: "Just Now",
      text: "Oke mas galang, Siap",
    },
  ]);

  if (!job) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Pekerjaan tidak ditemukan</p>
          <Button onClick={onBack} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocuments = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    }));

    setDocuments([...documents, ...newDocuments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleCommentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCommentAttachment({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    });

    // Reset file input
    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = "";
    }
  };

  const handleCommentAttachClick = () => {
    commentFileInputRef.current?.click();
  };

  const handleRemoveCommentAttachment = () => {
    setCommentAttachment(null);
  };

  const handleAddComment = () => {
    if (!comment.trim() && !commentAttachment) return;

    const newComment = {
      id: Date.now().toString(),
      author: "You",
      time: "Just Now",
      text: comment,
      attachment: commentAttachment || undefined,
    };

    setComments([...comments, newComment]);
    setComment("");
    setCommentAttachment(null);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-white">
      {/* Breadcrumbs */}
      <div className="mb-4 md:mb-6">
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{teamName}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {topicName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Layers className="h-4 w-4" />
                {subTopicName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1 text-sm text-gray-900 font-medium">
                <Layers className="h-4 w-4" />
                {job.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Job Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {job.name}
        </h1>
        <Button variant="ghost" size="icon" onClick={onBack}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Job Details - Single Row */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Nama Pekerja */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Nama Pekerja</p>
              <p className="text-sm font-medium text-gray-900">
                {job.workerName}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(job.status).bg}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job.status).dot}`}
                ></div>
                <span
                  className={`text-xs font-medium ${getStatusColor(job.status).text}`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          </div>

          {/* Tanggal Mulai */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tanggal Mulai</p>
              <p className="text-sm font-medium text-gray-900">
                {job.startDate}
              </p>
            </div>
          </div>

          {/* Tenggat */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Tenggat</p>
              <p className="text-sm font-medium text-gray-900">{job.endDate}</p>
            </div>
          </div>

          {/* Prioritas */}
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Prioritas</p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getPriorityColor(job.priority).bg}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(job.priority).dot}`}
                ></div>
                <span
                  className={`text-xs font-medium ${getPriorityColor(job.priority).text}`}
                >
                  {job.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Progress</p>
              <div className="flex items-center gap-2">
                <div className="bg-gray-200 rounded-full h-2 w-24">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(job.progress)}`}
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {job.progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2 mb-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">{doc.size}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveDocument(doc.id)}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        />
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-gray-600">Upload File</span>
        </button>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

        {/* Comments List */}
        <div className="space-y-4 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {c.author}
                  </span>
                  <span className="text-xs text-gray-500">{c.time}</span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{c.text}</p>
                {c.attachment && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {c.attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {c.attachment.size}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment */}
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="flex-1">
            {/* Comment Attachment Preview */}
            {commentAttachment && (
              <div className="mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {commentAttachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {commentAttachment.size}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRemoveCommentAttachment}
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden file input for comment attachments */}
            <input
              ref={commentFileInputRef}
              type="file"
              onChange={handleCommentFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />

            <div className="relative">
              <Input
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCommentAttachClick}
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <AtSign className="h-4 w-4 text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleAddComment}
                >
                  <Send className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
