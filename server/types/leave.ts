export interface LeaveType {
  id: string;
  name: string;
  max_per_year: number;
  created_at: string;
}

export interface EmployeeLeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  total_leaves: number;
  used_leaves: number;
  remaining_leaves: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
  is_backdated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeavePolicy {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestWithDetails extends LeaveRequest {
  leave_type?: LeaveType;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface LeaveAnalytics {
  total_requests: number;
  pending_requests: number;
  employees_on_leave_today: number;
  leaves_this_month: number;
}
