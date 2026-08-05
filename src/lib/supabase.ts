import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from environment variables
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Check if valid credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  supabaseUrl !== 'https://xyzcompany.supabase.co'
);

// Lazy or safe creation of Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to fetch bills from Supabase with fallback to local bills
 */
export async function fetchUserBills(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('electricity_bills')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    if (error) {
      console.warn('Supabase fetchUserBills warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase fetch failed:', err);
    return null;
  }
}

/**
 * Helper to insert or save a new bill into Supabase
 */
export async function saveBillToSupabase(bill: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('electricity_bills')
      .insert([
        {
          id: bill.id,
          user_id: bill.userId || 'usr_demo_101',
          bill_number: bill.billNumber,
          consumer_name: bill.consumerName,
          billing_month: bill.billingMonth,
          issue_date: bill.issueDate,
          due_date: bill.dueDate,
          units_consumed_kwh: bill.unitsConsumedKwh,
          sanctioned_load_kw: bill.sanctionedLoadKw,
          power_factor: bill.powerFactor,
          tariff_category: bill.tariffCategory,
          amount_due: bill.amountDue,
          breakdown: bill.breakdown,
          status: bill.status || 'paid',
          ocr_confidence: bill.ocrConfidence || 0.98,
          file_name: bill.fileName || 'Uploaded_Document.pdf',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase saveBillToSupabase warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase save failed:', err);
    return null;
  }
}
