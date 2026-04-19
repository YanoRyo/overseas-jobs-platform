"use client";

import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@/features/auth/types";
import type { LessonItem } from "../../types/myLessons";

type Props = {
  lesson: LessonItem | null;
  open: boolean;
  role: UserRole;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { bookingId: string; reason: string }) => Promise<void>;
};

export function LessonCancellationDialog({
  lesson,
  open,
  role,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const t = useTranslations("settings.myLessons");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
  }, [open]);

  async function handleSubmit() {
    if (!lesson) return;

    await onSubmit({
      bookingId: lesson.id,
      reason,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-xl font-semibold text-[#1f1f2d]">
            {role === "mentor" ? t("cancelLesson") : t("requestCancellation")}
          </Dialog.Title>

          {lesson ? (
            <p className="mt-3 text-sm text-[#606579]">
              {role === "mentor"
                ? t("mentorCancellationDialogDescription", {
                    participant: lesson.participantName,
                  })
                : t("studentCancellationDialogDescription", {
                    participant: lesson.participantName,
                  })}
            </p>
          ) : null}

          <label className="mt-5 block">
            <span className="mb-1.5 block text-sm font-medium text-[#1f1f2d]">
              {t("requestReason")}
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder={
                role === "mentor"
                  ? t("mentorCancellationReasonPlaceholder")
                  : t("requestReasonPlaceholder")
              }
              className="w-full rounded-2xl border border-[#d5d7df] px-3 py-2.5 text-sm text-[#1f1f2d] outline-none transition focus:border-[#1f1f2d]"
            />
          </label>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl border border-[#d5d7df] px-4 py-2 text-sm font-medium text-[#1f1f2d] hover:bg-[#f8f8fb] disabled:opacity-60"
            >
              {t("requestCancelButton")}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="rounded-xl bg-[#1f1f2d] px-4 py-2 text-sm font-medium text-white hover:bg-[#11111b] disabled:opacity-60"
            >
              {submitting
                ? t("requestSubmitting")
                : role === "mentor"
                  ? t("confirmMentorCancellation")
                  : t("requestSubmitButton")}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
