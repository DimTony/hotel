
export interface CreateAppraisalRequest {
  type: string;
  name: string;
  description: string;
  selfAppraisalStartDate: string;
  selfAppraisalEndDate: string;
  kpiVerificationStartDate: string;
  kpiVerificationEndDate: string;
  firstLineReviewStartDate: string;
  firstLineReviewEndDate: string;
  secondLineReviewStartDate: string;
  secondLineReviewEndDate: string;
  groupColligateStartDate: string;
  groupColligateEndDate: string;
  bankColligateStartDate: string;
  bankColligateEndDate: string;
  createdBy: string;
}

export interface AuthenticationRequest {
  email: string;
  password: string;
}

export interface EntrustRequest {

  username: string;
  code: string;
  token: string;
}

export interface CreateDeliverableRequest {
  title: string;
  customerName: string;
  createdDate: string;
  targetDate: string;
  isDocumentRequired: boolean;
  description: string;
  responsibleOfficerId: number;
}

export interface NewUserRequest {
  username: string;
  fullName: string;
  email: string;
  lineManagerEmail: string;
  lineManager: string;
  groupHead: string;
  groupHeadEmail: string;
  executiveDirector: string;
  executiveDirectorEmail: string;
  division: string;
  role: string;
}

export interface DeleteUserRequest {
  userId: number;
}

export interface UpdateUserRequest {
  userId: number;
  lineManagerEmail: string;
  lineManager: string;
  groupHead: string;
  groupHeadEmail: string;
  executiveDirector: string;
  executiveDirectorEmail: string;
  division: string;
  role: string;
}


export interface CreateEscalationRuleRequest {
  level: string;
  recipient: string;
  notificationType: string;
  escalationTimeline: number;
  triggerEvent: string;
}

export interface UpdateEscalationRuleRequest {
  escalationId: string;
  level: string;
  recipient: string;
  notificationType: string;
  escalationTimeline: number;
  triggerEvent: string;
}

// New Group Head interfaces
export interface GroupHeadDeliverable {
  groupHead: string;
  totalDeliverables: number;
  executiveDirector: string;
  division: string;
  totalInProgress: number;
  totalOpen: number;
  totalClosed: number;
  totalCompleted: number;
  completed: number;
  pending: number;
  missed: number;
}

export interface GroupHeadDeliverablesParams {
  searchKeyword?: string;
  division?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface GroupHeadDeliverablesResponse {
  success: boolean;
  message: string;
  data: GroupHeadDeliverable[];
  totalCount: number;
  httpStatusCode: number;
}

// Add this interface to your api.model.ts file
export interface UpdateDeliverableRequest {
  deliverableItemId: number;
  title: string;
  customerName: string;
  createdDate: string; // Will be ISO string format
  targetDate: string; // Will be ISO string format
  status: string;
  declineReason: string;
  isDocumentRequired: boolean;
  description: string;
  responsibleOfficerId: number;
}

export interface UploadDeliverableRequest {
  deliverableItemId: number;
  document: any;
}
