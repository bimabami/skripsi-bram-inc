"use client";

import * as React from "react";
import {
  Search,
  Inbox,
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreateTeamDialog } from "./create-team-dialog";
import { useTeams } from "@/contexts/teams-context";
import { useInbox } from "@/contexts/inbox-context";
import { useAuth } from "@/contexts/auth-context";
import { useMembersContext } from "@/contexts/members-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TeamActions } from "./team-actions";
import { TopicActions } from "./topic-actions";
import { SubTopicActions } from "./subtopic-actions";
import { InboxDrawer } from "./inbox-drawer";
import { SearchDrawer } from "./search-drawer";
import { MembersDrawer } from "./members-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const { teams, addTopic, addSubTopic, setSelectedSubTopic, setSelectedTeam } = useTeams();
  const { unreadCount } = useInbox();
  const { user, logout } = useAuth();
  const { fetchTeamMembers, currentUserRole } = useMembersContext();
  const [inboxOpen, setInboxOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const [openTeams, setOpenTeams] = React.useState<Record<string, boolean>>({});
  const [addingTopic, setAddingTopic] = React.useState<string | null>(null);
  const [addingSubTopic, setAddingSubTopic] = React.useState<{
    teamId: string;
    topicId: string;
  } | null>(null);
  const [newTopicName, setNewTopicName] = React.useState("");
  const [newSubTopicName, setNewSubTopicName] = React.useState("");
  
  // Check if current user is a manager
  const isManager = currentUserRole === "MANAGER";

  // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubTopicClick = (
    teamId: string,
    topicId: string,
    subTopicId: string,
    subTopicName: string,
    subTopicDescription: string,
    teamName: string,
    topicName: string,
  ) => {
    // Set selected team when clicking subtopic
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      // Fetch team members and set current user's role for this team
      fetchTeamMembers(teamId);
    }
    
    setSelectedSubTopic({
      teamId,
      topicId,
      subTopicId,
      subTopicName,
      subTopicDescription,
      teamName,
      topicName,
      selectedJobId: undefined,
    });
  };

  const toggleTeam = (teamId: string) => {
    setOpenTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
    
    // Set selected team when toggling
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeam(team);
      // Fetch team members and set current user's role for this team
      fetchTeamMembers(teamId);
    }
  };

  const handleAddTopic = (teamId: string) => {
    if (newTopicName.trim()) {
      addTopic(teamId, newTopicName);
      setNewTopicName("");
      setAddingTopic(null);
    }
  };

  const handleAddSubTopic = (teamId: string, topicId: string) => {
    if (newSubTopicName.trim()) {
      addSubTopic(teamId, topicId, newSubTopicName);
      setNewSubTopicName("");
      setAddingSubTopic(null);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-gray-100 rounded-lg p-1 -m-1 transition-colors">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarFallback className="rounded-lg bg-gray-700 text-white">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{user?.name || "User"}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${user?.role === "MANAGER" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                    {user?.role || "STAFF"}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 pt-0 border-b">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSearchOpen(true)}>
                <Search />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setInboxOpen(true)}>
                <Inbox />
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <Badge className="ml-auto h-5 w-5 flex items-center justify-center rounded-[4px] bg-yellow-500 text-xs font-semibold text-black hover:bg-yellow-500">
                    {unreadCount}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setMembersOpen(true)}>
                <Users />
                <span>Anggota</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SearchDrawer open={searchOpen} onOpenChange={setSearchOpen} />
        <InboxDrawer open={inboxOpen} onOpenChange={setInboxOpen} />
        <MembersDrawer open={membersOpen} onOpenChange={setMembersOpen} />

        {/* Teams List */}
        {teams.map((team) => (
          <SidebarGroup key={team.id} className="px-4 pt-2 group">
            <div className="flex items-center justify-between">
              <SidebarGroupLabel className="text-xs uppercase text-gray-500">
                {team.name}
              </SidebarGroupLabel>
              <TeamActions team={team} />
            </div>
            <SidebarMenu>
              {team.topics.map((topic) => (
                <Collapsible
                  key={topic.id}
                  open={openTeams[topic.id]}
                  onOpenChange={() => toggleTeam(topic.id)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between w-full group">
                        <SidebarMenuButton className="flex-1">
                          {openTeams[topic.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Layers className="h-4 w-4" />
                          <span>{topic.name}</span>
                        </SidebarMenuButton>
                        <TopicActions teamId={team.id} topic={topic} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-6">
                        {topic.subTopics.map((subTopic) => (
                          <SidebarMenuSubItem
                            key={subTopic.id}
                            className="group"
                          >
                            <div className="flex items-center justify-between w-full">
                              <SidebarMenuSubButton
                                className="flex-1"
                                onClick={() =>
                                  handleSubTopicClick(
                                    team.id,
                                    topic.id,
                                    subTopic.id,
                                    subTopic.name,
                                    subTopic.description,
                                    team.name,
                                    topic.name,
                                  )
                                }
                              >
                                <Layers className="h-4 w-4" />
                                <span>{subTopic.name}</span>
                              </SidebarMenuSubButton>
                              <SubTopicActions
                                teamId={team.id}
                                topicId={topic.id}
                                subTopic={subTopic}
                              />
                            </div>
                          </SidebarMenuSubItem>
                        ))}
                        {/* Add SubTopic Button - Only for managers */}
                        {isManager && (addingSubTopic?.teamId === team.id &&
                        addingSubTopic?.topicId === topic.id ? (
                          <SidebarMenuSubItem>
                            <input
                              type="text"
                              value={newSubTopicName}
                              onChange={(e) =>
                                setNewSubTopicName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleAddSubTopic(team.id, topic.id);
                                if (e.key === "Escape") setAddingSubTopic(null);
                              }}
                              onBlur={() =>
                                handleAddSubTopic(team.id, topic.id)
                              }
                              placeholder="Nama Sub Topik"
                              className="h-7 w-full px-2 text-sm border rounded"
                              autoFocus
                            />
                          </SidebarMenuSubItem>
                        ) : (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton
                              onClick={() =>
                                setAddingSubTopic({
                                  teamId: team.id,
                                  topicId: topic.id,
                                })
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Tambah Sub Topik</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}

              {/* Add Topic Button - Only for managers */}
              {isManager && (addingTopic === team.id ? (
                <SidebarMenuItem>
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTopic(team.id);
                      if (e.key === "Escape") setAddingTopic(null);
                    }}
                    onBlur={() => handleAddTopic(team.id)}
                    placeholder="Nama Topik"
                    className="h-8 w-full px-2 text-sm border rounded"
                    autoFocus
                  />
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setAddingTopic(team.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Topik</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}

        {/* Create Team Section - Only for managers */}
        {isManager && (
          <SidebarGroup className="px-4 pt-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateTeamDialog>
                  <SidebarMenuButton className="bg-gray-100 hover:bg-gray-200">
                    <span className="font-light">Buat Tim Baru di sini!</span>
                    <Plus className="h-4 w-4 ml-auto" />
                  </SidebarMenuButton>
                </CreateTeamDialog>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
