import { useState } from 'react'
import { useExpenseStore } from '../store/useExpenseStore'

export default function AddExpenseForm() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const addExpense = useExpenseStore(s => s.addExpense)

  const handleSubmit = (e) => {
    e.preventDefault()
    addExpense({ title, amount: parseFloat(amount), type, category: 'general' })
    setTitle('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-white rounded-xl shadow">
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Food" className="border p-2 rounded flex-1" />
      <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="5000" className="border p-2 rounded w-24" />
      <select value={type} onChange={e=>setType(e.target.value)} className="border p-2 rounded">
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <button className="bg-black text-white px-4 rounded">Add</button>
    </form>
  )
}