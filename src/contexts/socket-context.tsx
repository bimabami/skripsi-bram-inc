"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinTeam: (teamId: string) => void;
  leaveTeam: (teamId: string) => void;
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Get the socket URL based on environment
function getSocketUrl(): string {
  // If we're on the server (SSR), return empty
  if (typeof window === "undefined") return "";
  
  // Use NEXT_PUBLIC_SOCKET_URL if set
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // Otherwise, use the same host as the current page but with port 5000
  const { protocol, hostname } = window.location;
  const wsProtocol = protocol === "https:" ? "https:" : "http:";
  return `${wsProtocol}//${hostname}:5000`;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketUrl = getSocketUrl();
    if (!socketUrl) return;
    
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      
      // Join user-specific room for notifications
      if (user?.id) {
        newSocket.emit("join-user", user.id);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  const joinTeam = useCallback((teamId: string) => {
    if (socket && isConnected) {
      socket.emit("join-team", teamId);
    }
  }, [socket, isConnected]);

  const leaveTeam = useCallback((teamId: string) => {
    if (socket && isConnected) {
      socket.emit("leave-team", teamId);
    }
  }, [socket, isConnected]);

  const joinTask = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit("join-task", taskId);
    }
  }, [socket, isConnected]);

  const leaveTask = useCallback((taskId: string) => {
    if (socket && isConnected) {
      socket.emit("leave-task", taskId);
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinTeam, leaveTeam, joinTask, leaveTask }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
