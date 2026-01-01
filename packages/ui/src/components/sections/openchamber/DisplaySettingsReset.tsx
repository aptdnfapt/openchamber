import React from 'react';
import { ButtonSmall } from '@/components/ui/button-small';
import { cn } from '@/lib/utils';

export interface DisplaySettingsResetProps {
  /** Callback when reset is clicked */
  onReset: () => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Reset button component for display settings.
 * Resets all display settings to their default values.
 */
export const DisplaySettingsReset: React.FC<DisplaySettingsResetProps> = ({
  onReset,
  disabled = false,
  className,
}) => {
  return (
    <ButtonSmall
      type="button"
      variant="ghost"
      onClick={onReset}
      disabled={disabled}
      className={cn('text-muted-foreground', className)}
    >
      Reset to defaults
    </ButtonSmall>
  );
};
