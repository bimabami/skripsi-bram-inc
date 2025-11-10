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
import { useTeams, Team } from "@/contexts/teams-context";

interface TeamActionsProps {
  team: Team;
}

export function TeamActions({ team }: TeamActionsProps) {
  const { removeTeam, updateTeam } = useTeams();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const [teamName, setTeamName] = React.useState(team.name);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (editDialogOpen) {
      setTeamName(team.name);
    }
  }, [editDialogOpen, team]);

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update team name in context
    updateTeam(team.id, {
      name: teamName,
    });

    setEditDialogOpen(false);
  };

  const handleDelete = () => {
    removeTeam(team.id);
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
            Edit Team
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              Edit Tim
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-xs sm:text-sm">
              Edit nama tim
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleEdit}
            className="space-y-3 sm:space-y-4 mt-2 sm:mt-4"
          >
            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="edit-team-name"
                className="text-xs sm:text-sm font-medium"
              >
                Nama Tim
              </Label>
              <Input
                id="edit-team-name"
                placeholder="Buat nama tim di sini.."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-10 sm:h-11 text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 sm:pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 sm:h-10 text-sm"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 h-9 sm:h-10 text-sm"
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
            <DialogTitle className="text-xl font-bold">Hapus Tim</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Apakah Anda yakin ingin menghapus tim{" "}
              <span className="font-semibold text-gray-900">
                &quot;{team.name}&quot;
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
