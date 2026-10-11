import { Input, Label } from '@isaac545454/nucleus';
import type { ComponentProps } from 'react';
import { FieldError } from './FieldError';

type FormInputProps = Omit<ComponentProps<typeof Input>, 'id' | 'aria-invalid' | 'aria-describedby'> & {
  id: string;
  label: string;
  error?: string;
};

export function FormInput({ id, label, error, ...props }: FormInputProps) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? <FieldError id={errorId} message={error} /> : null}
    </div>
  );
}
