/**
 * Configuración y validación de variables de entorno
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

export interface Config {
  ahrefs: {
    apiKey: string;
    rateLimit: number;
    cacheTtl: number;
  };
  googleAds: {
    developerToken: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    customerId: string;
    rateLimit: number;
    cacheTtl: number;
  };
  logging: {
    level: string;
  };
}

function getEnvVar(key: string, required = true, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }

  return num;
}

export function loadConfig(): Config {
  return {
    ahrefs: {
      apiKey: getEnvVar('AHREFS_API_KEY'),
      rateLimit: getEnvNumber('AHREFS_RATE_LIMIT', 10),
      cacheTtl: getEnvNumber('CACHE_TTL_AHREFS', 86400), // 24h
    },
    googleAds: {
      developerToken: getEnvVar('GOOGLE_ADS_DEVELOPER_TOKEN'),
      clientId: getEnvVar('GOOGLE_ADS_CLIENT_ID'),
      clientSecret: getEnvVar('GOOGLE_ADS_CLIENT_SECRET'),
      refreshToken: getEnvVar('GOOGLE_ADS_REFRESH_TOKEN'),
      customerId: getEnvVar('GOOGLE_ADS_CUSTOMER_ID'),
      rateLimit: getEnvNumber('GOOGLE_ADS_RATE_LIMIT', 5),
      cacheTtl: getEnvNumber('CACHE_TTL_GOOGLE_ADS', 604800), // 7 días
    },
    logging: {
      level: getEnvVar('LOG_LEVEL', false, 'info'),
    },
  };
}

// Validar configuración al inicializar
export const config = loadConfig();

// Re-exportar para uso directo
export default config;
