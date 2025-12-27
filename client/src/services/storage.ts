// Local Storage Service
export class StorageService {
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue ?? null
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error)
      return defaultValue ?? null
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }

  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
    }
  }

  static exists(key: string): boolean {
    return localStorage.getItem(key) !== null
  }
}

// Session Storage Service
export class SessionStorageService {
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue ?? null
    } catch (error) {
      console.warn(`Error reading from sessionStorage key "${key}":`, error)
      return defaultValue ?? null
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error)
    }
  }

  static remove(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }

  static clear(): void {
    try {
      sessionStorage.clear()
    } catch (error) {
      console.warn('Error clearing sessionStorage:', error)
    }
  }

  static exists(key: string): boolean {
    return sessionStorage.getItem(key) !== null
  }
}