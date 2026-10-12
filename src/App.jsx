import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { auth, db, provider } from "./firebase"
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"

function App() {
  const [user, setUser] = useState(null)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [expenses, setExpenses] = useState([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  // CHECK LOGIN + LOAD DATA FROM CLOUD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid))
          if (snap.exists()) {
            setExpenses(snap.data().expenses || [])
          }
        } catch (e) {
          console.log("Firestore error", e)
        }
      } else {
        // if logged out, load from localStorage
        const saved = localStorage.getItem("my-expenses")
        setExpenses(saved? JSON.parse(saved) : [])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // SAVE TO BOTH localStorage AND CLOUD
  useEffect(() => {
    if (loading) return
    localStorage.setItem("my-expenses", JSON.stringify(expenses))
    if (user) {
      setDoc(doc(db, "users", user.uid), { expenses })
    }
  }, [expenses, user, loading])

  const handleLogin = async () => {
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      // if popup blocked, try redirect instead
      const { signInWithRedirect } = await import("firebase/auth")
      await signInWithRedirect(auth, provider)
    } else {
      alert("Login failed: " + err.message)
    }
  }
}

  const addItem = () => {
    if (!title ||!amount) return
    setExpenses([...expenses, { id: Date.now(), title, amount: Number(amount), type }])
    setTitle("")
    setAmount("")
  }

  const deleteItem = (id) => {
    setExpenses(expenses.filter((e) => e.id!== id))
  }

  const totalExpense = expenses.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0)
  const totalIncome = expenses.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0)
  const balance = totalIncome - totalExpense

  const filtered = expenses.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
  const chartData = expenses.filter((e) => e.type === "expense").map((e) => ({ name: e.title, value: e.amount }))

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-xl shadow text-center">
          <h1 className="text-2xl font-bold mb-2">Expense Tracker</h1>
          <p className="text-gray-500 mb-6">Login to sync across devices</p>
          <button onClick={handleLogin} className="bg-black text-white px-6 py-3 rounded-lg font-bold">
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
        <p className="font-bold">Hi, {user.displayName}</p>
        <button onClick={() => signOut(auth)} className="text-sm bg-white border px-3 py-1 rounded">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
        <div className="bg-black text-white p-5 rounded-xl">
          <p className="text-sm opacity-70">Balance</p>
          <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
        </div>
        <div className="bg-green-600 text-white p-5 rounded-xl">
          <p className="text-sm opacity-80">Income</p>
          <p className="text-2xl font-bold">₦{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-600 text-white p-5 rounded-xl">
          <p className="text-sm opacity-80">Spent</p>
          <p className="text-2xl font-bold">₦{totalExpense.toLocaleString()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title e.g Food" className="w-full border p-3 rounded mb-3" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount e.g 5000" type="number" className="w-full border p-3 rounded mb-3" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border p-3 rounded mb-4">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button onClick={addItem} className="w-full bg-black text-white p-3 rounded font-bold">
            Add {type}
          </button>

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full border p-2 rounded mt-6 mb-3 text-sm" />

          <div className="space-y-2 max-h-[300px] overflow-auto">
            {filtered.map((item) => (
              <div key={item.id} className="flex justify-between bg-gray-50 p-3 rounded border">
                <span>
                  {item.title} <span className={item.type === "income"? "text-green-600" : "text-red-600"}>({item.type})</span>
                </span>
                <span className="flex gap-3 items-center">
                  <span className="font-bold">₦{item.amount}</span>
                  <button onClick={() => deleteItem(item.id)} className="text-red-500 text-xs">
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow h-[400px]">
          <h2 className="font-bold mb-4">Spending Chart</h2>
          {chartData.length === 0? (
            <p className="text-gray-400">Add expenses to see chart</p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={["#000", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b"][i % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default App