/**
 * ProfilePage Component
 * Shows user profile with prompt usage statistics
 */

import React, { useEffect, useState } from 'react';
import { X, TrendUp, Calendar, Hash } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import {
  getUserPromptUsage,
  getTotalPromptUsage,
  PromptUsageStats,
} from '../services/userPromptUsageService';

interface ProfilePageProps {
  onClose: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<PromptUsageStats[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUsageStats();
    }
  }, [user]);

  const loadUsageStats = async () => {
    if (!user?.id) return;

    console.log('📈 Loading profile usage stats for user:', user.id);
    setLoading(true);
    try {
      const [stats, total] = await Promise.all([
        getUserPromptUsage(user.id),
        getTotalPromptUsage(user.id),
      ]);
      console.log('✅ Loaded usage stats:', { statsCount: stats.length, total });
      console.log('Stats details:', stats);
      setUsageStats(stats);
      setTotalUsage(total);
    } catch (error) {
      console.error('❌ Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-6">
          {/* User Info */}
          <div className="flex items-center gap-4 mb-8 p-4 bg-black/30 rounded-xl">
            <UserAvatar email={user.email || ''} size="lg" />
            <div>
              <p className="text-white font-semibold text-lg">{user.email}</p>
              <p className="text-gray-400 text-sm">
                Member since {formatDate(user.created_at || '')}
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-blue-400" />
                <p className="text-gray-400 text-sm">Total Generations</p>
              </div>
              <p className="text-3xl font-bold text-white">{totalUsage}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendUp className="w-5 h-5 text-purple-400" />
                <p className="text-gray-400 text-sm">Styles Used</p>
              </div>
              <p className="text-3xl font-bold text-white">{usageStats.length}</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-pink-400" />
                <p className="text-gray-400 text-sm">Most Used</p>
              </div>
              <p className="text-lg font-bold text-white truncate">
                {usageStats[0]?.filter_name || 'N/A'}
              </p>
            </div>
          </div>

          {/* Usage Table */}
          <div className="bg-black/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                Style Usage History
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Loading usage statistics...
              </div>
            ) : usageStats.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="mb-2">No usage data yet</p>
                <p className="text-sm">
                  Start generating images to see your usage statistics!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Style Name
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Times Used
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        First Used
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Last Used
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usageStats.map((stat) => (
                      <tr
                        key={stat.filter_id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {stat.filter_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 font-semibold text-sm">
                            {stat.usage_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatDate(stat.first_used_at)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatDate(stat.last_used_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
