"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function MessageInput({
  onSend,
  sending,
}: {
  onSend: (text: string) => Promise<boolean>;
  sending: boolean;
}) {
  const t = useTranslations("messages");
  const [text, setText] = useState("");

  const submit = async () => {
    const ok = await onSend(text);
    if (ok) setText("");
  };

  return (
    <div className="p-3">
      <div className="flex min-w-0 items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
