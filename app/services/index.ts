/**
 * Services Index
 * Central export point for all API services
 */

export { apiClient } from './api/client';
export { authService } from './auth.service';
export { getFirestoreInstance, initializeFirebase, isFirebaseConfigured } from './firebase.service';
export { generalService } from './general.service';
export { lampService } from './lamp.service';
export * as messagingService from './messaging.service';
export { notificationService } from './notification.service';
export { studentService } from './student.service';

