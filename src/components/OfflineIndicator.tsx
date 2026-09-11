import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[999] flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-[0_4px_24px_rgba(244,63,94,0.4)] animate-in fade-in slide-in-from-bottom-5">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline Mode — Cached data active.</span>
    </div>
  );
};
