import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API_BASE = '/api';

export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      // Check cache first
      const cached = sessionStorage.getItem('leaveTypes');
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await fetch(`${API_BASE}/leave/policies`);
      if (!response.ok) throw new Error('Failed to fetch leave types');
      const data = await response.json();
      const types = data.types || [];
      
      // Cache for session
      sessionStorage.setItem('leaveTypes', JSON.stringify(types));
      return types;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useLeaveBalance = (year?: number) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to balance changes using realtime
    const channel = supabase.channel(`balance_${user.id}`).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'employee_leave_balance',
        filter: `employee_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('[useLeaveBalance] Real-time update received:', payload);
        queryClient.invalidateQueries({ queryKey: ['leaveBalance', year] });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, year, queryClient]);

  return useQuery({
    queryKey: ['leaveBalance', year],
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
    queryFn: async () => {
      const params = year ? `?year=${year}` : '';
      const response = await fetch(`${API_BASE}/leave/balance${params}`, {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useLeavePolicies = () => {
  return useQuery({
    queryKey: ['leavePolicies'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/leave/policies`);
      if (!response.ok) throw new Error('Failed to fetch policies');
      const data = await response.json();
      return data.policies || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useEmployeeLeaveRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      return;
    }

    // Subscribe to leave request changes
    const channel = supabase.channel(`requests_${user.id}`).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
        filter: `employee_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('[useEmployeeLeaveRequests] Real-time update received:', payload);
        queryClient.invalidateQueries({ queryKey: ['employeeLeaveRequests'] });
        queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['employeeLeaveRequests'],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      const response = await fetch(`${API_BASE}/leave/my-requests`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useEmployeeLeaveRequests] API error:', errorText);
        throw new Error('Failed to fetch leave requests');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useApplyForLeave = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => {
      const response = await fetch(`${API_BASE}/leave/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to apply for leave');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
    },
  });
};

export const useAllLeaveRequests = (filters?: { status?: string; employeeId?: string }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    // Subscribe to all leave request changes
    const channel = supabase.channel('all_requests').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['allLeaveRequests', filters] });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, filters, queryClient]);
  
  return useQuery({
    queryKey: ['allLeaveRequests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);

      const url = `${API_BASE}/admin/leave/requests?${params}`;

      const response = await fetch(url, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error('Failed to fetch leave requests');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && profile?.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useApproveLeave = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (data: { leaveRequestId: string; adminComment?: string }) => {
      const response = await fetch(`${API_BASE}/admin/leave/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to approve leave');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['employeesOnLeaveToday'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      queryClient.invalidateQueries({ queryKey: ['employeeLeaveRequests'] });
    },
  });
};

export const useRejectLeave = () => {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (data: { leaveRequestId: string; adminComment: string }) => {
      const response = await fetch(`${API_BASE}/admin/leave/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to reject leave');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveAnalytics'] });
    },
  });
};

export const useEmployeesOnLeaveToday = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    // Subscribe to leave request changes
    const channel = supabase.channel('on_leave_today').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['employeesOnLeaveToday'] });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, queryClient]);

  return useQuery({
    queryKey: ['employeesOnLeaveToday'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/leave/employees-on-leave`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employees on leave');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && profile?.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLeaveAnalytics = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    // Subscribe to leave request changes
    const channel = supabase.channel('analytics').on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['leaveAnalytics'] });
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role, queryClient]);

  return useQuery({
    queryKey: ['leaveAnalytics'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/leave/analytics`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!user && profile?.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useEmployeeLeaveBalance = (employeeId?: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['employeeLeaveBalance', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const response = await fetch(`${API_BASE}/admin/leave/requests?employeeId=${employeeId}`, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employee leave balance');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && profile?.role === 'admin' && !!employeeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useEmployeeLeaveBalanceCards = (employeeId?: string) => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['employeeLeaveBalanceCards', employeeId],
    queryFn: async () => {
      if (!employeeId) {
        return [];
      }
      
      const url = `${API_BASE}/leave/balance?employeeId=${employeeId}`;
      
      const response = await fetch(url, {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-role': profile?.role || '',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useEmployeeLeaveBalanceCards] API error:', errorText);
        throw new Error('Failed to fetch employee leave balance cards');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && profile?.role === 'admin' && !!employeeId,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};