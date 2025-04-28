/**
 * API Utilities for handling requests and errors
 */
import { API_BASE_URL } from "@/config/api";

// Custom error type for API errors
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Check if the API server is reachable
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("API connection check failed:", error);
    return false;
  }
};

// Generic fetch function with error handling
export const fetchWithErrorHandling = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(`API request failed with status ${response.status}`, response.status);
    }
    
    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else if (error instanceof TypeError && error.message.includes("NetworkError")) {
      throw new ApiError("Network error: Unable to connect to the API server", 0);
    } else if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timeout: API server took too long to respond", 408);
    } else {
      throw new ApiError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`, 0);
    }
  }
};

// Helper function to retry failed API requests
export const retryFetch = async <T>(
  url: string, 
  options?: RequestInit, 
  retries = 3, 
  delay = 1000
): Promise<T> => {
  try {
    return await fetchWithErrorHandling<T>(url, options);
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with one less retry attempt and increased delay (exponential backoff)
    return retryFetch<T>(url, options, retries - 1, delay * 2);
  }
};