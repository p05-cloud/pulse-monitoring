import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface WebSocketEvents {
  'monitor:status': (data: { monitorId: string; status: string; timestamp: string }) => void;
  'incident:created': (data: { incident: any }) => void;
  'incident:resolved': (data: { incident: any }) => void;
  'check:completed': (data: { monitorId: string; result: any }) => void;
}

export function useWebSocket(events?: Partial<WebSocketEvents>) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    socketRef.current = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Register custom event handlers
    if (events) {
      if (events['monitor:status']) {
        socket.on('monitor:status', events['monitor:status']);
      }
      if (events['incident:created']) {
        socket.on('incident:created', (data) => {
          events['incident:created']?.(data);
          toast.error(`New incident: ${data.incident.monitor?.name}`);
        });
      }
      if (events['incident:resolved']) {
        socket.on('incident:resolved', (data) => {
          events['incident:resolved']?.(data);
          toast.success(`Incident resolved: ${data.incident.monitor?.name}`);
        });
      }
      if (events['check:completed']) {
        socket.on('check:completed', events['check:completed']);
      }
    }

    return () => {
      socket.disconnect();
    };
  }, [events]);

  return socketRef.current;
}
