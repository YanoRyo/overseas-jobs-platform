"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

type Profile = {
  username: string | null;
};

function getInitials(name?: string | null) {
  const s = (name ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

export default function UserMenu() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);

  // users テーブルから username を読む（ログイン時のみ）
  useEffect(() => {
    if (!user) {
      setUsername(null);
      return;
    }

    const run = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("fetch username error:", error);
        setUsername(null);
        return;
      }
      setUsername((data as Profile | null)?.username ?? null);
    };

    run();
  }, [supabase, user]);

  const label = useMemo(() => {
    if (!user) return "Guest";

    return username ?? user.email?.split("@")[0] ?? user.id.slice(0, 8);
  }, [username, user]);

  const initials = useMemo(() => getInitials(label), [label]);

  // 外側クリックで閉じる
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const goStudentLogin = () => {
    setOpen(false);
    router.push("/auth/login?role=student");
  };

  const goMentorLogin = () => {
    setOpen(false);
    router.push("/auth/login?role=mentor");
  };

  const logout = async () => {
    setOpen(false);
    setUsername(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("signOut error:", error);
    }
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      {/* アバターボタン */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center font-semibold text-sm hover:bg-gray-300"
        aria-label="user menu"
        title={label}
      >
        {initials}
      </button>

      {/* ドロップダウン */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
          {/* 上部：ユーザー表示 */}
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-semibold truncate">{label}</div>
            <div className="text-xs text-gray-500 truncate">
              {user ? "Logged in" : "Not logged in"}
            </div>
          </div>

          {/* Settings を追加 */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              Settings
            </button>
          </div>

          {/* 未ログイン時だけログイン導線を表示 */}
          {!user && (
            <div className="py-1">
              <button
                type="button"
                onClick={goStudentLogin}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              >
                Log in as Student
              </button>

              <button
                type="button"
                onClick={goMentorLogin}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              >
                Log in as Mentor
              </button>
            </div>
          )}

          {/* ログイン中だけログアウトを表示 */}
          {user && (
            <div className="border-t py-1">
              <button
                type="button"
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
