import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type MultiSelectProps = {
  label?: ReactNode;
  placeholder?: string;
  emptyText?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  disabled?: boolean;
  className?: string;
};

export function MultiSelect({
  label,
  placeholder,
  emptyText,
  values,
  onChange,
  options,
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerId = useId();

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  const selected = options.filter((opt) => values.includes(opt.value));

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={triggerId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            className={cn(
              'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2',
              'text-start text-gray-900 shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'data-[state=open]:ring-2 data-[state=open]:ring-brand-500 data-[state=open]:border-brand-500',
              className,
            )}
          >
            {selected.length === 0 ? (
              <span className="text-gray-400">{placeholder}</span>
            ) : (
              <span className="flex flex-wrap gap-1.5 py-0.5">
                {selected.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 ps-2.5 pe-1 text-xs font-medium text-brand-800"
                  >
                    {opt.label}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(opt.value);
                      }}
                      className="rounded-full p-0.5 text-brand-600 hover:bg-brand-200"
                    >
                      <X className="size-3" />
                    </span>
                  </span>
                ))}
              </span>
            )}
            <ChevronDown className="size-4 shrink-0 text-gray-400" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
              'max-h-72 overflow-y-auto p-1',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            )}
          >
            {options.length === 0 ? (
              <p className="px-2 py-2 text-sm text-gray-500">{emptyText}</p>
            ) : (
              options.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
                  >
                    <CheckboxPrimitive.Root
                      checked={checked}
                      onCheckedChange={() => toggle(opt.value)}
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white',
                        'data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      )}
                    >
                      <CheckboxPrimitive.Indicator>
                        <Check className="size-3 text-white" />
                      </CheckboxPrimitive.Indicator>
                    </CheckboxPrimitive.Root>
                    <span className="text-gray-900">
                      {opt.label}
                      {opt.description && <span className="block text-xs text-gray-500">{opt.description}</span>}
                    </span>
                  </label>
                );
              })
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
