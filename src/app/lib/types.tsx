import { DefaultSession } from "next-auth";
import { ReactNode } from "react";

export interface ClientProps {
  children: React.ReactNode;
}

export interface LayoutProps {
  children: ReactNode;
}

export type PendingRequestType = "creation" | "modifications" | "deletions";

export interface DownloadResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
  data: T;
  blob: any;
  errors: any[];
}

export enum FileType {
  CSV = "CSV",
  EXCEL = "EXCEL",
  PDF = "PDF",
  MT940 = "MT940",
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PartialPaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nt: string;
      name: string;
      username: string;
      token?: string;
      role: UserRoles[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name: string;
    username: string;
    token?: string;
    role: UserRoles[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    token?: string;
    role?: UserRoles[];
  }
}

export interface User {
  id: string;
  name: string;
  username: string;
  token?: string;
  roles: UserRoles[];
}

export enum UserRoles {
  admin = "Admin",
  accountOfficer = "AccountOfficer",
  user = "User",
  superAdmin = "SuperAdmin",
}

export interface Credentials {
  username: string;
  password: string;
}

export interface DashboardLayoutProps {
  children: ReactNode;
}

export interface ChildSidebarItem {
  label: string;
  href?: string;
  children?: ChildSidebarItem[];
}

export interface SidebarItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: ChildSidebarItem[];
}

export interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
}

export interface EnvConfig {
  credentialsMode: string;
  azureAdEnabled: string;
  adGroups: string;
}

export interface StandardApiResponse<T> {
  httpStatusCode: number;
  message: string;
  errors: string[];
  data: {
    items: T[]; // The actual data array
    pageNumber: number; // Current page (1-based)
    totalPages: number; // Total number of pages
    totalCount: number; // Total items across all pages
    pageSize: number; // Items per page
    hasPreviousPage: boolean; // Whether previous page exists
    hasNextPage: boolean; // Whether next page exists
  };
}

export interface ApiResponse<T = []> {
  timestamp: string;
  status: "Success" | "Failed";
  message: string;
  statusCode: number;
  statusText?: string;
  data: T;
  errors: any[];
}

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface AuditLogFilters {
  searchKeyword?: string;
  startDate?: string;
  endDate?: string;
  pageNumber?: number;
  pageSize?: number;
  totalRecord?: number;
}

export interface AuditLogItem {
  performedByName: string;
  role: string;
  performedOn: string;
  action: string;
  status: string;
}

export interface AuditLogResponse {
  httpStatusCode: number;
  message: string;
  errors: string[];
  data: {
    items: AuditLogItem[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  totalCount: number | null;
}

export interface Document {
  file: string;
  fileName: string;
  base64String?: string;
  fileContent?: string;
  filename?: string;
}

export interface DownloadAuditReportResponse {
  httpStatusCode: number;
  message: string;
  errors: string[];
  data: {
    file: string; // base64 string
    fileName: string;
    base64String?: string;
    fileContent?: string;
    filename?: string;
  } | null;
  totalCount: number | null;
}

export type ModalStage = "confirmation" | "result" | "loading";

export interface ModalAction {
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  backText?: string;
  previousAction?: ModalAction;
  detailsComponent?:
    | React.ReactNode
    | React.ComponentType<{ setIsValid: (valid: boolean) => void }>;
  onConfirm: () => Promise<{
    success: boolean;
    displayText?: string;
    buttonText?: string;
    icon?: string | React.ReactNode;
    redirectPath?: string;
    callbackFunction?: () => void;
    skipResultScreen?: boolean;
  }>;
  onCancel?: () => void;
}

export type ModalResult = {
  success: boolean;
  displayText: string;
  buttonText: string;
  icon?: string | ReactNode;
  redirectPath?: string;
  callbackFunction?: () => void;
};

export type DeliverableStatus =
  | "Open"
  | "In Progress"
  | "Completed"
  | "Closed"
  | "Missed";

export interface StatusWorkflowStep {
  next: DeliverableStatus[];
  allowedRoles: UserRoles[];
}

export interface StatusWorkflow {
  [key: string]: StatusWorkflowStep;
}

export interface Deliverable {
  id: string;
  title: string;
  customerName: string;
  responsibleOfficer: string;
  createdDate: string;
  targetDate: string;
  groupHead: string;
  description: string;
  status: DeliverableStatus;
  statusHistory?: StatusChange[];
  documentStatus: string;
  phone: string;
  accountOfficer: string;
}

export interface StatusChange {
  from: DeliverableStatus;
  to: DeliverableStatus;
  changedBy: string;
  changedAt: string;
}

export interface DeliverableFormValues extends Deliverable {
  statusHistory: StatusChange[];
}
