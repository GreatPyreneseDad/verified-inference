import { SecureStorage } from './secureStorage'

// Token manager to break circular dependency between authStore and axios
class TokenManager {
  private static instance: TokenManager
  private logoutCallback: (() => void) | null = null

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager()
    }
    return TokenManager.instance
  }

  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback
  }

  getToken(): string | null {
    return SecureStorage.getToken()
  }

  hasValidToken(): boolean {
    return SecureStorage.hasValidToken()
  }

  triggerLogout() {
    if (this.logoutCallback) {
      this.logoutCallback()
    }
  }
}

export const tokenManager = TokenManager.getInstance()