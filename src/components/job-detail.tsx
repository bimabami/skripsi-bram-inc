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
  Lock,
  FileText,
  HardHat,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useJobs, JobStatus, JobPriority } from "@/contexts/jobs-context";
import { useAuth } from "@/contexts/auth-context";
import { useInbox } from "@/contexts/inbox-context";
import { useMembersContext } from "@/contexts/members-context";
import { useSocket } from "@/contexts/socket-context";
import { axiosInstance } from "@/lib/axios";

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

// Helper to get full download URL (handles both absolute and relative URLs)
const getDownloadUrl = (url: string | undefined) => {
  if (!url) return '';
  // If URL is already absolute (starts with http), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Use the same host as the current page but port 5000 (backend)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:5000${url}`;
  }
  // Fallback for SSR
  return `http://localhost:5000${url}`;
};

export function JobDetail({
  jobId,
  teamName,
  topicName,
  subTopicName,
  onBack,
}: JobDetailProps) {
  const { jobs, loading } = useJobs();
  const { user } = useAuth();
  const { addMessage } = useInbox();
  const { members } = useMembersContext();
  const { socket, joinTask, leaveTask } = useSocket();
  const job = jobs.find((j) => j.id === jobId);
  const [comment, setComment] = React.useState("");
  

  
  // Get user role from auth context
  const currentUserRole = user?.role || "STAFF";
  const currentUserName = user?.name || "User";
  const isManager = currentUserRole === "MANAGER";
  
  // Shop Drawing documents (can be uploaded by both staff and manager)
  const [shopDrawingDocs, setShopDrawingDocs] = React.useState<
    Array<{ id: string; name: string; url?: string; size: string; uploadedAt: string; uploadedBy: string }>
  >([]);
  const shopDrawingInputRef = React.useRef<HTMLInputElement>(null);
  
  // For Construction documents (only manager can upload)
  const [forConstructionDocs, setForConstructionDocs] = React.useState<
    Array<{ id: string; name: string; url?: string; size: string; uploadedAt: string; uploadedBy: string }>
  >([]);
  const forConstructionInputRef = React.useRef<HTMLInputElement>(null);
  
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [commentAttachmentFile, setCommentAttachmentFile] = React.useState<File | null>(null);
  const [commentAttachment, setCommentAttachment] = React.useState<{
    name: string;
    size: string;
  } | null>(null);
  const [comments, setComments] = React.useState<
    Array<{
      id: string;
      author: string;
      authorId: string;
      time: string;
      text: string;
      attachment?: { id?: string; name: string; url?: string; size: string };
    }>
  >([]);
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  
  // Filter members for mention suggestions
  const filteredMentions = React.useMemo(() => {
    if (!mentionQuery) return members;
    return members.filter(m => 
      m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [members, mentionQuery]);
  
  // Fetch comments from API
  React.useEffect(() => {
    if (job?.teamId && jobId) {
      const fetchComments = async () => {
        try {
          const response = await axiosInstance.get(`/teams/${job.teamId}/task/${jobId}/comments`);
          const apiComments = response.data.data || [];
          setComments(apiComments.map((c: { id: string; body: string; createdAt: string; author: { id: string; name: string }; attachments?: Array<{ id: string; filename: string; url: string; size?: number }> }) => ({
            id: c.id,
            author: c.author?.name || "Unknown",
            authorId: c.author?.id || "",
            time: new Date(c.createdAt).toLocaleString('id-ID'),
            text: c.body || "",
            attachment: c.attachments && c.attachments.length > 0 ? {
              id: c.attachments[0].id,
              name: c.attachments[0].filename,
              url: c.attachments[0].url,
              size: c.attachments[0].size ? (c.attachments[0].size / (1024 * 1024)).toFixed(2) + " MB" : "",
            } : undefined,
          })));
        } catch (err) {
          console.error("Failed to fetch comments:", err);
        }
      };
      fetchComments();
    }
  }, [job?.teamId, jobId]);

  // Fetch documents from API
  React.useEffect(() => {
    if (job?.teamId && jobId) {
      const fetchDocuments = async () => {
        try {
          // Fetch shop drawing documents
          const shopDrawingResponse = await axiosInstance.get(
            `/teams/${job.teamId}/task/${jobId}/documents?type=SHOP_DRAWING`
          );
          const shopDrawingApiDocs = shopDrawingResponse.data.data || [];
          setShopDrawingDocs(shopDrawingApiDocs.map((d: { id: string; filename: string; url: string; createdAt: string; uploadedBy?: { name: string } }) => ({
            id: d.id,
            name: d.filename,
            url: d.url,
            size: "",
            uploadedAt: d.createdAt,
            uploadedBy: d.uploadedBy?.name || "Unknown",
          })));

          // Fetch for construction documents
          const forConstructionResponse = await axiosInstance.get(
            `/teams/${job.teamId}/task/${jobId}/documents?type=FOR_CONSTRUCTION`
          );
          const forConstructionApiDocs = forConstructionResponse.data.data || [];
          setForConstructionDocs(forConstructionApiDocs.map((d: { id: string; filename: string; url: string; createdAt: string; uploadedBy?: { name: string } }) => ({
            id: d.id,
            name: d.filename,
            url: d.url,
            size: "",
            uploadedAt: d.createdAt,
            uploadedBy: d.uploadedBy?.name || "Unknown",
          })));
        } catch (err) {
          console.error("Failed to fetch documents:", err);
        }
      };
      fetchDocuments();
    }
  }, [job?.teamId, jobId]);

  // Join task room for real-time updates
  React.useEffect(() => {
    if (jobId) {
      joinTask(jobId);
      return () => leaveTask(jobId);
    }
  }, [jobId, joinTask, leaveTask]);

  // WebSocket listeners for real-time comments and documents
  React.useEffect(() => {
    if (!socket || !jobId) return;

    // Handle new comment
    const handleNewComment = (comment: { id: string; body: string; createdAt: string; author: { id: string; name: string }; attachments?: Array<{ id: string; filename: string; url: string; size?: number }> }) => {
      setComments(prev => {
        if (prev.some(c => c.id === comment.id)) return prev;
        return [...prev, {
          id: comment.id,
          author: comment.author?.name || "Unknown",
          authorId: comment.author?.id || "",
          time: new Date(comment.createdAt).toLocaleString('id-ID'),
          text: comment.body || "",
          attachment: comment.attachments && comment.attachments.length > 0 ? {
            id: comment.attachments[0].id,
            name: comment.attachments[0].filename,
            url: comment.attachments[0].url,
            size: comment.attachments[0].size ? (comment.attachments[0].size / (1024 * 1024)).toFixed(2) + " MB" : "",
          } : undefined,
        }];
      });
    };

    // Handle comment file attachment
    const handleCommentFile = (attachment: { id: string; commentId: string; filename: string; url: string; size?: number }) => {
      setComments(prev => prev.map(c => 
        c.id === attachment.commentId 
          ? { ...c, attachment: { id: attachment.id, name: attachment.filename, url: attachment.url, size: attachment.size ? (attachment.size / (1024 * 1024)).toFixed(2) + " MB" : "" } }
          : c
      ));
    };

    // Handle comment deleted
    const handleCommentDeleted = (commentId: string) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Handle document uploaded
    const handleDocumentUploaded = (data: { taskId: string; document: { id: string; filename: string; url: string; type: string; createdAt: string; uploadedBy?: { name: string } } }) => {
      if (data.taskId !== jobId) return;
      const doc = {
        id: data.document.id,
        name: data.document.filename,
        url: data.document.url,
        size: "",
        uploadedAt: data.document.createdAt,
        uploadedBy: data.document.uploadedBy?.name || "Unknown",
      };
      if (data.document.type === "SHOP_DRAWING") {
        setShopDrawingDocs(prev => {
          if (prev.some(d => d.id === doc.id)) return prev;
          return [...prev, doc];
        });
      } else if (data.document.type === "FOR_CONSTRUCTION") {
        setForConstructionDocs(prev => {
          if (prev.some(d => d.id === doc.id)) return prev;
          return [...prev, doc];
        });
      }
    };

    // Handle document deleted
    const handleDocumentDeleted = (data: { taskId: string; docId: string }) => {
      if (data.taskId !== jobId) return;
      setShopDrawingDocs(prev => prev.filter(d => d.id !== data.docId));
      setForConstructionDocs(prev => prev.filter(d => d.id !== data.docId));
    };

    socket.on("comment:new", handleNewComment);
    socket.on("comment:file", handleCommentFile);
    socket.on("comment:delete", handleCommentDeleted);
    socket.on("document:uploaded", handleDocumentUploaded);
    socket.on("document:deleted", handleDocumentDeleted);

    return () => {
      socket.off("comment:new", handleNewComment);
      socket.off("comment:file", handleCommentFile);
      socket.off("comment:delete", handleCommentDeleted);
      socket.off("document:uploaded", handleDocumentUploaded);
      socket.off("document:deleted", handleDocumentDeleted);
    };
  }, [socket, jobId]);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat pekerjaan...</p>
        </div>
      </div>
    );
  }

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

  // Shop Drawing document handlers
  const handleShopDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !job) return;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'SHOP_DRAWING');
        
        const response = await axiosInstance.post(
          `/teams/${job.teamId}/task/${jobId}/documents`,
          formData
        );
        
        // Add document immediately from API response
        const savedDoc = response.data.data;
        if (savedDoc) {
          setShopDrawingDocs(prev => {
            if (prev.some(d => d.id === savedDoc.id)) return prev;
            return [...prev, {
              id: savedDoc.id,
              name: savedDoc.filename,
              url: savedDoc.url,
              size: "",
              uploadedAt: savedDoc.createdAt,
              uploadedBy: savedDoc.uploadedBy?.name || currentUserName,
            }];
          });
        }
      } catch (err) {
        console.error("Failed to upload document:", err);
      }
    }

    if (shopDrawingInputRef.current) {
      shopDrawingInputRef.current.value = "";
    }
  };

  const handleShopDrawingUploadClick = () => {
    shopDrawingInputRef.current?.click();
  };

  const handleRemoveShopDrawingDoc = async (id: string) => {
    if (!job) return;
    try {
      await axiosInstance.delete(`/teams/${job.teamId}/task/${jobId}/documents/${id}`);
      setShopDrawingDocs(prev => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  // For Construction document handlers (manager only)
  const handleForConstructionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManager || !job) return; // Safety check
    
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'FOR_CONSTRUCTION');
        
        const response = await axiosInstance.post(
          `/teams/${job.teamId}/task/${jobId}/documents`,
          formData
        );
        
        // Add document immediately from API response
        const savedDoc = response.data.data;
        if (savedDoc) {
          setForConstructionDocs(prev => {
            if (prev.some(d => d.id === savedDoc.id)) return prev;
            return [...prev, {
              id: savedDoc.id,
              name: savedDoc.filename,
              url: savedDoc.url,
              size: "",
              uploadedAt: savedDoc.createdAt,
              uploadedBy: savedDoc.uploadedBy?.name || currentUserName,
            }];
          });
        }
      } catch (err) {
        console.error("Failed to upload document:", err);
      }
    }

    if (forConstructionInputRef.current) {
      forConstructionInputRef.current.value = "";
    }
  };

  const handleForConstructionUploadClick = () => {
    if (!isManager) return;
    forConstructionInputRef.current?.click();
  };

  const handleRemoveForConstructionDoc = async (id: string) => {
    if (!isManager || !job) return;
    try {
      await axiosInstance.delete(`/teams/${job.teamId}/task/${jobId}/documents/${id}`);
      setForConstructionDocs(prev => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const handleCommentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCommentAttachmentFile(file);
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
    setCommentAttachmentFile(null);
  };

  const handleAddComment = async () => {
    if (!comment.trim() && !commentAttachment) return;
    if (!job) return;

    const commentText = comment;
    const attachmentFile = commentAttachmentFile;
    const attachmentInfo = commentAttachment;
    
    // Clear form immediately for better UX
    setComment("");
    setCommentAttachment(null);
    setCommentAttachmentFile(null);
    setShowMentions(false);
    
    try {
      // Save comment to API
      const response = await axiosInstance.post(`/teams/${job.teamId}/task/${jobId}/comments`, {
        body: commentText,
      });
      
      const savedComment = response.data.data;
      
      // Add comment immediately from API response
      if (savedComment) {
        setComments(prev => {
          if (prev.some(c => c.id === savedComment.id)) return prev;
          return [...prev, {
            id: savedComment.id,
            author: savedComment.author?.name || currentUserName,
            authorId: savedComment.author?.id || user?.id || "",
            time: new Date(savedComment.createdAt).toLocaleString('id-ID'),
            text: savedComment.body || commentText,
            attachment: undefined, // Will be updated by WebSocket or next API call
          }];
        });
      }
      
      // Upload attachment if present
      if (attachmentFile && savedComment?.id) {
        try {
          const formData = new FormData();
          formData.append('file', attachmentFile);
          
          const attachResponse = await axiosInstance.post(
            `/teams/${job.teamId}/task/${jobId}/comments/${savedComment.id}/file`,
            formData
          );
          
          // Update comment with attachment from API response
          const savedAttachment = attachResponse.data.data;
          if (savedAttachment) {
            setComments(prev => prev.map(c => 
              c.id === savedComment.id 
                ? { 
                    ...c, 
                    attachment: { 
                      id: savedAttachment.id, 
                      name: savedAttachment.filename, 
                      url: savedAttachment.url, 
                      size: savedAttachment.size ? (savedAttachment.size / (1024 * 1024)).toFixed(2) + " MB" : attachmentInfo?.size || "" 
                    } 
                  }
                : c
            ));
          }
        } catch (attachErr) {
          console.error("Failed to upload attachment:", attachErr);
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };
  
  // Handle comment input change with mention detection
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setComment(value);
    
    // Check for @ mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      // Check if there's no space after @
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionQuery(afterAt);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };
  
  // Handle mention selection
  const handleSelectMention = (memberName: string) => {
    const lastAtIndex = comment.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newComment = comment.substring(0, lastAtIndex) + '@' + memberName + ' ';
      setComment(newComment);
    }
    setShowMentions(false);
    commentInputRef.current?.focus();
  };
  
  // Handle @ button click
  const handleAtButtonClick = () => {
    setComment(comment + '@');
    setShowMentions(true);
    setMentionQuery("");
    commentInputRef.current?.focus();
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

        </div>
      </div>

      {/* Documents Sections */}
      <div className="grid gap-6 mb-6 lg:grid-cols-2">
        {/* Dokumen Shop Drawing Section - Staff & Manager can upload */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dokumen Shop Drawing</h2>
            <Badge variant="secondary" className="text-xs">Staff & Manager</Badge>
          </div>

          {/* Uploaded Documents List */}
          {shopDrawingDocs.length > 0 && (
            <div className="space-y-2 mb-4">
              {shopDrawingDocs.map((doc) => {
                const uploadDate = new Date(doc.uploadedAt);
                const formattedDate = uploadDate.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                const formattedTime = uploadDate.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{formattedDate} {formattedTime}</span>
                          <span>•</span>
                          <span className="font-medium">by {doc.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = getDownloadUrl(doc.url);
                          link.download = doc.name;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleRemoveShopDrawingDoc(doc.id)}
                        title="Remove"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Area */}
          <input
            ref={shopDrawingInputRef}
            type="file"
            multiple
            onChange={handleShopDrawingUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf"
          />
          <button
            onClick={handleShopDrawingUploadClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload className="h-5 w-5 text-blue-400" />
            <span className="text-blue-600">Upload Shop Drawing</span>
          </button>
        </div>

        {/* Dokumen For Construction Section - Manager only */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Dokumen For Construction</h2>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              <Lock className="h-3 w-3 mr-1" />
              Manager Only
            </Badge>
          </div>

          {/* Uploaded Documents List */}
          {forConstructionDocs.length > 0 && (
            <div className="space-y-2 mb-4">
              {forConstructionDocs.map((doc) => {
                const uploadDate = new Date(doc.uploadedAt);
                const formattedDate = uploadDate.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                });
                const formattedTime = uploadDate.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{formattedDate} {formattedTime}</span>
                          <span>•</span>
                          <span className="font-medium">by {doc.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = getDownloadUrl(doc.url);
                          link.download = doc.name;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-orange-600" />
                      </Button>
                      {isManager && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemoveForConstructionDoc(doc.id)}
                          title="Remove"
                        >
                          <X className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Area - Manager only */}
          {isManager ? (
            <>
              <input
                ref={forConstructionInputRef}
                type="file"
                multiple
                onChange={handleForConstructionUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf"
              />
              <button
                onClick={handleForConstructionUploadClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
              >
                <Upload className="h-5 w-5 text-orange-400" />
                <span className="text-orange-600">Upload For Construction</span>
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <Lock className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500 text-sm">Hanya Manager yang dapat mengupload</span>
            </div>
          )}
        </div>
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        if (c.attachment?.url) {
                          const link = document.createElement('a');
                          link.href = getDownloadUrl(c.attachment.url);
                          link.download = c.attachment.name;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-blue-600" />
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
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf"
            />

            <div className="relative">
              <Input
                ref={commentInputRef}
                placeholder="Add a comment... (use @ to mention)"
                value={comment}
                onChange={handleCommentChange}
                onKeyDown={(e) => {
                  if (showMentions && filteredMentions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setMentionIndex(prev => Math.min(prev + 1, filteredMentions.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setMentionIndex(prev => Math.max(prev - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      handleSelectMention(filteredMentions[mentionIndex]?.name);
                    } else if (e.key === "Escape") {
                      setShowMentions(false);
                    }
                  } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="pr-24"
              />
              
              {/* Mention suggestions dropdown */}
              {showMentions && filteredMentions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                  {filteredMentions.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMention(member.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 ${
                        index === mentionIndex ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{member.name}</div>
                        <div className="text-xs text-gray-500 truncate">{member.email}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCommentAttachClick}
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleAtButtonClick}
                >
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
