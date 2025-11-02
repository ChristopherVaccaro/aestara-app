/**
 * AuthDebug Component
 * Shows authentication status for debugging
 * Only visible in development mode
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

const AuthDebug: React.FC = () => {
  const { user, session, loading } = useAuth();
  const [hasTokensInUrl, setHasTokensInUrl] = useState(false);
  const [storageData, setStorageData] = useState<string | null>(null);

  useEffect(() => {
    // Check for tokens in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    setHasTokensInUrl(!!hashParams.get('access_token'));

    // Check localStorage
    const authData = localStorage.getItem('ai-stylizer-auth');
    setStorageData(authData ? 'Present' : 'Empty');
  }, []);

  // Only show in development
  // @ts-ignore
  const isDev = import.meta.env?.DEV || window.location.hostname === 'localhost';
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] bg-black/90 border border-white/20 rounded-lg p-4 text-xs font-mono text-white max-w-sm">
      <div className="font-bold mb-2 text-yellow-400">🔍 Auth Debug</div>
      
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">Loading:</span>{' '}
          <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">User:</span>{' '}
          <span className={user ? 'text-green-400' : 'text-red-400'}>
            {user ? user.email : 'null'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Session:</span>{' '}
          <span className={session ? 'text-green-400' : 'text-red-400'}>
            {session ? 'Active' : 'null'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">Tokens in URL:</span>{' '}
          <span className={hasTokensInUrl ? 'text-yellow-400' : 'text-gray-500'}>
            {hasTokensInUrl ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">localStorage:</span>{' '}
          <span className={storageData === 'Present' ? 'text-green-400' : 'text-gray-500'}>
            {storageData}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
        <button
          onClick={async () => {
            const { data } = await supabase.auth.getSession();
            console.log('Current session:', data);
          }}
          className="w-full px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-[10px]"
        >
          Log Session
        </button>
        
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="w-full px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 text-[10px]"
        >
          Clear & Reload
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
