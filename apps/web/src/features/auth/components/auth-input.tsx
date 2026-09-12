import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import type { ChangeEvent } from "react"

interface AuthInputProps {
  name: string
  label: string
  type?: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  errors: Array<{ message?: string } | undefined>
}

export function AuthInput({
  name,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  onBlur,
  errors,
}: AuthInputProps) {
  const invalid = errors.length > 0
  const errorId = `${name}-error`
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        className="min-h-11"
      />
      <FieldError id={errorId} errors={errors} />
    </Field>
  )
}
