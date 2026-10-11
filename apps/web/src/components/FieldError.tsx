export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}
