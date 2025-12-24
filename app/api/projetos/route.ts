import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/db/tables';
import { mapProjetoFromDb, mapProjetoToDb, type DbProjeto } from '@/lib/db/mappers';
import { jsonError, jsonOk } from '../_utils';

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLES.projetos)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return jsonError(error.message, 500);
  return jsonOk((data as DbProjeto[]).map(mapProjetoFromDb));
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  const payload = mapProjetoToDb(body);
  const { data, error } = await supabase
    .from(TABLES.projetos)
    .insert(payload)
    .select('*')
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonOk(mapProjetoFromDb(data as DbProjeto), { status: 201 });
}


