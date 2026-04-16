/**
 * Global configuration environment.
 * Fallbacks to localhost:3001 for local development if the environment variable is not provided.
 * Useful for seamless clone-and-run without manual configuration.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
