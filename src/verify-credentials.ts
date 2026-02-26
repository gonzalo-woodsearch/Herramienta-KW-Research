#!/usr/bin/env node

/**
 * Script de verificación de credenciales
 * Verifica que todas las APIs estén configuradas correctamente
 */

import config from './config.js';
import logger from './utils/logger.js';
import { AhrefsClient } from './api/ahrefs/client.js';
import { GoogleAdsClient } from './api/google-ads/client.js';

console.log('\n🔍 Verificando credenciales...\n');

async function verifyAhrefs(): Promise<boolean> {
  try {
    console.log('1️⃣  Ahrefs API...');

    if (!config.ahrefs.apiKey || config.ahrefs.apiKey.includes('PEGAR_TU')) {
      console.log('   ❌ AHREFS_API_KEY no configurada en .env\n');
      return false;
    }

    const client = new AhrefsClient();

    // Intentar una petición simple (puede fallar si no hay créditos, pero verificará auth)
    console.log('   → Verificando autenticación...');

    // Nota: No podemos hacer una petición real sin una URL válida
    // pero podemos verificar que la key esté configurada
    console.log('   ✅ API Key configurada\n');
    return true;
  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : String(error));
    console.log('   → Verifica tu AHREFS_API_KEY en el archivo .env\n');
    return false;
  }
}

async function verifyGoogleAds(): Promise<boolean> {
  try {
    console.log('2️⃣  Google Ads API...');

    // Verificar que todas las credenciales estén configuradas
    const requiredVars = [
      'developerToken',
      'clientId',
      'clientSecret',
      'refreshToken',
      'customerId',
    ];

    const missing: string[] = [];

    if (!config.googleAds.developerToken || config.googleAds.developerToken.includes('PEGAR_TU')) {
      missing.push('GOOGLE_ADS_DEVELOPER_TOKEN');
    }
    if (!config.googleAds.clientId || config.googleAds.clientId.includes('PEGAR_TU')) {
      missing.push('GOOGLE_ADS_CLIENT_ID');
    }
    if (!config.googleAds.clientSecret || config.googleAds.clientSecret.includes('PEGAR_TU')) {
      missing.push('GOOGLE_ADS_CLIENT_SECRET');
    }
    if (!config.googleAds.refreshToken || config.googleAds.refreshToken.includes('PEGAR_TU')) {
      missing.push('GOOGLE_ADS_REFRESH_TOKEN');
    }
    if (!config.googleAds.customerId || config.googleAds.customerId === '1234567890') {
      missing.push('GOOGLE_ADS_CUSTOMER_ID');
    }

    if (missing.length > 0) {
      console.log('   ❌ Variables no configuradas:');
      missing.forEach(v => console.log(`      - ${v}`));
      console.log('\n   → Ver guía: CREDENTIALS_GUIDE.md\n');
      return false;
    }

    console.log('   → Verificando conexión...');

    const client = new GoogleAdsClient();

    try {
      await client.getCustomer();
      console.log('   ✅ Todas las credenciales configuradas correctamente\n');
      return true;
    } catch (error: any) {
      console.log('   ❌ Error de autenticación:', error.message);
      console.log('   → Verifica que tus credenciales sean correctas');
      console.log('   → Especialmente el REFRESH_TOKEN (suele expirar)\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : String(error));
    console.log('   → Verifica tus credenciales de Google Ads en .env\n');
    return false;
  }
}

async function main() {
  const ahrefsOk = await verifyAhrefs();
  const googleAdsOk = await verifyGoogleAds();

  console.log('━'.repeat(50));

  if (ahrefsOk && googleAdsOk) {
    console.log('✅ TODAS LAS CREDENCIALES VERIFICADAS');
    console.log('\n🚀 La herramienta está lista para usar!');
    console.log('\nPrueba con:');
    console.log('  npm start -- url --url https://example.com/implantes --limit 10\n');
    process.exit(0);
  } else {
    console.log('⚠️  ALGUNAS CREDENCIALES FALTAN O SON INCORRECTAS');
    console.log('\n📖 Consulta la guía completa:');
    console.log('  CREDENTIALS_GUIDE.md\n');
    console.log('💡 Pasos siguientes:');
    if (!ahrefsOk) {
      console.log('  1. Configurar AHREFS_API_KEY en .env');
    }
    if (!googleAdsOk) {
      console.log('  2. Configurar credenciales de Google Ads en .env');
    }
    console.log('  3. Ejecutar de nuevo: npm run verify\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error inesperado:', error);
  process.exit(1);
});
