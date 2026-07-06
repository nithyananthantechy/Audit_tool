import React from 'react';
import { User, Department } from '../types';

// Importing department-specific components
import HRHub from './departments/HRHub';
import ITHub from './departments/ITHub';
import AdminHub from './departments/AdminHub';
import OperationsHub from './departments/OperationsHub';
import AuditHub from './departments/AuditHub';
import FinanceHub from './departments/FinanceHub';
import LegalHub from './departments/LegalHub';
import QAHub from './departments/QAHub';
import SecurityHub from './departments/SecurityHub';
import ProcurementHub from './departments/ProcurementHub';
import SalesHub from './departments/SalesHub';
import MarketingHub from './departments/MarketingHub';
import RDHub from './departments/RDHub';
import SupplyChainHub from './departments/SupplyChainHub';

interface DepartmentHubProps {
  user: User;
}

const DepartmentHub: React.FC<DepartmentHubProps> = ({ user }) => {
  switch (user.department) {
    case Department.HR: return <HRHub user={user} />;
    case Department.IT: return <ITHub user={user} />;
    case Department.ADMIN: return <AdminHub user={user} />;
    case Department.OPERATIONS: return <OperationsHub user={user} />;
    case Department.AUDIT: return <AuditHub user={user} />;
    case Department.FINANCE: return <FinanceHub user={user} />;
    case Department.LEGAL: return <LegalHub user={user} />;
    case Department.QUALITY_ASSURANCE: return <QAHub user={user} />;
    case Department.SECURITY: return <SecurityHub user={user} />;
    case Department.PROCUREMENT: return <ProcurementHub user={user} />;
    case Department.SALES: return <SalesHub user={user} />;
    case Department.MARKETING: return <MarketingHub user={user} />;
    case Department.R_AND_D: return <RDHub user={user} />;
    case Department.SUPPLY_CHAIN: return <SupplyChainHub user={user} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-black text-white mb-4">Department Hub</h1>
          <p className="text-slate-400">Features for {user.department} are currently in development.</p>
        </div>
      );
  }
};

export default DepartmentHub;
