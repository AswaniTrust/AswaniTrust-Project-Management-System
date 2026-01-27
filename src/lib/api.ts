// API Client - Replaces Supabase client

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async upload(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<any> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  // Auth endpoints
  auth = {
    signUp: (email: string, password: string, name: string) =>
      this.request<{ user: any; token: string }>('/auth/signup', { method: 'POST', body: { email, password, name } }),
    
    signIn: (email: string, password: string) =>
      this.request<{ user: any; token: string }>('/auth/signin', { method: 'POST', body: { email, password } }),
    
    getUser: () => this.request<{ user: any; permissions: any[] }>('/auth/me'),
    
    changePassword: (currentPassword: string, newPassword: string) =>
      this.request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
    
    updateProfile: (data: { name?: string; avatar_url?: string; designation?: string }) =>
      this.request('/auth/profile', { method: 'PUT', body: data }),
  };

  // Companies endpoints
  companies = {
    getAll: () => this.request<any[]>('/companies'),
    getById: (id: string) => this.request<any>(`/companies/${id}`),
    create: (data: { name: string; logo?: string }) =>
      this.request<any>('/companies', { method: 'POST', body: data }),
    update: (id: string, data: { name?: string; logo?: string }) =>
      this.request<any>(`/companies/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => this.request(`/companies/${id}`, { method: 'DELETE' }),
  };

  // Projects endpoints
  projects = {
    getAll: (companyId?: string) =>
      this.request<any[]>(`/projects${companyId ? `?company_id=${companyId}` : ''}`),
    getById: (id: string) => this.request<any>(`/projects/${id}`),
    create: (data: { company_id: string; name: string; type: string; description?: string }) =>
      this.request<any>('/projects', { method: 'POST', body: data }),
    update: (id: string, data: any) =>
      this.request<any>(`/projects/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => this.request(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (projectId: string, memberId: string) =>
      this.request(`/projects/${projectId}/members`, { method: 'POST', body: { member_id: memberId } }),
    removeMember: (projectId: string, memberId: string) =>
      this.request(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
  };

  // Tasks endpoints
  tasks = {
    getAll: (filters?: { project_id?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.project_id) params.append('project_id', filters.project_id);
      if (filters?.status) params.append('status', filters.status);
      return this.request<any[]>(`/tasks?${params.toString()}`);
    },
    getById: (id: string) => this.request<any>(`/tasks/${id}`),
    create: (data: any) => this.request<any>('/tasks', { method: 'POST', body: data }),
    update: (id: string, data: any) => this.request<any>(`/tasks/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => this.request(`/tasks/${id}`, { method: 'DELETE' }),
    addComment: (taskId: string, content: string) =>
      this.request(`/tasks/${taskId}/comments`, { method: 'POST', body: { content } }),
  };

  // Bugs endpoints
  bugs = {
    getAll: (filters?: { task_id?: string; status?: string }) => {
      const params = new URLSearchParams();
      if (filters?.task_id) params.append('task_id', filters.task_id);
      if (filters?.status) params.append('status', filters.status);
      return this.request<any[]>(`/bugs?${params.toString()}`);
    },
    getById: (id: string) => this.request<any>(`/bugs/${id}`),
    create: (data: any) => this.request<any>('/bugs', { method: 'POST', body: data }),
    update: (id: string, data: any) => this.request<any>(`/bugs/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => this.request(`/bugs/${id}`, { method: 'DELETE' }),
    addComment: (bugId: string, content: string) =>
      this.request(`/bugs/${bugId}/comments`, { method: 'POST', body: { content } }),
  };

  // Team endpoints
  team = {
    getMembers: () => this.request<any[]>('/team/members'),
    getStats: () => this.request<any[]>('/team/stats'),
    createMember: (data: { name: string; email: string; password: string; role: string; designation?: string }) =>
      this.request<any>('/team/members', { method: 'POST', body: data }),
    updateRole: (memberId: string, role: string) =>
      this.request(`/team/members/${memberId}/role`, { method: 'PUT', body: { role } }),
    getPermissions: () => this.request<any[]>('/team/permissions'),
    updatePermission: (data: { role: string; permission_key: string; can_view: boolean; can_edit: boolean }) =>
      this.request('/team/permissions', { method: 'PUT', body: data }),
  };

  // Timesheets endpoints
  timesheets = {
    getAll: (filters?: { user_id?: string; start_date?: string; end_date?: string }) => {
      const params = new URLSearchParams();
      if (filters?.user_id) params.append('user_id', filters.user_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      return this.request<any[]>(`/timesheets?${params.toString()}`);
    },
    getMy: (filters?: { start_date?: string; end_date?: string }) => {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      return this.request<any[]>(`/timesheets/my?${params.toString()}`);
    },
    create: (data: any) => this.request<any>('/timesheets', { method: 'POST', body: data }),
    update: (id: string, data: any) => this.request<any>(`/timesheets/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => this.request(`/timesheets/${id}`, { method: 'DELETE' }),
  };

  // Uploads endpoints
  uploads = {
    upload: (file: File, projectId?: string, taskId?: string) => {
      const additionalData: Record<string, string> = {};
      if (projectId) additionalData.project_id = projectId;
      if (taskId) additionalData.task_id = taskId;
      return this.upload('/uploads', file, additionalData);
    },
    getAll: (filters?: { project_id?: string; task_id?: string }) => {
      const params = new URLSearchParams();
      if (filters?.project_id) params.append('project_id', filters.project_id);
      if (filters?.task_id) params.append('task_id', filters.task_id);
      return this.request<any[]>(`/uploads?${params.toString()}`);
    },
    delete: (id: string) => this.request(`/uploads/${id}`, { method: 'DELETE' }),
  };
}

export const api = new ApiClient(API_BASE_URL);
export default api;
