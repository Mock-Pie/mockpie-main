import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '../../constants';
import { FiHome, FiVideo, FiUpload, FiList, FiCalendar, FiUser, FiLogOut } from 'react-icons/fi';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      label: 'Dashboard',
      path: ROUTES.DASHBOARD,
      icon: <FiHome className="w-5 h-5" />,
    },
    {
      label: 'Record',
      path: ROUTES.RECORD,
      icon: <FiVideo className="w-5 h-5" />,
    },
    {
      label: 'Upload',
      path: ROUTES.UPLOAD,
      icon: <FiUpload className="w-5 h-5" />,
    },
    {
      label: 'Submitted Trials',
      path: ROUTES.SUBMITTED_TRIALS,
      icon: <FiList className="w-5 h-5" />,
    },
    {
      label: 'Calendar',
      path: ROUTES.CALENDAR,
      icon: <FiCalendar className="w-5 h-5" />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    router.push(ROUTES.LOGIN);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className={`
      w-64 bg-white border-r border-gray-200
      flex flex-col h-screen
      ${className}
    `}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-gray-900">MockPie</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg
              text-left transition-all duration-200
              ${isActive(item.path)
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              User Name
            </p>
            <p className="text-xs text-gray-500 truncate">
              user@example.com
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg
            text-gray-600 hover:bg-gray-50 hover:text-gray-900
            transition-all duration-200"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 