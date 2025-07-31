// Secure storage utilities for sensitive data

const STORAGE_PREFIX = 'vsi_'; // Verified System Inference prefix

export class SecureStorage {
  // Use sessionStorage for tokens (cleared on browser close)
  static setToken(token: string): void {
    // In production, consider using httpOnly cookies instead
    sessionStorage.setItem(`${STORAGE_PREFIX}token`, token);
  }

  static getToken(): string | null {
    return sessionStorage.getItem(`${STORAGE_PREFIX}token`);
  }

  static removeToken(): void {
    sessionStorage.removeItem(`${STORAGE_PREFIX}token`);
  }

  // Store non-sensitive user data in localStorage
  static setUserData(user: any): void {
    // Remove sensitive fields before storing
    const { password_hash, ...safeUser } = user;
    localStorage.setItem(`${STORAGE_PREFIX}user`, JSON.stringify(safeUser));
  }

  static getUserData(): any | null {
    const data = localStorage.getItem(`${STORAGE_PREFIX}user`);
    return data ? JSON.parse(data) : null;
  }

  static removeUserData(): void {
    localStorage.removeItem(`${STORAGE_PREFIX}user`);
  }

  // Clear all stored data
  static clearAll(): void {
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear local storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if token exists and is not expired (basic check)
  static hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Basic JWT decode to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }
}