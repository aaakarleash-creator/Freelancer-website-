import fs from 'fs';
import vm from 'vm';

// Load services.js by reading and evaluating in a VM after stripping ESM exports
const servicesPath = './src/data/services.js';
const raw = fs.readFileSync(servicesPath, 'utf8');
const transformed = raw.replace(/export\s+const\s+/g, 'const ');
const script = new vm.Script(`${transformed}\n; typeof SERVICES !== 'undefined' ? SERVICES : null;`);
const context = vm.createContext({});
const SERVICES = script.runInContext(context);

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://udufxyzdpjczqlozkero.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWZ4eXpkcGpjenFsb3prZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTYwNDcsImV4cCI6MjA5NDA5MjA0N30.Q4oDNa8TXdGBFNL-xvoQVD6nBdb3FhWWtRaFddRZvqg';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || null;

async function sync() {
  console.log('Preparing to sync', SERVICES.length, 'services to Supabase (REST)...');

  // Map to only the columns that exist in the current Supabase 'services' table
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const rows = SERVICES.map((s) => {
    const highlightedPlan = s.plans && s.plans.length > 0 
      ? s.plans.find(p => p.highlighted) || s.plans[0] 
      : null;
    
    return {
      ...(s.id && uuidRegex.test(s.id) ? { id: s.id } : {}),
      name: s.name,
      description: s.shortDesc || s.short_desc || s.description || null,
      detailed_description: s.detailed_description || s.detailedDescription || null,
      category: s.category || 'General',
      price_inr: s.priceInr || (highlightedPlan && highlightedPlan.priceInr) || null,
      price_usd: s.priceUsd || (highlightedPlan && highlightedPlan.priceUsd) || null,
      features: s.features || null,
      delivery_time: s.delivery_time || s.deliveryTime || null,
      created_at: new Date().toISOString(),
    };
  });

  try {
    // Use on_conflict=id to merge duplicates on the `id` column
    const keyToUse = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    if (!SUPABASE_SERVICE_ROLE_KEY) console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not provided — RLS may prevent inserts. Provide a service role key via SUPABASE_SERVICE_ROLE_KEY env var to bypass RLS.');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/services?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(rows),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Supabase REST error:', res.status, result);
      process.exitCode = 2;
      return;
    }

    console.log('Upsert completed via REST. Records upserted:', Array.isArray(result) ? result.length : '(unknown)');
    if (Array.isArray(result)) console.log(result.map(r => ({ id: r.id, name: r.name })));
  } catch (err) {
    console.error('Sync failed:', err);
    process.exitCode = 3;
  }
}

sync();
