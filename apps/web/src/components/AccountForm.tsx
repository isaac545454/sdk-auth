import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@isaac545454/nucleus";
import { Controller } from "react-hook-form";
import type { AuthMethods } from "../hooks/useAuth";
import { ROLE_LABEL, ROLES } from "../models/permissions";
import { FieldError } from "./FieldError";
import { FormInput } from "./FormInput";
import { StorageHint } from "./StorageHint";

export function AccountForm({
  notice,
  error,
  errors,
  isSubmitting,
  field,
  control,
  onLogin,
  onRegister,
}: AuthMethods) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Conta local</CardTitle>
        <CardDescription>
          Cadastro e sessão neste computador. A senha fica só como hash.
        </CardDescription>
      </CardHeader>
      <form noValidate onSubmit={onLogin}>
        <CardContent className="space-y-4">
          {notice && (
            <Alert>
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}
          <FormInput
            id="email"
            label="E-mail"
            type="email"
            autoComplete="username"
            placeholder="voce@empresa.com"
            error={errors.email?.message}
            {...field("email")}
          />
          <div className="grid gap-2">
            <Label htmlFor="role">Permissão da conta nova</Label>
            <Controller
              name="role"
              control={control}
              render={({ field: roleField }) => (
                <Select
                  value={roleField.value}
                  onValueChange={roleField.onChange}
                  disabled={isSubmitting}
                  onOpenChange={(open) => {
                    if (!open) roleField.onBlur();
                  }}
                >
                  <SelectTrigger
                    id="role"
                    aria-invalid={Boolean(errors.role)}
                    aria-describedby={
                      errors.role ? "role-hint role-error" : "role-hint"
                    }
                    onBlur={roleField.onBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {ROLE_LABEL[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p id="role-hint" className="text-xs text-muted-foreground">
              Vale só ao criar a conta.
            </p>
            {errors.role?.message && (
              <FieldError id="role-error" message={errors.role.message} />
            )}
          </div>
          <FormInput
            id="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...field("password")}
          />
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col gap-2 sm:flex-row">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Entrar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isSubmitting}
            onClick={onRegister}
          >
            Criar conta
          </Button>
        </CardFooter>
      </form>
      <StorageHint className="px-6 pb-6 text-xs text-muted-foreground" />
    </Card>
  );
}
