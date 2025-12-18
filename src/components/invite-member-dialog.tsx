"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMembersContext } from "@/contexts/members-context";
import { useTeams } from "@/contexts/teams-context";
import { Mail, UserPlus, AlertCircle } from "lucide-react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { selectedTeam } = useTeams();
  const { inviteMember } = useMembersContext();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedTeam) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Always invite as STAFF - role is fixed from account creation
      await inviteMember(selectedTeam.id, email, "STAFF");
      setEmail("");
      onOpenChange(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Gagal mengundang anggota";
      setErrorMessage(message);
      console.error("Failed to invite member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setEmail("");
      setErrorMessage(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Undang Anggota Tim
          </DialogTitle>
          <DialogDescription>
            Undang anggota baru untuk bergabung di tim{" "}
            <span className="font-semibold">{selectedTeam?.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Email harus terdaftar dalam sistem. Role sudah ditentukan saat pembuatan akun.
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !email}>
              {isSubmitting ? "Mengirim..." : "Kirim Undangan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
