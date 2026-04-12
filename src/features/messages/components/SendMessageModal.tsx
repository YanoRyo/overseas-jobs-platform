"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useUser } from "@supabase/auth-helpers-react";

import { useSendMessage } from "../hooks/useSendMessage";

type Props = {
  mentorId: string;
  mentorName: string;
  isOpen: boolean;
  onClose: () => void;
};

export const SendMessageModal = ({
  mentorId,
  mentorName,
  isOpen,
  onClose,
}: Props) => {
  const t = useTranslations("messages.sendModal");
  const ta = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();

  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const { sendMessage, loading, error } = useSendMessage();

  const isLoggedIn = useMemo(() => !!user, [user]);

  if (!isOpen) return null;

  const handleSend = async () => {
    setLocalError(null);

    // 0) ログイン必須
    if (!isLoggedIn) {
      setLocalError(t("loginRequired"));
      return;
      // すぐログインに飛ばしたいなら下を使う
      // router.push("/auth/login");
      // return;
    }

    // 1) 入力バリデーション
    if (!category) {
      setLocalError(t("selectPurpose"));
      return;
    }
    if (!message.trim()) {
      setLocalError(t("enterMessage"));
      return;
    }

    const success = await sendMessage({
      mentorId,
      category,
      message,
    });

    if (success) {
      setCategory("");
      setMessage("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="close"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">{t("title", { mentorName })}</h2>

        <p className="text-sm text-gray-600 mb-4">
          {t("instruction")}
        </p>

        {/* 未ログイン時の案内 */}
        {!isLoggedIn && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            {t("notLoggedIn")}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/auth/login?redirect=${encodeURIComponent(
                      pathname
                    )}`
                  )
                }
                className="px-3 py-1 rounded-md bg-yellow-700 text-white text-xs font-semibold"
              >
                {ta("login.submit")}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/auth/signup?redirect=${encodeURIComponent(
                      pathname
                    )}`
                  )
                }
                className="px-3 py-1 rounded-md border border-yellow-700 text-yellow-800 text-xs font-semibold"
              >
                {ta("signup.submit")}
              </button>
            </div>
          </div>
        )}

        {/* カテゴリ */}
        <label className="block text-sm font-medium mb-1">
          {t("purposeLabel")}
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          disabled={!isLoggedIn || loading}
        >
          <option value="">{t("purposePlaceholder")}</option>
          <option value="career">{t("purposeWorkAbroad")}</option>
          <option value="visa">{t("purposeVisa")}</option>
          <option value="interview">{t("purposeInterview")}</option>
          <option value="other">{t("purposeOther")}</option>
        </select>

        {/* メッセージ */}
        <label className="block text-sm font-medium mb-1">{t("messageLabel")}</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder={t("messagePlaceholder")}
          disabled={!isLoggedIn || loading}
        />

        {/* エラー表示（local → hookの順で出す） */}
        {(localError || error) && (
          <p className="text-sm text-red-500 mb-3">{localError ?? error}</p>
        )}

        <button
          className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
          onClick={handleSend}
          disabled={!isLoggedIn || loading}
        >
          {loading ? t("sending") : t("submit")}
        </button>
      </div>
    </div>
  );
};
