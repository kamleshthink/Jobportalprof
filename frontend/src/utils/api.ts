import { apiRequest } from "@/lib/queryClient";

// Adjuna API config
const ADJUNA_API_KEY = "52917d59c2d5b04794b8fe9ba478d615";
const ADJUNA_BASE_URL = "https://api.adjuna.com/v1";

interface AdjunaOptions {
  method?: string;
  endpoint: string;
  params?: Record<string, any>;
  body?: any;
}

export const callAdjunaApi = async ({ method = "GET", endpoint, params = {}, body }: AdjunaOptions) => {
  try {
    // Build URL with query parameters
    let url = `${ADJUNA_BASE_URL}${endpoint}`;
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      url += `?${queryParams.toString()}`;
    }

    // Fetch options
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ADJUNA_API_KEY}`
      }
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error calling Adjuna API");
    }

    return data;
  } catch (error) {
    console.error("Error calling Adjuna API:", error);
    throw error;
  }
};

// Job Listing Functions
export const searchJobs = async (params: {
  query?: string;
  location?: string;
  page?: number;
  limit?: number;
  jobType?: string;
  salary?: string;
  experience?: string;
  sortBy?: string;
}) => {
  try {
    return await callAdjunaApi({
      endpoint: "/jobs/search",
      params
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }
};

export const getJobDetails = async (jobId: string) => {
  try {
    return await callAdjunaApi({
      endpoint: `/jobs/${jobId}`
    });
  } catch (error) {
    console.error("Error fetching job details:", error);
    throw error;
  }
};

export const postJob = async (jobData: any) => {
  try {
    // First, try to post to our backend
    try {
      const localApiResponse = await apiRequest("POST", "/api/jobs", jobData);
      const localJobData = await localApiResponse.json();
      return localJobData;
    } catch (localError) {
      console.warn("Couldn't post job to local API, trying Adjuna API:", localError);
      
      // Fallback to Adjuna API
      return await callAdjunaApi({
        method: "POST",
        endpoint: "/jobs",
        body: jobData
      });
    }
  } catch (error) {
    console.error("Error posting job:", error);
    throw error;
  }
};

// User and Profile Functions
export const updateUserProfile = async (userData: any) => {
  try {
    return await apiRequest("PATCH", "/api/user/profile", userData);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Application Functions
export const applyForJob = async (jobId: string, applicationData: any) => {
  try {
    return await apiRequest("POST", `/api/jobs/${jobId}/apply`, applicationData);
  } catch (error) {
    console.error("Error applying for job:", error);
    throw error;
  }
};

export const getEmployerApplications = async (jobId?: string) => {
  try {
    const endpoint = jobId 
      ? `/api/jobs/${jobId}/applications` 
      : "/api/employer/applications";
    return await apiRequest("GET", endpoint);
  } catch (error) {
    console.error("Error fetching employer applications:", error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId: string, status: string) => {
  try {
    return await apiRequest("PATCH", `/api/applications/${applicationId}/status`, { status });
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

// Verification Functions
export const sendVerificationOTP = async (type: 'email' | 'phone') => {
  try {
    return await apiRequest("POST", "/api/resend-otp", { type });
  } catch (error) {
    console.error(`Error sending ${type} OTP:`, error);
    throw error;
  }
};

export const verifyOTP = async (type: 'email' | 'phone', otp: string) => {
  try {
    const endpoint = type === 'email' ? "/api/verify-email" : "/api/verify-phone";
    return await apiRequest("POST", endpoint, { otp });
  } catch (error) {
    console.error(`Error verifying ${type}:`, error);
    throw error;
  }
};