"use client";

import { useState } from "react";

export function MessageInput({
  onSend,
  sending,
}: {
  onSend: (text: string) => Promise<boolean>;
  sending: boolean;
}) {
  const [text, setText] = useState("");

  const submit = async () => {
    const ok = await onSend(text);
    if (ok) setText("");
  };

  return (
    <div className="border-t p-3">
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Your message"
          className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={sending || !text.trim()}
          className="px-4 rounded-xl bg-black text-white text-sm disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
