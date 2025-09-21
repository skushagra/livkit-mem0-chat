"use client"

import * as React from "react"
import { Camera, Command, MessageCircleMoreIcon, Mic, Plus } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Chat, CreateChatResponse, GetChatsResponse } from "@/types/chat"

// This is sample data
const data = {
  user: {
    name: "Kushagra S",
    email: "kushagra.rigel@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Your Chats",
      url: "#",
      icon: MessageCircleMoreIcon,
      isActive: true,
    },
    {
      title: "Video",
      url: "#",
      icon: Camera,
      isActive: false,
    },
    {
      title: "Voice",
      url: "#",
      icon: Mic,
      isActive: false,
    }
  ],
  chats: [
    {
      name: "William Smith",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
    },
    {
      name: "Alice Smith",
      subject: "Project Update Discussion",
      date: "Yesterday",
    },
    {
      name: "Bob Johnson",
      subject: "Weekend Plans",
      date: "2 days ago",
    },
    {
      name: "Emily Davis",
      subject: "Budget Questions",
      date: "2 days ago",
    },
    {
      name: "Michael Wilson",
      subject: "Important Announcement",
      date: "1 week ago",
    },
    {
      name: "Sarah Brown",
      subject: "Proposal Feedback",
      date: "1 week ago",
    },
    {
      name: "David Lee",
      subject: "New Project Idea",
      date: "1 week ago",
    },
    {
      name: "Olivia Wilson",
      subject: "Vacation Plans",
      date: "1 week ago",
    },
    {
      name: "James Martin",
      subject: "Conference Registration",
      date: "1 week ago",
    },
    {
      name: "Sophia White",
      subject: "Team Dinner",
      date: "1 week ago",
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onChatSelect?: (chat: Chat) => void;
}

export function AppSidebar({ onChatSelect, ...props }: AppSidebarProps) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0])
  const [chats, setChats] = React.useState<Chat[]>([])
  const [loading, setLoading] = React.useState(false)
  const { setOpen } = useSidebar()

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats')
      const data: GetChatsResponse = await response.json()

      if (data.success && data.chats) {
        setChats(data.chats)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  // Create new chat via API
  const createNewChat = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New AI Chat',
          subject: 'Start a conversation with AI'
        })
      })

      const data: CreateChatResponse = await response.json()

      if (data.success && data.chat) {
        setChats([data.chat, ...chats])
        // Auto-select the newly created chat
        onChatSelect?.(data.chat)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch chats on component mount
  React.useEffect(() => {
    fetchChats()
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Acme Inc</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        // Instead of randomizing static data, just fetch fresh data
                        fetchChats()
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
          </div>
          <div className="flex gap-2">
            <SidebarInput placeholder="Type to search..." className="flex-1" />
            <Button
              onClick={createNewChat}
              size="sm"
              className="h-8 w-8 p-0"
              variant="outline"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {chats.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No chats yet. Create your first AI chat!
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat._id?.toString() || chat.name}
                    onClick={() => onChatSelect?.(chat)}
                    className="w-full text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span>{chat.name}</span>{" "}
                      <span className="ml-auto text-xs">{chat.date}</span>
                    </div>
                    <span className="font-medium">{chat.subject}</span>
                  </button>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
