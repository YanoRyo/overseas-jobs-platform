"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { usePathname } from "@/i18n/navigation";
import { AuthModal } from "@/features/auth/components/AuthModal";
import type { AuthModalVariant, UserRole } from "@/features/auth/types";

type AuthModalMode = "signup" | "login";

type OpenAuthModalOptions = {
  defaultMode?: AuthModalMode;
  initialRole?: UserRole | null;
  variant?: AuthModalVariant;
  title?: string;
  description?: string;
  redirectAfterAuth?: string;
};

type AuthModalContextValue = {
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  isOpen: boolean;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

const DEFAULT_MODE: AuthModalMode = "login";

export function AuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session } = useSessionContext();
  const [modalState, setModalState] = useState<OpenAuthModalOptions | null>(
    null
  );

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    if (!pathname) return "/";
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const closeAuthModal = useCallback(() => {
    setModalState(null);
  }, []);

  const openAuthModal = useCallback(
    (options?: OpenAuthModalOptions) => {
      if (session?.user) {
        return;
      }

      setModalState({
        defaultMode: options?.defaultMode ?? DEFAULT_MODE,
        initialRole: options?.initialRole ?? null,
        variant: options?.variant,
        title: options?.title,
        description: options?.description,
        redirectAfterAuth: options?.redirectAfterAuth ?? currentPath,
      });
    },
    [currentPath, session]
  );

  const value = useMemo<AuthModalContextValue>(
    () => ({
      openAuthModal,
      closeAuthModal,
      isOpen: modalState !== null,
    }),
    [closeAuthModal, modalState, openAuthModal]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalState !== null}
        onClose={closeAuthModal}
        initialRole={modalState?.initialRole ?? undefined}
        variant={modalState?.variant}
        title={modalState?.title}
        description={modalState?.description}
        redirectAfterAuth={modalState?.redirectAfterAuth}
        defaultMode={modalState?.defaultMode ?? DEFAULT_MODE}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }

  return context;
}
