/**
 * Landing Page Types for GearGuard
 * Module F02: GearGuard Landing Page
 */

export interface LandingStats {
  totalEquipment: number;
  activeRequests: number;
  completedMaintenance: number;
  uptime: number; // percentage
  costSavings: number; // in dollars
  responseTime: number; // in hours
}

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  recommended?: boolean;
  maxEquipment?: number;
  maxUsers?: number;
}

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  requestType: 'demo' | 'contact' | 'support';
}
