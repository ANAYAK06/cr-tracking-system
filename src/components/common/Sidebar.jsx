import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiHome, 
  FiUsers, 
  FiUserPlus, 
  FiFileText, 
  FiDollarSign, 
  FiBarChart2,
  FiSettings,
  FiList,
  FiCheckCircle,
  FiTrendingUp
} from 'react-icons/fi';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/developers', icon: FiUsers, label: 'Developers' },
    { to: '/admin/clients', icon: FiUserPlus, label: 'Clients' },
    { to: '/admin/crs', icon: FiFileText, label: 'Change Requests' },
    { to: '/admin/invoices', icon: FiFileText, label: 'Invoices' },
    { to: '/admin/payments', icon: FiDollarSign, label: 'Payments' },
    { to: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
    { to: '/admin/tds-config', icon: FiSettings, label: 'TDS Config' },
  ];

  const developerLinks = [
    { to: '/developer/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/developer/my-crs', icon: FiList, label: 'My CRs' },
    { to: '/developer/earnings', icon: FiTrendingUp, label: 'Earnings' },
  ];

  const clientLinks = [
    { to: '/client/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/client/crs', icon: FiList, label: 'Change Requests' },
    { to: '/client/approvals', icon: FiCheckCircle, label: 'Pending Approvals' },
  ];

  let links = [];
  if (user?.userType === 'Admin') links = adminLinks;
  if (user?.userType === 'Developer') links = developerLinks;
  if (user?.userType === 'Client') links = clientLinks;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="h-full overflow-y-auto p-4 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <link.icon size={20} />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;