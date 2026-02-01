"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      setLocalError("You need to be logged in to send a message.");
      return;
      // すぐログインに飛ばしたいなら下を使う
      // router.push("/auth/login");
      // return;
    }

    // 1) 入力バリデーション
    if (!category) {
      setLocalError("Please select a purpose.");
      return;
    }
    if (!message.trim()) {
      setLocalError("Please enter a message.");
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

        <h2 className="text-xl font-semibold mb-2">Contact {mentorName}</h2>

        <p className="text-sm text-gray-600 mb-4">
          Please select a message topic and send your message.
        </p>

        {/* 未ログイン時の案内 */}
        {!isLoggedIn && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Please sign up or log in to send a message.
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/auth/login?redirect=${encodeURIComponent(
                      window.location.pathname
                    )}`
                  )
                }
                className="px-3 py-1 rounded-md bg-yellow-700 text-white text-xs font-semibold"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/auth/signup?redirect=${encodeURIComponent(
                      window.location.pathname
                    )}`
                  )
                }
                className="px-3 py-1 rounded-md border border-yellow-700 text-yellow-800 text-xs font-semibold"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* カテゴリ */}
        <label className="block text-sm font-medium mb-1">
          Select a purpose
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          disabled={!isLoggedIn || loading}
        >
          <option value="">Select an option</option>
          <option value="career">Working abroad</option>
          <option value="visa">Visa questions</option>
          <option value="interview">Interview preparation</option>
          <option value="other">Other</option>
        </select>

        {/* メッセージ */}
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="Hello! I would like to consult about working abroad."
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
          {loading ? "Sending..." : "Send Message"}
        </button>
      </div>
    </div>
  );
};
