export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = "rb_users";
const CURRENT_USER_KEY = "user";

function getUsers(): User[] {
  if (typeof window === "undefined") return [];

  const usersRaw = localStorage.getItem(USERS_KEY);
  if (!usersRaw) return [];

  try {
    return JSON.parse(usersRaw) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function sanitizeUser(user: User): Omit<User, "password"> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function register({ name, email, password }: RegisterInput): {
  ok: boolean;
  message: string;
} {
  if (!name || !email || !password) {
    return { ok: false, message: "Preencha todos os campos." };
  }

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const alreadyExists = users.some((user) => user.email === normalizedEmail);
  if (alreadyExists) {
    return { ok: false, message: "Este e-mail já está cadastrado." };
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
  };

  saveUsers([...users, newUser]);

  return { ok: true, message: "Cadastro realizado com sucesso." };
}

export function login(email: string, password: string): Omit<User, "password"> | null {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.email === normalizedEmail && user.password === password
  );

  if (existingUser) {
    const safeUser = sanitizeUser(existingUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  }

  const isDemoLogin =
    normalizedEmail === "demo@radarbank.com" && password === "demo123";

  if (isDemoLogin) {
    const demoUser = {
      id: "demo",
      name: "Demo",
      email: normalizedEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser));
    return demoUser;
  }

  return null;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): Omit<User, "password"> | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
