import { AccountForm } from "./components/AccountForm";
import { SessionLoading } from "./components/SessionLoading";
import { SessionPanel } from "./components/SessionPanel";
import { Shell } from "./components/Shell";
import { useAuth } from "./hooks/useAuth";
import { status } from "./models/status";

export function App() {
  const methods = useAuth();

  if (methods.status === status.loading) {
    return (
      <Shell>
        <SessionLoading />
      </Shell>
    );
  }

  if (methods.status === status.authenticated && methods.session) {
    return (
      <Shell>
        <SessionPanel session={methods.session} signOut={methods.signOut} />
      </Shell>
    );
  }

  return (
    <Shell>
      <AccountForm {...methods} />
    </Shell>
  );
}
