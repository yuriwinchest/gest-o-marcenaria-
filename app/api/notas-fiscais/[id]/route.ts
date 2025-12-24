import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapNotaFiscalFromDb, mapNotaFiscalToDb, type DbNotaFiscal } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../../_utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const payload = mapNotaFiscalToDb(body);

  const { data, error } = await supabase
    .from(TABLES.notasFiscais)
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(mapNotaFiscalFromDb(data as DbNotaFiscal));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(TABLES.notasFiscais).delete().eq('id', params.id);
  if (error) return jsonError(error.message, 500);
  return jsonOk({ id: params.id });
}


