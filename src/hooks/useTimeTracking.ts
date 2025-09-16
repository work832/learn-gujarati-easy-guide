import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseTimeTrackingOptions {
  pageName?: string;
  trackActivities?: boolean;
}

export const useTimeTracking = (options: UseTimeTrackingOptions = {}) => {
  const { user } = useAuth();
  const { pageName = 'unknown', trackActivities = true } = options;
  
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pageVisitsRef = useRef<Record<string, number>>({});
  const activitiesRef = useRef<number>(0);
  const [isTracking, setIsTracking] = useState(false);

  // Start session when user is available
  useEffect(() => {
    if (user && !sessionIdRef.current) {
      startSession();
    }

    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
    };
  }, [user]);

  // Track page visits
  useEffect(() => {
    if (sessionIdRef.current && pageName !== 'unknown') {
      pageVisitsRef.current[pageName] = (pageVisitsRef.current[pageName] || 0) + 1;
    }
  }, [pageName]);

  // Update session every 30 seconds
  useEffect(() => {
    if (!sessionIdRef.current || !startTimeRef.current) return;

    const interval = setInterval(() => {
      updateSession();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [sessionIdRef.current]);

  const startSession = async () => {
    if (!user) return;

    try {
      startTimeRef.current = new Date();
      pageVisitsRef.current = { [pageName]: 1 };
      activitiesRef.current = 0;

      const { data, error } = await supabase
        .from('app_usage_sessions')
        .insert({
          user_id: user.id,
          session_start: startTimeRef.current.toISOString(),
          page_visits: pageVisitsRef.current,
          activities_completed: 0
        })
        .select('id')
        .single();

      if (error) throw error;
      
      sessionIdRef.current = data.id;
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start session tracking:', error);
    }
  };

  const updateSession = async () => {
    if (!sessionIdRef.current || !startTimeRef.current) return;

    try {
      const currentTime = new Date();
      const totalMinutes = Math.floor((currentTime.getTime() - startTimeRef.current.getTime()) / 60000);

      await supabase
        .from('app_usage_sessions')
        .update({
          total_time_minutes: totalMinutes,
          page_visits: pageVisitsRef.current,
          activities_completed: activitiesRef.current
        })
        .eq('id', sessionIdRef.current);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const endSession = async () => {
    if (!sessionIdRef.current || !startTimeRef.current) return;

    try {
      const endTime = new Date();
      const totalMinutes = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 60000);

      await supabase
        .from('app_usage_sessions')
        .update({
          session_end: endTime.toISOString(),
          total_time_minutes: totalMinutes,
          page_visits: pageVisitsRef.current,
          activities_completed: activitiesRef.current
        })
        .eq('id', sessionIdRef.current);

      sessionIdRef.current = null;
      startTimeRef.current = null;
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const incrementActivity = () => {
    if (trackActivities) {
      activitiesRef.current += 1;
    }
  };

  const getSessionStats = () => ({
    isTracking,
    sessionId: sessionIdRef.current,
    totalTime: startTimeRef.current 
      ? Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 60000)
      : 0,
    activitiesCompleted: activitiesRef.current,
    pageVisits: { ...pageVisitsRef.current }
  });

  return {
    isTracking,
    incrementActivity,
    getSessionStats,
    endSession
  };
};