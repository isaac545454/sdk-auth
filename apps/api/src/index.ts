import { AuthError, createAuth, createDatabaseFile, type AuthErrorCode } from '@curso/login-sdk';
import express, { type ErrorRequestHandler, type Request } from 'express';

const file = createDatabaseFile();
const auth = createAuth({ file });

const app = express();
app.use(express.json());

const statusByCode: Record<AuthErrorCode, number> = {
  INVALID_INPUT: 400,
  EMAIL_IN_USE: 409,
  INVALID_CREDENTIALS: 401,
};

app.post('/api/register', async (req, res) => {
  const user = await auth.register(req.body);
  res.status(201).json(user);
});

app.post('/api/login', async (req, res) => {
  const session = await auth.login(req.body);
  res.json(session);
});

app.get('/api/me', (req, res) => {
  const token = bearer(req);
  const user = token ? auth.me(token) : null;
  if (!user) {
    res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Sessão inválida.',
    });
    return;
  }
  res.json(user);
});

app.post('/api/logout', (req, res) => {
  const token = bearer(req);
  if (token) auth.logout(token);
  res.status(204).end();
});

const onError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AuthError) {
    res.status(statusByCode[error.code]).json({ code: error.code, message: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ code: 'INTERNAL', message: 'Falha inesperada.' });
};

app.use(onError);

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => {
  console.log(`api http://localhost:${port}`);
  console.log(`banco ${file}`);
});

function bearer(req: Request): string | null {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}
