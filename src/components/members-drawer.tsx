"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MoreVertical, Crown, User, Users, Mail, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { useMembersContext, type TeamMember } from "@/contexts/members-context";
import { useTeams } from "@/contexts/teams-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface MembersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDrawer({ open, onOpenChange }: MembersDrawerProps) {
  const { selectedTeam } = useTeams();
  const { members, loading, removeMember, currentUserRole } = useMembersContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Only managers can kick members
  const isManager = currentUserRole === "MANAGER";

  const filteredMembers = members.filter(
    (member: { name: string; email: string }) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const managers = filteredMembers.filter((m: TeamMember) => m.role === "MANAGER");
  const staff = filteredMembers.filter((m: TeamMember) => m.role === "STAFF");

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg sm:text-xl">Anggota Tim</SheetTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Kelola anggota dan peran dalam tim
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="py-6 space-y-6">
            {!selectedTeam ? (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Belum Ada Tim Dipilih</h3>
                      <p className="text-muted-foreground max-w-sm">
                        Pilih tim terlebih dahulu dari sidebar untuk melihat dan mengelola anggota tim
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Team Info Card */}
                <Card className="bg-gradient-to-br from-primary/5 via-primary/5 to-transparent border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg sm:text-xl truncate">{selectedTeam.name}</CardTitle>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              {members.length} anggota
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                              {managers.length} manager
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2 w-full sm:w-auto" size="sm">
                        <UserPlus className="w-4 h-4" />
                        <span className="sm:inline">Undang</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari anggota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Managers Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                      <Crown className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Manager</h3>
                    <Badge variant="secondary" className="ml-1">{managers.length}</Badge>
                  </div>
                  
                  {loading ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-sm text-muted-foreground text-center">Memuat...</p>
                      </CardContent>
                    </Card>
                  ) : managers.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8">
                        <p className="text-sm text-muted-foreground text-center">Tidak ada manager</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {managers.map((member: TeamMember) => (
                        <Card key={member.id} className="group hover:shadow-md transition-all duration-200 hover:border-yellow-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12 ring-2 ring-yellow-200 ring-offset-2">
                                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-semibold">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-base">{member.name}</span>
                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
                                      <Crown className="w-3 h-3" />
                                      Manager
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="text-sm">{member.email}</span>
                                  </div>
                                </div>
                              </div>
                              {isManager && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => selectedTeam && removeMember(selectedTeam.id, member.membershipId)}
                                  >
                                    Hapus dari Tim
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Staff Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">Staff</h3>
                    <Badge variant="secondary" className="ml-1">{staff.length}</Badge>
                  </div>
                  
                  {loading ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-sm text-muted-foreground text-center">Memuat...</p>
                      </CardContent>
                    </Card>
                  ) : staff.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8">
                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">Belum ada staff dalam tim ini</p>
                          <Button variant="outline" size="sm" onClick={() => setIsInviteDialogOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Undang Staff
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {staff.map((member: TeamMember) => (
                        <Card key={member.id} className="group hover:shadow-md transition-all duration-200 hover:border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12 ring-2 ring-blue-200 ring-offset-2">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white font-semibold">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-base">{member.name}</span>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                                      <User className="w-3 h-3" />
                                      Staff
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span className="text-sm">{member.email}</span>
                                  </div>
                                </div>
                              </div>
                              {isManager && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => selectedTeam && removeMember(selectedTeam.id, member.membershipId)}
                                  >
                                    Hapus dari Tim
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </>
  );
}
