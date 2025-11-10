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
import { useTeams, SubTopic } from "@/contexts/teams-context";

interface SubTopicActionsProps {
  teamId: string;
  topicId: string;
  subTopic: SubTopic;
}

export function SubTopicActions({
  teamId,
  topicId,
  subTopic,
}: SubTopicActionsProps) {
  const { updateSubTopic, removeSubTopic } = useTeams();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [subTopicName, setSubTopicName] = React.useState(subTopic.name);

  React.useEffect(() => {
    if (editDialogOpen) {
      setSubTopicName(subTopic.name);
    }
  }, [editDialogOpen, subTopic.name]);

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubTopic(teamId, topicId, subTopic.id, { name: subTopicName });
    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    removeSubTopic(teamId, topicId, subTopic.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Sub Topik
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Sub Topik
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Sub Topik
            </DialogTitle>
            <DialogDescription className="text-sm">
              Edit nama sub topik pekerjaan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label
                htmlFor="edit-subtopic-name"
                className="text-sm font-medium"
              >
                Nama Sub Topik
              </Label>
              <Input
                id="edit-subtopic-name"
                placeholder="Nama sub topik.."
                value={subTopicName}
                onChange={(e) => setSubTopicName(e.target.value)}
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
            <DialogTitle className="text-xl font-bold">
              Hapus Sub Topik
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin menghapus sub topik{" "}
              <span className="font-semibold text-gray-900">
                &quot;{subTopic.name}&quot;
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
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
