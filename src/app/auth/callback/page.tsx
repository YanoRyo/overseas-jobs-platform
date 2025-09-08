"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // OAuth 後に URL からリダイレクト先を取得
      const redirect = searchParams.get("redirect") || "/";

      console.log("🔑 AuthCallback 起動");
      console.log("URL redirect param:", redirect);

      // Supabase でユーザー情報を取得
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        router.push("/login"); // エラー時はログインページに戻す
        return;
      }

      if (user) {
        console.log("👤 ログインユーザー:", user);

        // public.users に upsert（まだ存在しなければ作成）
        const { error: insertError } = await supabase.from("users").upsert([
          {
            id: user.id,
            username: user.email?.split("@")[0] ?? "no-name",
            role: "student",
          },
        ]);

        if (insertError) {
          console.error("public.users へのINSERT失敗:", insertError);
        }
      }

      // リダイレクト先へ
      router.push(redirect);
    };

    handleOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg font-semibold">ログイン処理中...</p>
    </div>
  );
}
