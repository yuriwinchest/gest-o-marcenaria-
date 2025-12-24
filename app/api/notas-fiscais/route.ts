import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapNotaFiscalFromDb, mapNotaFiscalToDb, type DbNotaFiscal } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLES.notasFiscais)
      .select('*')
      .order('data_emissao', { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonOk((data as DbNotaFiscal[]).map(mapNotaFiscalFromDb));
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const payload = mapNotaFiscalToDb(body);

    const { data, error } = await supabase.from(TABLES.notasFiscais).insert(payload).select('*').single();
    if (error) return jsonError(error.message, 500);

    return jsonOk(mapNotaFiscalFromDb(data as DbNotaFiscal), { status: 201 });
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}


