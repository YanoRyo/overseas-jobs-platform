'use client';

import { useCallback } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import type { AvailabilityFormData, AvailabilitySlot, DayOfWeek } from '../../types/registration';
import { TIMEZONE_OPTIONS, DAY_OF_WEEK_OPTIONS, TIME_OPTIONS } from '../../constants/options';
import { StepNavigation } from '../shared/StepNavigation';

type AvailabilityStepProps = {
  data: AvailabilityFormData;
  errors: Record<string, string>;
  onUpdate: (data: Partial<AvailabilityFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
};

export const AvailabilityStep = ({
  data,
  errors,
  onUpdate,
  onNext,
  onBack,
  canGoNext,
}: AvailabilityStepProps) => {
  // 曜日ごとのスロットをグループ化
  const slotsByDay = DAY_OF_WEEK_OPTIONS.map((day) => ({
    day,
    slots: data.slots.filter((slot) => slot.dayOfWeek === day.value),
  }));

  // スロット追加
  const addSlot = useCallback(
    (dayOfWeek: DayOfWeek) => {
      const newSlot: AvailabilitySlot = {
        id: crypto.randomUUID(),
        dayOfWeek,
        startTime: '09:00',
        endTime: '17:00',
        isEnabled: true,
      };
      onUpdate({ slots: [...data.slots, newSlot] });
    },
    [data.slots, onUpdate]
  );

  // スロット削除
  const removeSlot = useCallback(
    (id: string) => {
      onUpdate({ slots: data.slots.filter((slot) => slot.id !== id) });
    },
    [data.slots, onUpdate]
  );

  // スロット更新
  const updateSlot = useCallback(
    (id: string, field: keyof AvailabilitySlot, value: string | boolean) => {
      onUpdate({
        slots: data.slots.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)),
      });
    },
    [data.slots, onUpdate]
  );

  // 曜日のトグル
  const toggleDay = useCallback(
    (dayOfWeek: DayOfWeek) => {
      const daySlots = data.slots.filter((slot) => slot.dayOfWeek === dayOfWeek);

      if (daySlots.length === 0) {
        // スロットがない場合は追加
        addSlot(dayOfWeek);
      } else {
        // スロットがある場合は全て有効/無効を切り替え
        const allEnabled = daySlots.every((slot) => slot.isEnabled);
        onUpdate({
          slots: data.slots.map((slot) =>
            slot.dayOfWeek === dayOfWeek ? { ...slot, isEnabled: !allEnabled } : slot
          ),
        });
      }
    },
    [data.slots, addSlot, onUpdate]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Availability</h1>
        <p className="text-secondary mt-2">Set your availability for sessions</p>
      </div>

      {/* Timezone */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-2">Set your timezone</h2>
        <p className="text-secondary text-sm mb-3">
          A correct timezone is essential to coordinate lessons with international students
        </p>

        <label htmlFor="timezone" className="block text-sm font-medium text-primary mb-1">
          Choose your timezone <span className="text-error">*</span>
        </label>
        <select
          id="timezone"
          value={data.timezone}
          onChange={(e) => onUpdate({ timezone: e.target.value })}
          className={`
            w-full md:w-96 border rounded-lg px-3 py-2 bg-surface text-primary
            ${errors.timezone ? 'border-error' : 'border-border'}
            focus:outline-none focus:ring-2 focus:ring-accent
          `}
          aria-required="true"
        >
          <option value="">Select timezone</option>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label} ({tz.offset})
            </option>
          ))}
        </select>
        {errors.timezone && <p className="text-error text-sm mt-1">{errors.timezone}</p>}
      </div>

      {/* Availability */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-2">Set your availability</h2>
        <p className="text-secondary text-sm mb-4">
          Availability shows your potential working hours. Students can book lessons at these times.
        </p>

        {/* Info box */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Add popular hours to get more students</p>
            <p className="mt-1">
              Most students book lessons between 6:00 and 9:00 (popular hours). Add time slots
              during these hours to triple your chances of getting booked.
            </p>
          </div>
        </div>

        {/* Day-by-day schedule */}
        <div className="space-y-4">
          {slotsByDay.map(({ day, slots }) => {
            const hasSlots = slots.length > 0;
            const isEnabled = slots.some((slot) => slot.isEnabled);

            return (
              <div key={day.value} className="border border-border rounded-lg p-4">
                {/* Day header */}
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleDay(day.value)}
                    className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                    aria-label={`Enable ${day.label}`}
                  />
                  <span className="font-medium text-primary">{day.label}</span>
                </div>

                {/* Time slots */}
                {hasSlots && (
                  <div className="space-y-3 ml-8">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted">From</label>
                          <select
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot.id, 'startTime', e.target.value)}
                            disabled={!slot.isEnabled}
                            className="border border-border rounded-lg px-2 py-1.5 bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted">To</label>
                          <select
                            value={slot.endTime}
                            onChange={(e) => updateSlot(slot.id, 'endTime', e.target.value)}
                            disabled={!slot.isEnabled}
                            className="border border-border rounded-lg px-2 py-1.5 bg-surface text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                          >
                            {TIME_OPTIONS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          className="p-1.5 text-muted hover:text-error transition-colors"
                          aria-label="Remove time slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add another timeslot */}
                    <button
                      type="button"
                      onClick={() => addSlot(day.value)}
                      className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add another timeslot</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {errors.slots && <p className="text-error text-sm mt-4">{errors.slots}</p>}
      </div>

      {/* Navigation */}
      <StepNavigation onBack={onBack} onNext={onNext} canGoNext={canGoNext} />
    </div>
  );
};
