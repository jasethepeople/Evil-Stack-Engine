import { useState, useEffect, useRef } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  agent: string;
  message: string;
}

export function useLogStream(maxLines = 100) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource('/api/logs/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data) as LogEntry;
        setLogs((prev) => {
          const updated = [...prev, newLog];
          if (updated.length > maxLines) {
            return updated.slice(updated.length - maxLines);
          }
          return updated;
        });
      } catch (e) {
        console.error('Failed to parse log entry', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [maxLines]);

  useEffect(() => {
    if (isAutoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  return {
    logs,
    containerRef,
    isAutoScroll,
    setIsAutoScroll
  };
}
