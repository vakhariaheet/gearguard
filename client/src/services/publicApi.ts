/**
 * Public API Service for Landing Page
 * Module M06: Enhanced Landing + Dynamic Content
 *
 * These APIs don't require authentication
 */

import type { LandingStats, SystemMetrics, LiveDemoData, TestimonialData } from '@/types/landing';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class PublicApiService {
  private async fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'API request failed');
    }

    return result.data;
  }

  async getLandingStats(): Promise<LandingStats> {
    return this.fetchApi<LandingStats>('/api/public/stats');
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.fetchApi<SystemMetrics>('/api/public/metrics');
  }

  async getLiveDemoData(): Promise<LiveDemoData> {
    return this.fetchApi<LiveDemoData>('/api/public/demo-data');
  }

  async getTestimonials(): Promise<TestimonialData[]> {
    return this.fetchApi<TestimonialData[]>('/api/public/testimonials');
  }
}

export const publicApi = new PublicApiService();
