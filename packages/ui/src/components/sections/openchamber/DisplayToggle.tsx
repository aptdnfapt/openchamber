import React from 'react';
import { RiQuestionLine } from '@remixicon/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DisplayToggleProps {
  /** Whether the toggle is checked */
  checked: boolean;
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void;
  /** Label for the toggle */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional tooltip text */
  tooltip?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Reusable toggle component for display settings.
 * Provides checkbox switch, label, description, and optional tooltip.
 */
export const DisplayToggle: React.FC<DisplayToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  tooltip,
  disabled = false,
  className,
}) => {
  const toggleId = `toggle-${label.replace(/\s+/g, '-')}`;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={toggleId}
        className="flex items-start justify-between gap-3 cursor-pointer"
      >
        <div className="flex items-start gap-1.5 flex-1">
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="typography-ui-label font-medium text-foreground">
                {label}
              </span>

              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.preventDefault()}
                        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        aria-label="More information"
                      >
                        <RiQuestionLine className="h-4 w-4 shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="typography-meta">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {description && (
              <p className="typography-meta text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <input
          id={toggleId}
          type="checkbox"
          className="h-3.5 w-3.5 accent-primary shrink-0 mt-0.5"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      </label>
    </div>
  );
};
