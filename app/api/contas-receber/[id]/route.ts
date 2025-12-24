import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapContaReceberFromDb, mapContaReceberToDb, type DbContaReceber } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../../_utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const payload = mapContaReceberToDb(body);

    const { data, error } = await supabase
      .from(TABLES.contasReceber)
      .update(payload)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(mapContaReceberFromDb(data as DbContaReceber));
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLES.contasReceber).delete().eq('id', params.id);
    if (error) return jsonError(error.message, 500);
    return jsonOk({ id: params.id });
  } catch (e: any) {
    return jsonError(e?.message ?? 'Erro inesperado', 500);
  }
}


