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
          className="min-w-0 flex-1 resize-none rounded-[20px] border border-[#dbe5f3] bg-[#f8fbff] px-4 py-3 text-sm focus:border-[#93c5fd] focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-[20px] bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          {t("send")}
        </button>
      </div>
    </div>
  );
}
