import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapContaReceberFromDb, mapContaReceberToDb, type DbContaReceber } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLES.contasReceber)
      .select('*')
      .order('data_vencimento', { ascending: true });

    if (error) return jsonError(error.message, 500);
    return jsonOk((data as DbContaReceber[]).map(mapContaReceberFromDb));
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const payload = mapContaReceberToDb(body);

    const { data, error } = await supabase.from(TABLES.contasReceber).insert(payload).select('*').single();
    if (error) return jsonError(error.message, 500);

    return jsonOk(mapContaReceberFromDb(data as DbContaReceber), { status: 201 });
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}


