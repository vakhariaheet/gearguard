import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/publicApi';
import type { LandingStats, SystemMetrics, LiveDemoData, TestimonialData } from '@/types/landing';

export const useLandingStats = () => {
  return useQuery<LandingStats>({
    queryKey: ['landing-stats'],
    queryFn: () => publicApi.getLandingStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 3,
  });
};

export const useSystemMetrics = () => {
  return useQuery<SystemMetrics>({
    queryKey: ['system-metrics'],
    queryFn: () => publicApi.getSystemMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 3,
  });
};

export const useLiveDemoData = () => {
  return useQuery<LiveDemoData>({
    queryKey: ['live-demo-data'],
    queryFn: () => publicApi.getLiveDemoData(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for live feel
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useTestimonials = () => {
  return useQuery<TestimonialData[]>({
    queryKey: ['testimonials'],
    queryFn: () => publicApi.getTestimonials(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
};
