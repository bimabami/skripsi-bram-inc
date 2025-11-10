"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeams, Topic } from "@/contexts/teams-context";

interface TopicActionsProps {
  teamId: string;
  topic: Topic;
}

export function TopicActions({ teamId, topic }: TopicActionsProps) {
  const { updateTopic, removeTopic } = useTeams();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [topicName, setTopicName] = React.useState(topic.name);

  React.useEffect(() => {
    if (editDialogOpen) {
      setTopicName(topic.name);
    }
  }, [editDialogOpen, topic.name]);

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTopic(teamId, topic.id, { name: topicName });
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    removeTopic(teamId, topic.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Topik
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Topik
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Topik</DialogTitle>
            <DialogDescription className="text-sm">
              Edit nama topik pekerjaan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-topic-name" className="text-sm font-medium">
                Nama Topik
              </Label>
              <Input
                id="edit-topic-name"
                placeholder="Nama topik.."
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="h-10 text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 text-sm"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white px-6 h-9 text-sm"
              >
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Hapus Topik</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin menghapus topik{" "}
              <span className="font-semibold text-gray-900">
                &quot;{topic.name}&quot;
              </span>{" "}
              beserta semua sub topiknya? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-9 text-sm"
            >
              Batal
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-9 text-sm"
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
