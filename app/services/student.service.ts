/**
 * Student Service
 * Handles student-related API calls
 */

import { ApiResponse, LogObject } from '../types/api';
import { apiClient } from './api/client';

class StudentService {
  /**
   * Get student profile
   */
  async getProfile(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getprofile', payload);
  }

  /**
   * Get enrollment history
   */
  async getEnrollmentHistory(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getenrollhistory', payload);
  }

  /**
   * Get available courses
   */
  async getAvailableCourses(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getavailablecourses', payload);
  }

  /**
   * Update personal information
   */
  async updateInfo(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updateinfo', payload, { log });
  }

  /**
   * Update education background
   */
  async updateEducation(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updateeducation', payload, { log });
  }

  /**
   * Update family background
   */
  async updateFamily(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updatefamily', payload, { log });
  }

  /**
   * Update health information
   */
  async updateHealth(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updatehealth', payload, { log });
  }

  /**
   * Update government information
   */
  async updateGovernment(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updategovt', payload, { log });
  }

  /**
   * Update other information
   */
  async updateOthers(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('updateothers', payload, { log });
  }

  /**
   * Enlist in courses
   */
  async enlist(payload: Record<string, any>, log: LogObject): Promise<ApiResponse> {
    return apiClient.request('enlist', payload, { log });
  }
}

export const studentService = new StudentService();
export default studentService;

