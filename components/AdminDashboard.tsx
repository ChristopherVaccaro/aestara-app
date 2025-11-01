import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin, getStyleAnalytics, getOverallStats, StyleAnalytics } from '../services/adminService';
import { Warning, TrendUp, TrendDown, ArrowClockwise, ChartBar, UsersThree, Lightning, ArrowsDownUp, ArrowUp, ArrowDown } from '@phosphor-icons/react';
import ParticleBackground from './ParticleBackground';
import { AuthButton } from './AuthButton';

type SortField = 'name' | 'votes' | 'approval' | 'net_score' | 'generations' | 'status';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<StyleAnalytics[]>([]);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, statsData] = await Promise.all([
        getStyleAnalytics(),
        getOverallStats(),
      ]);
      setAnalytics(analyticsData);
      setOverallStats(statsData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for dev mode bypass (for testing without auth)
    const params = new URLSearchParams(window.location.search);
    const isDev = params.get('dev') === 'true';
    setDevMode(isDev);
    
    // Load data if user is admin OR in dev mode
    if ((user && isAdmin(user.email)) || isDev) {
      loadData();
    }
  }, [user]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAnalytics = [...analytics].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.filter_name.localeCompare(b.filter_name);
        break;
      case 'votes':
        comparison = a.total_votes - b.total_votes;
        break;
      case 'approval':
        comparison = a.approval_rate - b.approval_rate;
        break;
      case 'net_score':
        comparison = a.net_feedback - b.net_feedback;
        break;
      case 'generations':
        comparison = a.generation_count - b.generation_count;
        break;
      case 'status':
        // Needs attention first, then by approval rate
        if (a.needs_attention && !b.needs_attention) comparison = -1;
        else if (!a.needs_attention && b.needs_attention) comparison = 1;
        else comparison = a.approval_rate - b.approval_rate;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<ChartBar className="w-6 h-6" />}
              label="Total Styles"
              value={overallStats.totalStyles}
              color="blue"
            />
            <StatCard
              icon={<Warning className="w-6 h-6" />}
              label="Needs Attention"
              value={overallStats.stylesNeedingAttention}
              color="red"
            />
            <StatCard
              icon={<UsersThree className="w-6 h-6" />}
              label="Total Votes"
              value={overallStats.totalVotes}
              color="green"
            />
            <StatCard
              icon={<Lightning className="w-6 h-6" />}
              label="Avg Approval"
              value={`${overallStats.avgApprovalRate.toFixed(1)}%`}
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
                  <SortableHeader field="votes" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Votes
                  </SortableHeader>
                  <SortableHeader field="approval" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Approval
                  </SortableHeader>
                  <SortableHeader field="net_score" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Net Score
                  </SortableHeader>
                  <SortableHeader field="generations" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Times Used
                  </SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Top Issues
                  </th>
                  <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={handleSort}>
                    Status
                  </SortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedAnalytics.map((style) => (
                  <tr
                    key={style.filter_id}
                    className={`hover:bg-white/5 transition-colors ${
                      style.needs_attention ? 'bg-red-500/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-white">{style.filter_name}</div>
                          <div className="text-xs text-gray-400">v{style.prompt_version}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{style.total_votes}</div>
                      <div className="text-xs text-gray-400">
                        <TrendUp className="w-3 h-3 inline text-green-500" /> {style.thumbs_up}{' '}
                        <TrendDown className="w-3 h-3 inline text-red-500" /> {style.thumbs_down}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              style.approval_rate >= 60
                                ? 'bg-green-500'
                                : style.approval_rate >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${style.approval_rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-white">{style.approval_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          style.net_feedback > 0
                            ? 'text-green-400'
                            : style.net_feedback < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {style.net_feedback > 0 ? '+' : ''}
                        {style.net_feedback}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {style.generation_count}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-400 max-w-xs">
                        {style.top_issues.length > 0 ? (
                          <ul className="space-y-1">
                            {style.top_issues.slice(0, 3).map((issue, idx) => (
                              <li key={idx}>
                                • {issue.tag_name} ({issue.count})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500">No issues reported</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {style.needs_attention ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          <Warning className="w-3 h-3 mr-1" />
                          Needs Attention
                        </span>
                      ) : style.approval_rate >= 60 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Healthy
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Monitor
                        </span>
                      )}
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
