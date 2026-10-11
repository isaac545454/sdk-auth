export function StorageHint({ className = 'text-xs text-muted-foreground' }: { className?: string }) {
  return <p className={className}>Arquivo em packages/login-sdk/data/auth.sqlite</p>;
}
