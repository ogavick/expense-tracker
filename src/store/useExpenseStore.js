import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useExpenseStore = create((set, get) => ({
  expenses: [], // empty list at start
  loading: true,

  // FUNCTION 1: Fetch data when app opens
  fetchExpenses: async () => {
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    set({ expenses: data || [], loading: false })
  },

  // FUNCTION 2: Add new expense with CONDITION
  addExpense: async (newExpense) => {
  // 1. Validate title and amount
  if (
    !newExpense.title?.trim() ||
    !Number.isFinite(Number(newExpense.amount)) ||
    Number(newExpense.amount) <= 0
  ) {
    alert('Please add a title and an amount greater than 0');
    return;
  }

  // 2. Get current transactions
  const expenses = get().expenses;

  // 3. Calculate income
  const income = expenses
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // 4. Calculate total expenses
  const totalExpenses = expenses
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // 5. Calculate available balance
  const balance = income - totalExpenses;
  const amount = Number(newExpense.amount);

  // 6. Prevent overspending
  if (
    newExpense.type === 'expense' &&
    amount > balance
  ) {
    alert(
      balance <= 0
        ? 'Your balance is zero or negative. Add income or correct your existing transactions before spending.'
        : `Insufficient balance! You only have ₦${balance.toLocaleString()} available.`
    );
    return;
  }

  // 7. Save to Supabase
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ ...newExpense, amount }])
    .select();

  if (error) {
    alert('Could not save transaction: ' + error.message);
    return;
  }

  // 8. Update local state
  if (data?.length) {
    set({
      expenses: [data[0], ...get().expenses],
    });
  }
},

  // FUNCTION 3: Delete
  deleteExpense: async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    set({ expenses: get().expenses.filter(e => e.id!== id) })
  },

  // FUNCTION 4: REAL-TIME — listen to bank
  subscribeToExpenses: () => {
    const channel = supabase
     .channel('expenses-changes')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
        console.log('Real-time update:', payload)
        // When someone adds expense from another phone, refetch
        get().fetchExpenses()
      })
     .subscribe()
    return channel
  }
}))