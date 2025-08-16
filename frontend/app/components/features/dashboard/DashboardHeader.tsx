import React from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '../../shared';
import { useAuth } from '../../../hooks';
import { formatDate } from '../../../utils';
import { FiSearch, FiUser } from 'react-icons/fi';

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
  className?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onSearch,
  className = '',
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleProfileClick = () => {
    router.push('/ProfileInfo');
  };

  const getDisplayName = () => {
    if (!user) return 'Loading...';
    
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.username || 'Unknown User';
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Search Section */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search presentations, analytics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<FiSearch className="w-4 h-4" />}
              className="w-full"
            />
          </form>
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || 'No email'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProfileClick}
            icon={<FiUser className="w-4 h-4" />}
            className="rounded-full w-10 h-10 p-0"
          />
        </div>
      </div>

      {/* Title and Subtitle */}
      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your presentation analytics overview
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader; 