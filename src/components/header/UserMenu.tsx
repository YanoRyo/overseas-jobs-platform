"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import type { UserRole } from "@/features/auth/types";
import { getSettingsTopTabs } from "@/features/settings/constants/topTabs";

type Profile = {
  role: UserRole | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
};

type MenuItem = {
  id: string;
  label: string;
  href: string;
};

type Props = {
  viewerRole?: UserRole | null;
};

function getInitials(name?: string | null) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "GU";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

function getDisplayName(profile: Profile | null, email?: string | null) {
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (profile?.username) return profile.username;
  if (email) return email.split("@")[0];
  return "Guest";
}

function getMenuItems(role: UserRole): MenuItem[] {
  const tabItems = getSettingsTopTabs(role)
    .filter((tab) => tab.href && tab.clickable)
    .map((tab) => ({
      id: tab.id,
      label: tab.label,
      href: tab.href as string,
    }));

  if (role === "student") {
    return [
      ...tabItems,
      { id: "saved-tutors", label: "Saved tutors", href: "/favorites" },
    ];
  }

  return tabItems;
}

export default function UserMenu({ viewerRole = null }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);
  const searchKey = searchParams.toString();
  const metadataRole =
    user?.user_metadata?.role === "mentor" || user?.user_metadata?.role === "student"
      ? (user.user_metadata.role as UserRole)
      : null;
  const menuRole = user
    ? viewerRole ?? metadataRole ?? profile?.role ?? null
    : null;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          "role, username, first_name, last_name, avatar_url, avatar_updated_at"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("fetch profile error:", error);
        setProfile(null);
        return;
      }

      setProfile((data as Profile | null) ?? null);
    };

    void fetchProfile();
  }, [supabase, user]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchKey]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const label = useMemo(
    () => getDisplayName(profile, user?.email),
    [profile, user?.email]
  );
  const initials = useMemo(() => getInitials(label), [label]);
  const avatarSrc = useMemo(() => {
    if (!profile?.avatar_url) return null;
    if (!profile.avatar_updated_at) return profile.avatar_url;

    const separator = profile.avatar_url.includes("?") ? "&" : "?";
    return `${profile.avatar_url}${separator}v=${encodeURIComponent(
      profile.avatar_updated_at
    )}`;
  }, [profile]);
  const statusLabel = user
    ? menuRole === "mentor"
      ? "Mentor account"
      : menuRole === "student"
        ? "Student account"
        : "Account"
    : "Not logged in";
  const menuItems = useMemo(
    () => (menuRole ? getMenuItems(menuRole) : []),
    [menuRole]
  );
  const currentHref = useMemo(
    () => `${pathname || "/"}${searchKey ? `?${searchKey}` : ""}`,
    [pathname, searchKey]
  );

  const isActiveItem = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/settings") {
      return (
        pathname === "/settings"
        && searchParams.get("tab") !== "messages"
        && searchParams.get("tab") !== "my-lessons"
      );
    }

    if (href.startsWith("/settings?tab=")) {
      const tab = href.split("tab=")[1];
      return pathname === "/settings" && searchParams.get("tab") === tab;
    }

    return pathname === href;
  };

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const goLogin = () => {
    setOpen(false);
    router.push(`/auth/login?redirect=${encodeURIComponent(currentHref)}`);
  };

  const logout = async () => {
    setOpen(false);
    setProfile(null);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("signOut error:", error);
    }

    router.replace("/");
    router.refresh();
  };

  const renderAvatar = (sizeClassName: string, textClassName: string) => (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#d9dee8] ${sizeClassName}`}
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt={`${label} avatar`}
          fill
          sizes="48px"
          className="object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold text-[#455065] ${textClassName}`}
        >
          {initials}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#d9dee8] text-sm font-semibold text-[#455065] transition-colors hover:bg-[#cfd6e1]"
        aria-label="user menu"
        title={label}
      >
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt={`${label} avatar`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-[28px] border border-[#e4e7ee] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="flex items-center gap-3 px-5 py-5">
            {renderAvatar("h-12 w-12", "text-base")}
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-[#1f1f2d]">
                {label}
              </div>
              <div className="mt-1 truncate text-sm text-[#7a8094]">
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="mx-5 border-t border-[#e6e8ef]" />

          <div className="px-3 py-3">
            {user ? (
              menuItems.map((item) => {
                const active = isActiveItem(item.href);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-[17px] transition-colors ${
                      active
                        ? "bg-[#f4f6fb] font-semibold text-[#1f1f2d]"
                        : "text-[#1f1f2d] hover:bg-[#f7f8fc]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                onClick={goLogin}
                className="w-full rounded-2xl px-4 py-3 text-left text-[17px] text-[#1f1f2d] transition-colors hover:bg-[#f7f8fc]"
              >
                Log in
              </button>
            )}
          </div>

          {user && (
            <>
              <div className="mx-5 border-t border-[#e6e8ef]" />
              <div className="px-3 py-3">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-2xl px-4 py-3 text-left text-[17px] text-[#1f1f2d] transition-colors hover:bg-[#f7f8fc]"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
