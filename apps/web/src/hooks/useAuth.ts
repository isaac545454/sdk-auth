import { zodResolver } from '@hookform/resolvers/zod';
import { register, signIn, signOut, useSession } from '@curso/login-sdk/react';
import { useState, type BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DEFAULT_ROLE, roleSchema } from '../models/permissions';

const accountSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe o e-mail.')
    .pipe(z.email('Use um e-mail válido, como nome@empresa.com.')),
  password: z
    .string()
    .min(1, 'Informe a senha.')
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
  role: roleSchema,
});

export type AccountValues = z.infer<typeof accountSchema>;

function messageFrom(err: unknown): string {
  if (!(err instanceof Error) || err.message.length === 0) {
    return 'Não foi possível concluir. Tente de novo.';
  }
  if (err.message === 'Failed to fetch') {
    return 'Sem conexão com o servidor. Verifique a rede e tente de novo.';
  }
  return err.message;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const {
    register: field,
    control,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: '',
      password: '',
      role: DEFAULT_ROLE,
    },
  });

  function submit(action: (values: AccountValues) => Promise<void>) {
    return (event?: BaseSyntheticEvent) => {
      setNotice('');
      setError('');
      void handleSubmit(async (values) => {
        try {
          await action(values);
          resetField('password');
        } catch (err) {
          setError(messageFrom(err));
        }
      })(event);
    };
  }

  const onLogin = submit(async ({ email, password }) => {
    await signIn({ email, password });
  });

  const onRegister = submit(async ({ email, password, role }) => {
    await register({ email, password, role });
    setNotice('Conta criada. Entre com o mesmo e-mail.');
  });

  return {
    session,
    status,
    notice,
    error,
    errors,
    isSubmitting,
    field,
    control,
    onLogin,
    onRegister,
    signOut,
  };
}

export type AuthMethods = ReturnType<typeof useAuth>;
