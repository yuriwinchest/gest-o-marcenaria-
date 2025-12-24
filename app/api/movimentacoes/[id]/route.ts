import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapMovimentacaoFromDb, mapMovimentacaoToDb, type DbMovimentacao } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../../_utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const payload = mapMovimentacaoToDb(body);

  const { data, error } = await supabase
    .from(TABLES.movimentacoes)
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(mapMovimentacaoFromDb(data as DbMovimentacao));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(TABLES.movimentacoes).delete().eq('id', params.id);
  if (error) return jsonError(error.message, 500);
  return jsonOk({ id: params.id });
}


