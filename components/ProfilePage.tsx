/**
 * ProfilePage Component
 * Shows user profile with prompt usage statistics
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, TrendUp, Calendar, Hash, DeviceMobile } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../contexts/UserSettingsContext';
import UserAvatar from './UserAvatar';
import {
  getUserPromptUsage,
  getTotalPromptUsage,
  PromptUsageStats,
} from '../services/userPromptUsageService';
import { FabPosition } from '../services/userSettingsService';

interface ProfilePageProps {
  onClose: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { fabPosition, setFabPosition } = useUserSettings();
  const [usageStats, setUsageStats] = useState<PromptUsageStats[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Guard to prevent duplicate fetches
  const loadedUserIdRef = useRef<string | null>(null);

  // Stable user ID reference to prevent useEffect re-runs
  const userId = user?.id;

  useEffect(() => {
    // Only load if user ID exists and hasn't been loaded yet
    if (userId && loadedUserIdRef.current !== userId) {
      loadedUserIdRef.current = userId;
      loadUsageStats();
    }
  }, [userId]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 glass-modal" onClick={onClose}>
      {/* Modal */}
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] glass-panel overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* Settings Section */}
          <div className="bg-black/30 rounded-xl overflow-hidden mb-8">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Settings</h3>
            </div>
            <div className="p-4">
              {/* FAB Position Setting - Mobile Only */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <DeviceMobile className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Style Button Position</p>
                    <p className="text-gray-400 text-sm">Mobile view only</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-full p-1">
                  <button
                    onClick={() => setFabPosition('left')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      fabPosition === 'left'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => setFabPosition('right')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      fabPosition === 'right'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
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
