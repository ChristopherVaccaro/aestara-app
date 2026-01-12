import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, getStyleStats, getOverallStats, StyleInfo } from '../services/adminService';
import { Warning, ArrowClockwise, ChartBar, Lightning, ArrowsDownUp, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import ParticleBackground from './ParticleBackground';
import { AuthButton } from './AuthButton';

type SortField = 'name' | 'generations' | 'version';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [sortField, setSortField] = useState<SortField>('generations');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Guard to prevent duplicate data loads
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stylesData, statsData] = await Promise.all([
        getStyleStats(),
        getOverallStats(),
      ]);
      setStyles(stylesData);
      setOverallStats(statsData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stable references for dependency
  const userEmail = user?.email;

  useEffect(() => {
    // Check for dev mode bypass (for testing without auth)
    const params = new URLSearchParams(window.location.search);
    const isDev = params.get('dev') === 'true';
    setDevMode(isDev);
    
    // Only load once per session
    if (hasLoadedRef.current) return;
    
    // Load data if user is admin OR in dev mode
    if ((userEmail && isAdmin(userEmail)) || isDev) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [userEmail, loadData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedStyles = [...styles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.filter_name.localeCompare(b.filter_name);
        break;
      case 'generations':
        comparison = a.generation_count - b.generation_count;
        break;
      case 'version':
        comparison = a.prompt_version - b.prompt_version;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Check if user is admin (skip check in dev mode)
  if (!devMode && !user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <ParticleBackground />
        <div className="text-center relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="text-gray-300 mb-8">Please sign in to access the admin dashboard.</p>
          
          {/* Sign In Button */}
          <div className="mb-6">
            <AuthButton />
          </div>
          
          <p className="text-gray-500 text-sm">Or use dev mode: ?page=admin&dev=true</p>
        </div>
      </div>
    );
  }

  if (!devMode && !isAdmin(user?.email)) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <ParticleBackground />
        <div className="text-center relative z-10 flex items-center justify-center min-h-screen">
          <Warning className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <ParticleBackground />
        <div className="text-center relative z-10 flex items-center justify-center min-h-screen">
          <ArrowClockwise className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <ParticleBackground />
        <div className="text-center relative z-10 flex items-center justify-center min-h-screen">
          <Warning className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <ParticleBackground />
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Monitor style performance and identify issues</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowClockwise className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <StatCard
              icon={<ChartBar className="w-6 h-6" />}
              label="Total Styles"
              value={overallStats.totalStyles}
              color="blue"
            />
            <StatCard
              icon={<Lightning className="w-6 h-6" />}
              label="Total Generations"
              value={overallStats.totalGenerations}
              color="purple"
            />
          </div>
        )}

        {/* Styles Table */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-400px)]">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <SortableHeader field="name" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Style
                  </SortableHeader>
                  <SortableHeader field="generations" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Times Used
                  </SortableHeader>
                  <SortableHeader field="version" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Version
                  </SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedStyles.map((style) => (
                  <tr
                    key={style.filter_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{style.filter_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {style.generation_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      v{style.prompt_version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(style.last_updated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'red' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

interface SortableHeaderProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ field, currentField, direction, onSort, children }) => {
  const isActive = currentField === field;
  
  return (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-blue-400" />
          ) : (
            <ArrowDown className="w-4 h-4 text-blue-400" />
          )
        ) : (
          <ArrowsDownUp className="w-4 h-4 text-gray-500 opacity-50" />
        )}
      </div>
    </th>
  );
};
