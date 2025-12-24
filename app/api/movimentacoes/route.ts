import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapMovimentacaoFromDb, mapMovimentacaoToDb, type DbMovimentacao } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.movimentacoes)
    .select('*')
    .order('data', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk((data as DbMovimentacao[]).map(mapMovimentacaoFromDb));
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const payload = mapMovimentacaoToDb(body);

  const { data, error } = await supabase
    .from(TABLES.movimentacoes)
    .insert(payload)
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(mapMovimentacaoFromDb(data as DbMovimentacao), { status: 201 });
}


