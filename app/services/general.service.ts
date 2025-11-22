/**
 * General Service
 * Handles general API calls (settings, announcements, messages, etc.)
 */

import { ApiResponse } from '../types/api';
import { apiClient } from './api/client';

class GeneralService {
  async getSettings(): Promise<ApiResponse> {
    return apiClient.request('getsettings', {});
  }

  async getApps(): Promise<ApiResponse> {
    return apiClient.request('getapps', {});
  }

  async getPositions(): Promise<ApiResponse> {
    return apiClient.request('getpositions', {});
  }

  async getDepartments(): Promise<ApiResponse> {
    return apiClient.request('getdepartments', {});
  }

  async getPrograms(): Promise<ApiResponse> {
    return apiClient.request('getprograms', {});
  }

  async getAnnouncements(): Promise<ApiResponse> {
    return apiClient.request('getannouncements', {});
  }

  async getBugReports(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getbugreports', payload);
  }

  async getMessages(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getmessages', payload);
  }

  async getRegions(): Promise<ApiResponse> {
    return apiClient.request('getregions', {});
  }

  async getProvinces(regionId: string): Promise<ApiResponse> {
    return apiClient.request('getprovinces', { value: regionId });
  }

  async getCityMun(provinceId: string): Promise<ApiResponse> {
    return apiClient.request('getcitymun', { value: provinceId });
  }

  async getBrgy(cityMunId: string): Promise<ApiResponse> {
    return apiClient.request('getbrgy', { value: cityMunId });
  }

  async saveBugReport(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('savebugreport', payload);
  }

  async uploadImage(
    studid: string,
    filename: string,
    filetype: string,
    files: Array<{ uri: string; name: string; type: string }>
  ): Promise<ApiResponse> {
    const endpoint = `uploadimage/${studid}/${filename}/${filetype}`;
    return apiClient.uploadFile(endpoint, files);
  }
}

export const generalService = new GeneralService();
export default generalService;

