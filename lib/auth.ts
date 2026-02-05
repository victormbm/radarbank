export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export function login(email: string, password: string): User | null {
  if (email && password) {
    const user: User = {
      id: "1",
      name: email.split("@")[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    };
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem("user");
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
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
