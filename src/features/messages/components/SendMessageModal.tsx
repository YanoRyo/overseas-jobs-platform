"use client";

import { useState } from "react";
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
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const { sendMessage, loading, error } = useSendMessage();

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!category || !message.trim()) return;

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
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-2">Contact {mentorName}</h2>

        <p className="text-sm text-gray-600 mb-4">
          メッセージ内容を選択して送信してください
        </p>

        {/* カテゴリ */}
        <label className="block text-sm font-medium mb-1">目的を選択</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4"
        >
          <option value="">選択してください</option>
          <option value="career">海外就職について相談したい</option>
          <option value="visa">ビザについて聞きたい</option>
          <option value="interview">面接対策</option>
          <option value="other">その他</option>
        </select>

        {/* メッセージ */}
        <label className="block text-sm font-medium mb-1">メッセージ</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="こんにちは！海外就職について相談したいです。"
        />

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <button
          className="w-full bg-accent text-white py-2 rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "送信中..." : "メッセージを送る"}
        </button>
      </div>
    </div>
  );
};
