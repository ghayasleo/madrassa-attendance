import { forwardRef, useId } from 'react';
import type { ReactNode } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  label?: ReactNode;
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
};

/** Sentinel used for the "no value" option, since Radix disallows value="". */
const EMPTY_VALUE = '__none__';

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { label, error, placeholder, value, onValueChange, options, disabled, className, id, name },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value === '' ? EMPTY_VALUE : value}
        onValueChange={(v) => onValueChange?.(v === EMPTY_VALUE ? '' : v)}
        disabled={disabled}
        name={name}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={selectId}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5',
            'text-start text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'data-[placeholder]:text-gray-400',
            'data-[state=open]:ring-2 data-[state=open]:ring-brand-500 data-[state=open]:border-brand-500',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-gray-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'relative z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden',
              'rounded-xl border border-gray-200 bg-white shadow-lg',
              'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value === '' ? EMPTY_VALUE : opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 ps-8 pe-3 text-sm text-gray-900 outline-none',
                    'data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-800',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                  )}
                >
                  <span className="absolute start-2 flex size-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="size-4 text-brand-600" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
