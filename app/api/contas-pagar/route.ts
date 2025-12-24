import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapContaPagarFromDb, mapContaPagarToDb, type DbContaPagar } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.contasPagar)
    .select('*')
    .order('data_vencimento', { ascending: true });

  if (error) return jsonError(error.message, 500);
  return jsonOk((data as DbContaPagar[]).map(mapContaPagarFromDb));
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const payload = mapContaPagarToDb(body);

  const { data, error } = await supabase.from(TABLES.contasPagar).insert(payload).select('*').single();
  if (error) return jsonError(error.message, 500);

  return jsonOk(mapContaPagarFromDb(data as DbContaPagar), { status: 201 });
}


