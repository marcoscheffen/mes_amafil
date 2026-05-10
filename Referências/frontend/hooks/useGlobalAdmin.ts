import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { isGlobalAdmin as checkGlobalAdmin } from '../services/globalAdminService';

export function useGlobalAdmin(user: User | null) {
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsGlobalAdmin(false);
      return;
    }

    checkGlobalAdmin()
      .then(result => setIsGlobalAdmin(result))
      .catch(() => setIsGlobalAdmin(false));
  }, [user?.id]);

  return { isGlobalAdmin };
}
