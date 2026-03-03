"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  INITIAL_RESET_SESSION_STATE,
  resolveResetSessionState,
} from "../utils/resetSessionState";

export const usePasswordResetSession = () => {
  const supabase = useSupabaseClient();

  const [state, setState] = useState(INITIAL_RESET_SESSION_STATE);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setState((current) =>
        resolveResetSessionState(event, !!session, current),
      );
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
};
