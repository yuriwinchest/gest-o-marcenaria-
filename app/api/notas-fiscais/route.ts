import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapNotaFiscalFromDb, mapNotaFiscalToDb, type DbNotaFiscal } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.notasFiscais)
    .select('*')
    .order('data_emissao', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk((data as DbNotaFiscal[]).map(mapNotaFiscalFromDb));
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const payload = mapNotaFiscalToDb(body);

  const { data, error } = await supabase.from(TABLES.notasFiscais).insert(payload).select('*').single();
  if (error) return jsonError(error.message, 500);

  return jsonOk(mapNotaFiscalFromDb(data as DbNotaFiscal), { status: 201 });
}


