"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TeamsProvider, useTeams } from "@/contexts/teams-context";
import { InboxProvider } from "@/contexts/inbox-context";
import { JobsProvider } from "@/contexts/jobs-context";
import { MembersProvider, useMembersContext, type TeamMember } from "@/contexts/members-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, MoreVertical, Crown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { useState } from "react";

function MembersContent() {
  const { selectedTeam } = useTeams();
  const { members, loading, removeMember, currentUserRole } = useMembersContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
  // Check if current user is a manager
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
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="flex items-center gap-2 md:gap-4 p-2 md:p-4">
            <SidebarTrigger />
            <h1 className="text-base md:text-lg font-medium">Anggota Tim</h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-4 md:p-6 space-y-6">
          {!selectedTeam ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <User className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-500">
                    Pilih tim terlebih dahulu untuk melihat anggota
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Team Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>
                        {members.length} anggota tim
                      </CardDescription>
                    </div>
                    {isManager && (
                    <Button onClick={() => setIsInviteDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Undang Anggota
                    </Button>
                    )}
                  </div>
                </CardHeader>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <CardTitle className="text-lg">
                      Manager ({managers.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : managers.length === 0 ? (
                    <p className="text-sm text-gray-500">Tidak ada manager</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anggota</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Bergabung</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {managers.map((member: TeamMember) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-yellow-100 text-yellow-700">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {member.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                <Crown className="w-3 h-3 mr-1" />
                                Manager
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(member.joinedAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => removeMember(selectedTeam.id, member.membershipId)}
                                  >
                                    Hapus dari Tim
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Staff Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">
                      Staff ({staff.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : staff.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Tidak ada staff. Undang anggota untuk bergabung!
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Anggota</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Bergabung</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staff.map((member: TeamMember) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {member.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {member.email}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                <User className="w-3 h-3 mr-1" />
                                Staff
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(member.joinedAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => removeMember(selectedTeam.id, member.membershipId)}
                                  >
                                    Hapus dari Tim
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </SidebarProvider>
  );
}

export default function MembersPage() {
  return (
    <JobsProvider>
      <TeamsProvider>
        <InboxProvider>
          <MembersProvider>
            <MembersContent />
          </MembersProvider>
        </InboxProvider>
      </TeamsProvider>
    </JobsProvider>
  );
}
