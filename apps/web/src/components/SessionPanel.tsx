import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@isaac545454/nucleus";
import type { AuthMethods } from "../hooks/useAuth";
import { StorageHint } from "./StorageHint";

export function SessionPanel({
  session,
  signOut,
}: {
  session: NonNullable<AuthMethods["session"]>;
  signOut: AuthMethods["signOut"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="break-all text-xl">
          {session.user.email}
        </CardTitle>
        <CardDescription>
          Permissão {session.user.role}. Sessão aberta neste navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {session.user.permissions.map((permission) => (
          <Badge key={permission} variant="secondary">
            {permission}
          </Badge>
        ))}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void signOut();
          }}
        >
          Sair
        </Button>
        <StorageHint />
      </CardFooter>
    </Card>
  );
}
