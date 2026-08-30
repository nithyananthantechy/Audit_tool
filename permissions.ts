import { Role, User } from './types';

export const isPlatformSuperAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === Role.SUPER_ADMIN;
};

export const isOrgAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === Role.ORG_ADMIN || user.role === Role.SUPER_ADMIN;
};

export const canManageUsers = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.SUPER_ADMIN, Role.ORG_ADMIN].includes(user.role);
};

export const canSubmitEvidence = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.ORG_ADMIN, Role.SUPER_ADMIN].includes(user.role);
};

export const canApproveEvidence = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.INTERNAL_AUDITOR, Role.ORG_ADMIN, Role.SUPER_ADMIN].includes(user.role);
};

export const canCertifyAudit = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.EXTERNAL_AUDITOR, Role.SUPER_ADMIN].includes(user.role);
};

export const canManageCAPA = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.CONTRIBUTOR, Role.TEAM_LEAD, Role.MANAGER, Role.HR, Role.INTERNAL_AUDITOR, Role.ORG_ADMIN, Role.SUPER_ADMIN].includes(user.role);
};

export const canViewAllDepartments = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.INTERNAL_AUDITOR, Role.EXTERNAL_AUDITOR, Role.ORG_ADMIN, Role.SUPER_ADMIN].includes(user.role);
};

export const canManageControlsAndRisks = (user?: User | null): boolean => {
  if (!user) return false;
  return [Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.INTERNAL_AUDITOR, Role.MANAGER].includes(user.role);
};

export const isReadOnlyUser = (user?: User | null): boolean => {
  if (!user) return true;
  return user.role === Role.EXTERNAL_AUDITOR;
};
