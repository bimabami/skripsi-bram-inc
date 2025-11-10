"use client";

import * as React from "react";
import { Home } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/contexts/teams-context";

interface CreateTeamDialogProps {
  children: React.ReactNode;
}

export function CreateTeamDialog({ children }: CreateTeamDialogProps) {
  const { addTeam } = useTeams();
  const [open, setOpen] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [topik, setTopik] = React.useState("");
  const [subTopik, setSubTopik] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Add team to context with new structure
    addTeam({
      name: teamName,
      topics: [
        {
          id: Math.random().toString(36).substring(7),
          name: topik,
          subTopics: [
            {
              id: Math.random().toString(36).substring(7),
              name: subTopik,
              description: "",
            },
          ],
        },
      ],
    });

    // Close dialog after submission
    setOpen(false);

    // Reset form
    setTeamName("");
    setTopik("");
    setSubTopik("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Bikin Tim Baru
          </DialogTitle>
          <DialogDescription className="text-gray text-xs sm:text-sm">
            Tim berfungsi untuk melacak dan mengelola pekerjaan secara real time
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 sm:space-y-4 mt-2 sm:mt-4"
        >
          {/* Team Name */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label
              htmlFor="team-name"
              className="text-xs sm:text-sm font-medium"
            >
              Nama Tim
            </Label>
            <Input
              id="team-name"
              placeholder="Buat nama tim di sini.."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="h-10 sm:h-11 text-sm"
              required
            />
          </div>

          {/* Topik */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="topik" className="text-xs sm:text-sm font-medium">
              Topik
            </Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              <Input
                id="topik"
                placeholder="Buat topik pekerjaan di sini.."
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                className="h-10 sm:h-11 pl-9 sm:pl-10 text-sm"
                required
              />
            </div>
          </div>

          {/* Sub Topik */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label
              htmlFor="sub-topik"
              className="text-xs sm:text-sm font-medium"
            >
              Sub Topik
            </Label>
            <Input
              id="sub-topik"
              placeholder="Buat sub topik pekerjaan di sini.."
              value={subTopik}
              onChange={(e) => setSubTopik(e.target.value)}
              className="h-10 sm:h-11 text-sm"
              required
            />
          </div>

          {/* Note */}
          <p className="text-[10px] sm:text-xs text-red-600">
            *Anda bisa menambah topik dan sub topik setelah tim dibuat
          </p>

          {/* Submit Button */}
          <div className="flex justify-end pt-1 sm:pt-2">
            <Button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white px-6 sm:px-8 h-9 sm:h-10 text-sm"
            >
              Buat Tim
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
