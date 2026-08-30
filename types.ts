export enum Role {
  CONTRIBUTOR = 'Contributor',
  TEAM_LEAD = 'Team Lead',
  MANAGER = 'Manager',
  HR = 'HR',
  INTERNAL_AUDITOR = 'Internal Auditor',
  EXTERNAL_AUDITOR = 'External Auditor',
  ORG_ADMIN = 'Org Admin',
  SUPER_ADMIN = 'Super Admin'
}

export enum Department {
  HR = 'HR',
  IT = 'IT',
  ADMIN = 'Admin',
  OPERATIONS = 'Operations',
  AUDIT = 'Audit',
  FINANCE = 'Finance',
  LEGAL = 'Legal',
  QUALITY_ASSURANCE = 'Quality Assurance',
  SECURITY = 'Security',
  PROCUREMENT = 'Procurement',
  SALES = 'Sales',
  MARKETING = 'Marketing',
  R_AND_D = 'Research & Development',
  SUPPLY_CHAIN = 'Supply Chain'
}

export enum AuditStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  MANAGER_APPROVED = 'Auditor Approved',
  REJECTED = 'Rejected',
  FINAL_AUDIT_COMPLETED = 'Certified'
}

export enum ActivityType {
  LOGIN = 'Login',
  SUBMISSION = 'Submission',
  APPROVAL = 'Approval',
  REJECTION = 'Rejection',
  STATUS_CHANGE = 'Status Change',
  PROFILE_UPDATE = 'Profile Update',
  SYSTEM = 'System'
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  contactName: string;
  contactEmail: string;
  status: 'Active' | 'Suspended' | 'Expired';
  plan: 'Starter' | 'Professional' | 'Enterprise' | string;
  maxUsers: number;
  startDate: string;
  endDate: string;
  features?: string[];
  activeUsersCount?: number;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  department: Department | string;
  action: ActivityType | string;
  description: string;
  timestamp: string;
  organizationId?: string;
  hash?: string;
  previous_hash?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  department: Department | string;
  isActive: boolean;
  isLocked?: boolean;
  loginAttempts?: number;
  profilePic?: string;
  mfaEnabled?: boolean | number;
  organizationId?: string;
  organization?: Organization;
}

export interface ChecklistItem {
  id: string;
  department: Department | string;
  task: string;
  framework?: string;
  control_clause?: string;
  organizationId?: string;
}

export interface Evidence {
  id: string;
  userId: string;
  userName?: string;
  checklistId: string;
  checklistItemId?: string; // Backward compatibility alias
  taskName?: string;
  department: Department | string;
  submissionDate: string;
  submittedAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  comment: string;
  description?: string;
  status: AuditStatus | string;
  managerComment?: string;
  cgoComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  organizationId?: string;
}

export interface CAPAReport {
  id: string;
  userId: string;
  userName: string;
  department: Department | string;
  month: string;
  year: number;
  content: string;
  status: AuditStatus | string;
  submissionDate: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: string;
  assignedTo?: string;
  reviewer?: string;
  reviewComment?: string;
  approvalDate?: string;
  dueDate?: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  verification?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean | number;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  organizationId?: string;
}

export interface NotificationPreferences {
  userId: string;
  inApp: boolean | number;
  email: boolean | number;
  submission: boolean | number;
  approval: boolean | number;
  deadline: boolean | number;
  assignment: boolean | number;
}

export interface Control {
  id: string;
  controlId: string;
  framework: string;
  title: string;
  objective: string;
  requirement: string;
  risk: string;
  department: Department | string;
  frequency: 'Continuous' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual';
  evidenceType: string;
  mandatoryEvidence: boolean;
  owner: string;
  reviewer: string;
  scoringMethod: 'Binary' | 'Maturity Score' | 'Percentage';
  status: 'Active' | 'Under Review' | 'Draft' | 'Deprecated';
  organizationId?: string;
}

export interface RiskItem {
  id: string;
  riskId: string;
  title: string;
  description: string;
  department: Department | string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: 1 | 2 | 3 | 4 | 5; // 1-5
  impact: 1 | 2 | 3 | 4 | 5; // 1-5
  inherentRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  existingControls: string;
  residualRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
  status: 'Open' | 'Mitigated' | 'Accepted' | 'Transferred';
  reviewDate: string;
  organizationId?: string;
}

export interface Finding {
  id: string;
  findingId: string;
  auditId?: string;
  controlId?: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Observation';
  evidence?: string;
  rootCause?: string;
  impact?: string;
  recommendation?: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'Assigned' | 'Under Remediation' | 'Pending Verification' | 'Verified' | 'Closed';
  organizationId?: string;
}

export interface AuditSchedule {
  id: string;
  controlId: string;
  title: string;
  department: Department | string;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom';
  nextDueDate: string;
  owner: string;
  reviewer: string;
  status: 'Scheduled' | 'In Progress' | 'Overdue' | 'Completed';
  organizationId?: string;
}

export interface AIInsightResult {
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  findings: string[];
  missingEvidence: string[];
  recommendations: string[];
  confidence: number;
  suggestedActions: string[];
}

export interface AuditIntegrityResult {
  valid: boolean;
  checkedRecords: number;
  firstFailure?: string;
  failureType?: string;
}
