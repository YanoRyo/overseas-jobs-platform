"use client";

import { Dialog } from "@headlessui/react";
import { CheckCircle2 } from "lucide-react";

type AuthNoticeDialogProps = {
  open: boolean;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimary: () => void;
};

export const AuthNoticeDialog = ({
  open,
  title,
  description,
  primaryLabel = "Close",
  onPrimary,
}: AuthNoticeDialogProps) => (
  <Dialog
    open={open}
    onClose={onPrimary}
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
  >
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm" aria-hidden="true" />

    <Dialog.Panel className="relative z-10 w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>

      <div className="mt-6 text-center">
        <Dialog.Title className="text-2xl font-semibold text-primary">
          {title}
        </Dialog.Title>
        <p className="mt-3 text-sm leading-6 text-secondary">{description}</p>
      </div>

      <button
        type="button"
        onClick={onPrimary}
        className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover"
      >
        {primaryLabel}
      </button>
    </Dialog.Panel>
  </Dialog>
);
