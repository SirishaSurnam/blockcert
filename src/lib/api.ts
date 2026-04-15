import {
  User,
  UserRole,
  Credential,
  Badge,
  SkillTree,
  Achievement,
  StudentAnalytics,
  FacultyAnalytics,
  AdminAnalytics,
  VerificationResult,
  LeaderboardEntry,
  Notification,
  Mentor,
  ApiResponse,
  PaginatedResponse,
} from '@/types';
import { API_BASE_URL } from './constants';

// Helper to transform _id to id for MongoDB documents
function transformId<T extends Record<string, any>>(item: T): T & { id: string } {
  if (item && item._id !== undefined) {
    return { ...item, id: item._id.toString() } as T & { id: string };
  }
  return item as T & { id: string };
}

// Helper to transform array of items with _id to id
function transformArray<T extends Record<string, any>>(items: T[]): (T & { id: string })[] {
  return Array.isArray(items) ? items.map(item => transformId(item)) : [];
}

// Get token from localStorage
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('blockcert_token');
  }
  return null;
}

// API Helper
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Debug log
    console.log(`🌐 API Request: ${options?.method || 'GET'} ${endpoint}`);
    console.log(`🔑 Token present: ${!!token}`);

    const response = await fetch(url, {
      headers,
      ...options,
    });

    const data = await response.json().catch(() => ({}));
    console.log(`📥 API Response:`, data);

    if (!response.ok) {
      console.error(`❌ API Error (${response.status}):`, data);
      const errorMessage = data.error || data.message || data.msg || `HTTP Error: ${response.status}`;
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
      };
    }

    // Return the FULL response, not just data
    // This preserves fields like 'token' that are at the top level
    // Transform _id to id for MongoDB documents
    const responseData = data.data || data;
    const transformedData = Array.isArray(responseData) 
      ? transformArray(responseData) 
      : transformId(responseData);
    return { success: true, ...data, data: transformedData };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiRequest<{
      data: {
        userId: string;
        email: string;
        walletAddress: string;
        userType: string;
        firstName: string;
        lastName: string;
        hasRealWallet?: boolean;
      };
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('🔍 Login API response:', response);

    if (response.success) {
      // Token is at top level of response, not inside data
      const token = (response as unknown as { token?: string }).token;
      const userData = response.data;

      console.log('🔑 Extracted token:', token);
      console.log('👤 Extracted user data:', userData);

      if (!token) {
        console.error('❌ No token found in response');
        return { success: false, error: 'No token received from server' };
      }

      const userInfo: any = userData?.data || userData;
      const transformedUser: User = {
        id: userInfo?.userId || '',
        email: userInfo?.email || '',
        role: (userInfo?.userType as UserRole) || 'student',
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        fullName: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim(),
        walletAddress: userInfo?.walletAddress,
        hasRealWallet: userInfo?.hasRealWallet || false,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: { user: transformedUser, token },
      };
    }

    return response as unknown as ApiResponse<{ user: User; token: string }>;
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    // Institute creation for admin
    instituteName?: string;
    instituteCode?: string;
    instituteDomain?: string;
    // Institute selection for student/faculty
    instituteId?: string;
    // College ID for student/faculty
    collegeId?: string;
  }): Promise<ApiResponse<{ user: User; token: string; requiresApproval?: boolean }>> => {
    const response = await apiRequest<{
      data: {
        userId: string;
        email: string;
        walletAddress: string;
        userType: string;
        firstName: string;
        lastName: string;
        hasRealWallet?: boolean;
      };
      token: string;
      message?: string;
      requiresApproval?: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.role,
        instituteName: data.instituteName,
        instituteCode: data.instituteCode,
        instituteDomain: data.instituteDomain,
        instituteId: data.instituteId,
        collegeId: data.collegeId,
      }),
    });

    console.log('🔍 Register API response:', response);

    if (response.success) {
      // Cast response to any to handle different response structures
      const res = response as any;
      const token = res.token;
      const userData = res.data;
      const requiresApproval = res.requiresApproval;

      console.log('🔑 Extracted token:', token);
      console.log('👤 Extracted user data:', userData);
      console.log('⏳ Requires approval:', requiresApproval);

      // If no token but requiresApproval is true, return success with requiresApproval flag
      if (!token && requiresApproval) {
        return {
          success: true,
          requiresApproval: true,
          message: 'Registration pending admin approval'
        } as any;
      }

      if (!token) {
        console.error('❌ No token found in response');
        return { success: false, error: 'No token received from server' };
      }

      const userInfo: any = userData?.data || userData;
      const transformedUser: User = {
        id: userInfo?.userId || '',
        email: userInfo?.email || '',
        role: (userInfo?.userType as UserRole) || 'student',
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        fullName: `${userInfo?.firstName || ''} ${userInfo?.lastName || ''}`.trim(),
        walletAddress: userInfo?.walletAddress,
        hasRealWallet: userInfo?.hasRealWallet || false,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: { user: transformedUser, token },
      };
    }

    return response as unknown as ApiResponse<{ user: User; token: string }>;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await apiRequest<{ data: User }>('/auth/me');

    if (response.success && response.data) {
      const userData: any = response.data.data || response.data;
      const transformedUser: User = {
        id: userData.userId || userData.id || '',
        email: userData.email || '',
        role: userData.userType || userData.role || 'student',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        walletAddress: userData.walletAddress,
        hasRealWallet: userData.hasRealWallet || false,
        createdAt: userData.createdAt || new Date().toISOString(),
        isVerified: userData.isVerified || false,
        profile: userData.profile,
        preferredCareerPath: userData.preferredCareerPath || ''
      };

      return { success: true, data: transformedUser };
    }

    return response as unknown as ApiResponse<User>;
  },

  saveCareerPath: async (careerPath: string): Promise<ApiResponse<{ preferredCareerPath: string }>> => {
    return apiRequest<{ preferredCareerPath: string }>('/auth/career-path', {
      method: 'PUT',
      body: JSON.stringify({ careerPath }),
    });
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  connectWallet: async (walletAddress: string): Promise<ApiResponse<{ walletAddress: string; hasRealWallet: boolean }>> => {
    return apiRequest<{ walletAddress: string; hasRealWallet: boolean }>('/auth/wallet', {
      method: 'PUT',
      body: JSON.stringify({ walletAddress }),
    });
  },

  disconnectWallet: async (): Promise<ApiResponse<{ walletAddress: string; hasRealWallet: boolean }>> => {
    return apiRequest<{ walletAddress: string; hasRealWallet: boolean }>('/auth/wallet', {
      method: 'DELETE',
    });
  },
};

// Credentials API
export const credentialsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    studentAddress?: string;
    issuerAddress?: string;
    revoked?: boolean;
  }): Promise<PaginatedResponse<Credential>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.studentAddress) queryParams.set('studentAddress', params.studentAddress);
    if (params?.issuerAddress) queryParams.set('issuerAddress', params.issuerAddress);
    if (params?.revoked !== undefined) queryParams.set('revoked', params.revoked.toString());

    const response = await apiRequest<{ data: Credential[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/credentials?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      } as PaginatedResponse<Credential>;
    }

    return { success: false, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  getById: async (id: string): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>(`/credentials/${id}`);
  },

  getMyCredentials: async (): Promise<ApiResponse<Credential[]>> => {
    const response = await apiRequest<{ data: Credential[] }>('/credentials/my-credentials');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  // Student submits credential for verification
  submitForVerification: async (data: {
    title: string;
    description?: string;
    skills?: string | string[];
    category?: string;
    verificationLink?: string;
    verificationType?: string;
  }): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>('/credentials/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload document for a credential
  uploadDocument: async (credentialId: string, file: File): Promise<ApiResponse<{ documentUrl: string; originalFileName: string }>> => {
    console.log('=== UPLOAD DOCUMENT START ===');
    console.log('Credential ID:', credentialId);
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('credentialId', credentialId);
    
    // Check both possible token keys
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('blockcert_token') || localStorage.getItem('token');
    }
    console.log('Token present:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'none');
    
    const url = `${API_BASE_URL}/credentials/upload-document`;
    console.log('Upload URL:', url);
    console.log('FormData entries:', Array.from(formData.entries()).map(([k, v]) => [k, typeof v === 'object' ? `File(${v.name})` : v]));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('Response text (first 500 chars):', text.substring(0, 500));
      
      if (!text) {
        console.error('Empty response from server');
        return { success: false, error: 'Empty response from server' };
      }
      
      const data = JSON.parse(text);
      console.log('Parsed JSON data:', data);
      
      if (response.ok && data.success) {
        console.log('Upload successful!');
        return { success: true, data: data.data };
      }
      
      console.error('Upload failed:', data.error || 'Unknown error');
      return { success: false, error: data.error || 'Upload failed' };
    } catch (err) {
      console.error('Upload fetch error:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Network error' };
    }
  },

  // Faculty/Admin issues verified credential directly
  issue: async (data: {
    studentAddress: string;
    title: string;
    description?: string;
    skills?: string[];
    category?: string;
    course?: string;
    grade?: string;
    metadataURI?: string;
  }): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Legacy alias for issue
  submit: async (data: {
    studentAddress: string;
    title: string;
    description?: string;
    skills?: string[];
    category?: string;
    course?: string;
    grade?: string;
    metadataURI?: string;
  }): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>('/credentials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPending: async (): Promise<ApiResponse<Credential[]>> => {
    const response = await apiRequest<{ data: Credential[] }>('/credentials/pending');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  approve: async (id: string): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>(`/credentials/${id}/approve`, {
      method: 'POST',
    });
  },

  reject: async (id: string, reason: string): Promise<ApiResponse<Credential>> => {
    return apiRequest<Credential>(`/credentials/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  endorse: async (id: string): Promise<ApiResponse<{ endorsementCount: number }>> => {
    return apiRequest<{ endorsementCount: number }>(`/credentials/${id}/endorse`, {
      method: 'POST',
    });
  },

  // Fetch document as blob for viewing
  getDocument: async (id: string): Promise<{ success: boolean; blob?: Blob; fileName?: string; error?: string }> => {
    try {
      const url = `${API_BASE_URL}/credentials/document/${id}`;
      const token = getToken();

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'document';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="([^"]+)"/);
        if (matches) {
          fileName = matches[1];
        }
      }

      const blob = await response.blob();
      return { success: true, blob, fileName };
    } catch (error) {
      console.error('Document fetch error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  },
};

// Badges API
export const badgesApi = {
  getByStudent: async (address: string): Promise<ApiResponse<Badge[]>> => {
    const response = await apiRequest<{ success: boolean; badges: Badge[]; count: number }>(`/public/badges/${address}`);

    if (response.success && response.data && response.data.badges) {
      return { success: true, data: response.data.badges };
    }

    return { success: false, data: [] };
  },

  mint: async (data: {
    studentAddress: string;
    skillName: string;
    level: number;
    metadata?: Record<string, unknown>;
  }): Promise<ApiResponse<Badge>> => {
    return apiRequest<Badge>('/public/badges/mint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMilestones: async (address: string): Promise<ApiResponse<Achievement[]>> => {
    const response = await apiRequest<{ data: Achievement[] }>(`/public/badges/milestones/${address}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  getAnalytics: async (): Promise<ApiResponse<{ total: number; byCategory: Record<string, number> }>> => {
    return apiRequest<{ total: number; byCategory: Record<string, number> }>('/public/badges/analytics');
  },
};

// Skill Tree API
export const skillTreeApi = {
  getByStudent: async (address: string): Promise<ApiResponse<SkillTree>> => {
    const response = await apiRequest<{ data: SkillTree }>(`/skills/trees`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getTemplates: async (): Promise<ApiResponse<SkillTree[]>> => {
    const response = await apiRequest<{ data: SkillTree[] }>('/skills/trees');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  getProgress: async (): Promise<ApiResponse<{
    totalXP: number;
    totalLevel: number;
    progress: Array<{ category: string; completedSkills: string[]; xpEarned: number }>;
    credentialsCount: number;
  }>> => {
    const response = await apiRequest<{ data: {
      totalXP: number;
      totalLevel: number;
      progress: Array<{ category: string; completedSkills: string[]; xpEarned: number }>;
      credentialsCount: number;
    } }>('/skills/progress/me');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getMySkills: async (): Promise<ApiResponse<{ skills: string[]; credentialsCount: number; skillTreeNodes: number }>> => {
    const response = await apiRequest<{ data: { skills: string[]; credentialsCount: number; skillTreeNodes: number } }>('/skills/my-skills');
    
    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }
    
    return { success: false, data: { skills: [], credentialsCount: 0, skillTreeNodes: 0 } };
  },
};

// Analytics API
export const analyticsApi = {
  getStudent: async (): Promise<ApiResponse<StudentAnalytics>> => {
    const response = await apiRequest<{ data: StudentAnalytics }>('/public/analytics/student');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getFaculty: async (): Promise<ApiResponse<FacultyAnalytics>> => {
    const response = await apiRequest<{ data: FacultyAnalytics }>('/public/analytics/faculty');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getAdmin: async (): Promise<ApiResponse<AdminAnalytics>> => {
    const response = await apiRequest<{ data: AdminAnalytics }>('/public/analytics/admin');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getInstituteAnalytics: async (): Promise<ApiResponse<{
    overview: {
      totalStudents: number;
      totalFaculty: number;
      totalUsers: number;
      pendingStudents: number;
      pendingFaculty: number;
      totalPending: number;
      approvedStudents: number;
      approvedFaculty: number;
    };
    credentials: {
      total: number;
      verified: number;
      pending: number;
    };
    recentUsers: Array<{
      userId: string;
      email: string;
      role: string;
      status: string;
      firstName: string;
      lastName: string;
      createdAt: string;
    }>;
  }>> => {
    const response = await apiRequest<{ data: {
      overview: {
        totalStudents: number;
        totalFaculty: number;
        totalUsers: number;
        pendingStudents: number;
        pendingFaculty: number;
        totalPending: number;
        approvedStudents: number;
        approvedFaculty: number;
      };
      credentials: {
        total: number;
        verified: number;
        pending: number;
      };
      recentUsers: Array<{
        userId: string;
        email: string;
        role: string;
        status: string;
        firstName: string;
        lastName: string;
        createdAt: string;
      }>;
    } }>('/admin/institute-analytics');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getEmployer: async (): Promise<ApiResponse<{
    totalVerifications: number;
    recentVerifications: Credential[];
    topStudents: Array<{ name: string; credentials: number }>;
  }>> => {
    const response = await apiRequest<{ data: {
      totalVerifications: number;
      recentVerifications: Credential[];
      topStudents: Array<{ name: string; credentials: number }>;
    } }>('/public/analytics/employer');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },
};

// Verification API
export const verificationApi = {
  verifyCredential: async (credentialId: string): Promise<ApiResponse<VerificationResult>> => {
    const response = await apiRequest<{ data: VerificationResult }>(`/public/verify/${credentialId}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  verifyByQR: async (qrData: string): Promise<ApiResponse<VerificationResult>> => {
    const response = await apiRequest<{ data: VerificationResult }>('/public/verify-qr', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  batchVerify: async (credentialIds: string[]): Promise<ApiResponse<Array<{ id: string; verified: boolean }>>> => {
    const response = await apiRequest<{ data: Array<{ id: string; verified: boolean }> }>('/public/batch-verify', {
      method: 'POST',
      body: JSON.stringify({ credentialIds }),
    });

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  getPublicProfile: async (studentAddress: string): Promise<ApiResponse<{
    name: string;
    walletAddress: string;
    credentialCount: number;
    badges: Badge[];
    topSkills: string[];
  }>> => {
    const response = await apiRequest<{ data: {
      name: string;
      walletAddress: string;
      credentialCount: number;
      badges: Badge[];
      topSkills: string[];
    } }>(`/public/profile/${studentAddress}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  // Get profile QR code from backend
  getProfileQR: async (studentAddress: string, studentName?: string): Promise<ApiResponse<{
    qrCode: string;
    profileUrl: string;
  }>> => {
    const nameParam = studentName ? `?name=${encodeURIComponent(studentName)}` : '';
    const response = await apiRequest<{ data: {
      qrCode: string;
      profileUrl: string;
    } }>(`/public/qr/${studentAddress}${nameParam}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getStats: async (): Promise<ApiResponse<{
    totalCredentials: number;
    verifiedCredentials: number;
    totalStudents: number;
    totalBadges: number;
  }>> => {
    const response = await apiRequest<{ data: {
      totalCredentials: number;
      verifiedCredentials: number;
      totalStudents: number;
      totalBadges: number;
    } }>('/public/stats');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },
};

// Leaderboard API
export const leaderboardApi = {
  getAll: async (limit = 10): Promise<ApiResponse<LeaderboardEntry[]>> => {
    const response = await apiRequest<{ data: LeaderboardEntry[] }>(`/skills/leaderboard?limit=${limit}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  getMyRank: async (): Promise<ApiResponse<{
    rank: number;
    totalXP: number;
    credibilityScore: number;
    percentile: number;
  }>> => {
    const response = await apiRequest<{ data: {
      rank: number;
      totalXP: number;
      credibilityScore: number;
      percentile: number;
    } }>('/skills/rank/me');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },
};

// Credibility API
export const credibilityApi = {
  getScore: async (studentAddress: string): Promise<ApiResponse<{
    overallScore: number;
    tier: string;
    components: {
      verification: number;
      endorsement: number;
      activity: number;
      reputation: number;
      blockchain: number;
    };
    badges: string[];
  }>> => {
    const response = await apiRequest<{ credibility: {
      overallScore: number;
      tier: string;
      components: {
        verification: number;
        endorsement: number;
        activity: number;
        reputation: number;
        blockchain: number;
      };
      badges: string[];
    } }>(`/credibility/${studentAddress}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.credibility || response.data };
    }

    return { success: false };
  },

  getMyScore: async (): Promise<ApiResponse<{
    overall: number;
    tier: string;
    breakdown: Record<string, number>;
  }>> => {
    const response = await apiRequest<{ score: {
      overall: number;
      tier: string;
      breakdown: Record<string, number>;
    } }>('/credibility/my-score');

    if (response.success && response.data) {
      return { success: true, data: response.data.score || response.data };
    }

    return { success: false };
  },

  getLeaderboard: async (limit = 20): Promise<ApiResponse<LeaderboardEntry[]>> => {
    const response = await apiRequest<{ leaderboard: LeaderboardEntry[] }>(`/credibility/leaderboard/all?limit=${limit}`);

    if (response.success && response.data) {
      return { success: true, data: response.data.leaderboard || response.data };
    }

    return { success: false, data: [] };
  },
};

// Faculty API
export const facultyApi = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<{
    faculty: Array<{
      walletAddress: string;
      name: string;
      department: string;
      email: string;
    }>;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>> => {
    const response = await apiRequest<{
      data: Array<{
        walletAddress: string;
        name: string;
        department: string;
        email: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/faculty?page=${page}&limit=${limit}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          faculty: response.data.data || response.data,
          pagination: response.data.pagination || { page, limit, total: 0, pages: 0 },
        },
      };
    }

    return { success: false, data: { faculty: [], pagination: { page, limit, total: 0, pages: 0 } } };
  },

  getByAddress: async (address: string): Promise<ApiResponse<{
    walletAddress: string;
    name: string;
    department: string;
    email: string;
  }>> => {
    return apiRequest<{
      walletAddress: string;
      name: string;
      department: string;
      email: string;
    }>(`/faculty/${address}`);
  },

  add: async (data: {
    walletAddress: string;
    name: string;
    department: string;
    email: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>('/faculty', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  remove: async (address: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/faculty/${address}`, {
      method: 'DELETE',
    });
  },
};

// QR Code API - Student Profile QR only (shows all credentials when scanned)
export const qrApi = {
  // Generate profile QR for the logged-in student
  // This QR shows all credentials when scanned
  generateProfileQR: async (): Promise<ApiResponse<{
    qrCode: string;
    profileUrl: string;
    studentAddress: string;
    studentName: string;
  }>> => {
    const response = await apiRequest<{
      qrCode: string;
      profileUrl: string;
      studentAddress: string;
      studentName: string;
    }>('/public/qr/profile');

    if (response.success && response.data) {
      return { success: true, data: response.data };
    }

    return { success: false, error: response.error };
  },
};

// Export API
export const exportApi = {
  getCredentials: async (): Promise<ApiResponse<Credential[]>> => {
    const response = await apiRequest<{ data: Credential[] }>('/public/export/credentials');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  // Resume - Get resume/CV data
  getResume: async (): Promise<ApiResponse<any>> => {
    const response = await apiRequest<{ data: any }>('/public/resume');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: null };
  },

  // Resume - Download as HTML (professional format)
  downloadResumeAsHTML: async (): Promise<void> => {
    // First get the resume data
    const response = await apiRequest<{ data: any }>('/public/resume');

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch resume data');
    }

    const data: any = response.data;
    
    // Generate professional HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${data.personalInfo?.fullName || 'Student'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #fff; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .name { font-size: 32px; font-weight: bold; color: #1e293b; margin-bottom: 5px; }
        .title { font-size: 18px; color: #2563eb; margin-bottom: 10px; }
        .contact { font-size: 14px; color: #64748b; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #2563eb; padding-left: 10px; }
        .item { margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; }
        .item-title { font-weight: bold; font-size: 16px; color: #1e293b; }
        .item-subtitle { color: #2563eb; font-size: 14px; margin: 5px 0; }
        .item-date { color: #64748b; font-size: 12px; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-size: 13px; }
        .stats { display: flex; gap: 20px; justify-content: center; margin-top: 20px; }
        .stat { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #64748b; }
        .verified { display: inline-flex; align-items: center; gap: 5px; background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-size: 12px; }
        @media print { body { -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">${data.personalInfo?.fullName || 'Student'}</div>
            <div class="title">BlockChain Verified Resume</div>
            <div class="contact">
                ${data.personalInfo?.email || ''} ${data.personalInfo?.walletAddress ? ' | ' + data.personalInfo.walletAddress.slice(0, 6) + '...' + data.personalInfo.walletAddress.slice(-4) : ''}
            </div>
            ${data.personalInfo?.department ? `<div class="contact">${data.personalInfo.department}</div>` : ''}
            ${data.personalInfo?.bio ? `<div class="contact" style="margin-top: 10px;">${data.personalInfo.bio}</div>` : ''}
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-number">${data.statistics?.totalCredentials || 0}</div>
                <div class="stat-label">Total Credentials</div>
            </div>
            <div class="stat">
                <div class="stat-number">${data.statistics?.verifiedCredentials || 0}</div>
                <div class="stat-label">Verified</div>
            </div>
            <div class="stat">
                <div class="stat-number">${data.statistics?.uniqueSkills || 0}</div>
                <div class="stat-label">Skills</div>
            </div>
            <div class="stat">
                <div class="stat-number">${data.statistics?.totalEndorsements || 0}</div>
                <div class="stat-label">Endorsements</div>
            </div>
        </div>

        ${data.skills && data.skills.length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills">
                ${data.skills.map((s: any) => `<span class="skill">${s.name} (${s.count})</span>`).join('')}
            </div>
        </div>
        ` : ''}

        ${data.credentials && data.credentials.length > 0 ? `
        <div class="section">
            <div class="section-title">Credentials & Certifications</div>
            ${data.credentials.map((c: any) => `
            <div class="item">
                <div class="item-title">${c.title}</div>
                <div class="item-subtitle">${c.issuer || 'Unknown Issuer'}</div>
                <div class="item-date">Issued: ${new Date(c.issuedAt).toLocaleDateString()}</div>
                ${c.verified ? '<span class="verified">✓ Blockchain Verified</span>' : ''}
                ${c.skills && c.skills.length > 0 ? `<div style="margin-top: 8px; font-size: 13px; color: #64748b;">Skills: ${c.skills.join(', ')}</div>` : ''}
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
            This resume is verified on the blockchain • Generated by BlockCert
        </div>
    </div>
</body>
</html>`;

    // Download as HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${data.personalInfo?.fullName?.replace(/\s+/g, '-') || 'student'}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Notifications API (placeholder - requires backend implementation)
export const notificationsApi = {
  getAll: async (): Promise<ApiResponse<Notification[]>> => {
    // TODO: Implement notifications endpoint in backend
    return { success: true, data: [] };
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    // TODO: Implement notifications endpoint in backend
    return { success: true, data: {} as Notification };
  },

  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    // TODO: Implement notifications endpoint in backend
    return { success: true, data: { count: 0 } };
  },
};

// Mentors API (placeholder - requires backend implementation)
export const mentorsApi = {
  getAll: async (): Promise<ApiResponse<Mentor[]>> => {
    // TODO: Implement mentors endpoint in backend
    return { success: true, data: [] };
  },
};

// Achievements API
export const achievementsApi = {
  getAll: async (): Promise<ApiResponse<Achievement[]>> => {
    const response = await apiRequest<{ data: Achievement[] }>('/skills/achievements');
    
    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }
    
    return { success: false, data: [] };
  },
};

// Admin API - User Approval System
export const adminApi = {
  getPendingUsers: async (params?: { page?: number; limit?: number; role?: string }): Promise<PaginatedResponse<{
    userId: string;
    email: string;
    walletAddress: string;
    role: string;
    status: string;
    instituteId?: string;
    instituteName?: string;
    profile?: { firstName: string; lastName: string };
    createdAt: string;
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);

    const response = await apiRequest<{
      data: Array<{
        userId: string;
        email: string;
        walletAddress: string;
        role: string;
        status: string;
        instituteId?: string;
        instituteName?: string;
        profile?: { firstName: string; lastName: string };
        createdAt: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/pending-users?${queryParams.toString()}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
      };
    }

    return { success: false, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  getAllUsers: async (params?: { page?: number; limit?: number; role?: string; status?: string }): Promise<PaginatedResponse<{
    userId: string;
    email: string;
    walletAddress: string;
    role: string;
    status: string;
    instituteId?: string;
    instituteName?: string;
    profile?: { firstName: string; lastName: string };
    createdAt: string;
    approvedAt?: string;
  }>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.role) queryParams.set('role', params.role);
    if (params?.status) queryParams.set('status', params.status);

    const response = await apiRequest<{
      data: Array<{
        userId: string;
        email: string;
        walletAddress: string;
        role: string;
        status: string;
        instituteId?: string;
        instituteName?: string;
        profile?: { firstName: string; lastName: string };
        createdAt: string;
        approvedAt?: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/admin/users?${queryParams.toString()}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.data || response.data,
        pagination: response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
      };
    }

    return { success: false, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  },

  approveUser: async (userId: string): Promise<ApiResponse<{ userId: string; status: string }>> => {
    return apiRequest<{ userId: string; status: string }>(`/admin/users/${userId}/approve`, {
      method: 'POST',
    });
  },

  rejectUser: async (userId: string, reason: string): Promise<ApiResponse<{ userId: string; status: string; rejectionReason: string }>> => {
    return apiRequest<{ userId: string; status: string; rejectionReason: string }>(`/admin/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  getStats: async (): Promise<ApiResponse<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    byRole: { students: number; faculty: number; employers: number };
  }>> => {
    const response = await apiRequest<{ data: {
      pending: number;
      approved: number;
      rejected: number;
      total: number;
      byRole: { students: number; faculty: number; employers: number };
    } }>('/admin/stats');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false };
  },

  getInstitutes: async (): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    code: string;
    domain: string;
    userCount: number;
  }>>> => {
    const response = await apiRequest<{ data: Array<{
      id: string;
      name: string;
      code: string;
      domain: string;
      userCount: number;
    }> }>('/admin/institutes');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },

  // Public - for students/faculty to see available institutes
  getPublicInstitutes: async (): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    code: string;
    domain: string;
  }>>> => {
    const response = await apiRequest<{ data: Array<{
      id: string;
      name: string;
      code: string;
      domain: string;
    }> }>('/institutes/public');

    if (response.success && response.data) {
      return { success: true, data: response.data.data || response.data };
    }

    return { success: false, data: [] };
  },
};

// Health Check API
export const healthApi = {
  check: async (): Promise<ApiResponse<{ status: string; message: string }>> => {
    return apiRequest<{ status: string; message: string }>('/health');
  },
};