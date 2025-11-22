/**
 * LAMP (Learning Management) Service
 * Handles LMS-related API calls (classes, activities, posts, etc.)
 */

import { ApiResponse } from '../types/api';
import { apiClient } from './api/client';

class LampService {
  // Class Management
  async getStudentClasses(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getstudentclasses', payload);
  }

  async getFacultyClasses(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getfacultyclasses', payload);
  }

  async getStudentsInClass(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getstudentsinclass', payload);
  }

  // Post Management
  async getClassPost(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclasspost', payload);
  }

  async addClassPost(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('addclasspost', payload);
  }

  async editClassPost(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('editclasspost', payload);
  }

  // Comment Management
  async getClassComments(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclasscomments', payload);
  }

  async addClassComment(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('addclasscomment', payload);
  }

  async editClassComment(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('editclasscomment', payload);
  }

  // Activity Management
  async getClassActivities(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclassactivities', payload);
  }

  async addClassActivity(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('addclassactivity', payload);
  }

  async editClassActivity(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('editclassactivity', payload);
  }

  async getTodoList(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('gettodolist', payload);
  }

  async getAllSubmissions(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getallsubmissions', payload);
  }

  // Resource Management
  async getClassResources(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclassresources', payload);
  }

  async addClassResource(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('addclassresource', payload);
  }

  async editClassResource(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('editclassresource', payload);
  }

  // Topic Management
  async getClassTopics(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclasstopics', payload);
  }

  // Submission Management
  async getClassSubmissions(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclasssubmissions', payload);
  }

  async getClassSubmissionList(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getclasssubmissionlist', payload);
  }

  async getStudentWorks(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getstudentworks', payload);
  }

  async getSubmission(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getsubmission', payload);
  }

  async editClassSubmission(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('editclasssubmission', payload);
  }

  async saveWork(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('savework', payload);
  }

  // Quiz Management
  async getQuiz(payload: { filepath: string }): Promise<ApiResponse> {
    return apiClient.request('getquiz', payload);
  }

  async draftQuiz(
    payload: Record<string, any>,
    options: { ay: string; sem: string; userid: string }
  ): Promise<ApiResponse> {
    return apiClient.request('draftquiz', payload, { options });
  }

  async saveQuiz(
    payload: Record<string, any>,
    options: { ay: string; sem: string; userid: string },
    classcode: string
  ): Promise<ApiResponse> {
    return apiClient.request('savequiz', payload, { options, classcode });
  }

  async editQuiz(
    payload: Record<string, any>,
    filepath: string,
    classcode: string,
    options: { ay: string; sem: string; userid: string }
  ): Promise<ApiResponse> {
    return apiClient.request('editquiz', payload, { options, classcode, filepath });
  }

  async addAnswer(
    payload: { answer: Record<string, any> },
    ay: string,
    sem: string,
    userid: string
  ): Promise<ApiResponse> {
    return apiClient.request('addanswer', payload, {
      options: { ay, sem, userid },
    });
  }

  // File Management
  async uploadFile(
    acadyear: string,
    sem: string,
    userid: string,
    files: Array<{ uri: string; name: string; type: string }>
  ): Promise<ApiResponse> {
    const endpoint = `upload/${acadyear}/${sem}/${userid}`;
    return apiClient.uploadFile(endpoint, files);
  }

  async deleteFile(payload: { dir_fld: string; id: string }): Promise<ApiResponse> {
    return apiClient.request('deletefile', payload);
  }

  async downloadFile(payload: { filepath: string }): Promise<ApiResponse> {
    return apiClient.request('download', payload);
  }

  // Message Management
  async getMessages(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('getmsg', payload);
  }

  async addMessage(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('addmsg', payload);
  }

  // Evaluation
  async submitEvaluation(payload: Record<string, any>): Promise<ApiResponse> {
    return apiClient.request('submiteval', payload);
  }
}

export const lampService = new LampService();
export default lampService;

