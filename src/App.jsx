
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { auth, db, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("expense-theme") === "dark";});
    
const [monthlyBudget, setMonthlyBudget] = useState(0);
const [budgetInput, setBudgetInput] = useState("");


  useEffect(() => {
    localStorage.setItem("expense-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // REUSABLE DARK MODE STYLES
  const panelClass = darkMode
    ? "bg-slate-900 text-slate-100 border border-slate-700"
    : "bg-white text-gray-900 border border-gray-200";

  const inputClass = darkMode
    ? "w-full bg-slate-800 text-white border border-slate-600 placeholder-slate-400 p-3 rounded mb-3"
    : "w-full bg-white text-gray-900 border border-gray-300 placeholder-gray-400 p-3 rounded mb-3";

  const mutedTextClass = darkMode ? "text-slate-400" : "text-gray-500";

  // LIVE DATE AND TIME
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // CHECK LOGIN + LOAD DATA FROM CLOUD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
         
if (snap.exists()) {
  const data = snap.data();

  setExpenses(data.expenses || []);

  const savedBudget = Number(data.monthlyBudget) || 0;
  setMonthlyBudget(savedBudget);
  setBudgetInput(savedBudget > 0 ? String(savedBudget) : "");
} else {
  setExpenses([]);
  setMonthlyBudget(0);
  setBudgetInput("");
}

        } catch (e) {
          console.log("Firestore error", e);
        }
      } else {
        const saved = localStorage.getItem("my-expenses");
        const savedBudget = Number(
  localStorage.getItem("my-monthly-budget")
) || 0;

setMonthlyBudget(savedBudget);
setBudgetInput(savedBudget > 0 ? String(savedBudget) : "");
        setExpenses(saved ? JSON.parse(saved) : []);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // SAVE TO BOTH localStorage AND CLOUD
  useEffect(() => {
    if (loading) return;

    localStorage.setItem("my-expenses", JSON.stringify(expenses));

    if (user) {
      setDoc(doc(db, "users", user.uid), { expenses });
    }
  }, [expenses, user, loading]);
  
useEffect(() => {
  if (loading) return;

  localStorage.setItem(
    "my-monthly-budget",
    String(monthlyBudget)
  );

  if (user) {
    setDoc(
      doc(db, "users", user.uid),
      { monthlyBudget },
      { merge: true }
    ).catch((error) => {
      console.error("Budget save error:", error);
    });
  }
}, [monthlyBudget, user, loading]);


  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === "auth/popup-blocked") {
        const { signInWithRedirect } = await import("firebase/auth");
        await signInWithRedirect(auth, provider);
      } else {
        alert("Login failed: " + err.message);
      }
    }
  };

  const addItem = () => {
    const numericAmount = Number(amount);

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Amount must be greater than ₦0.");
      return;
    }

    if (type === "expense" && numericAmount > balance) {
      alert(
        `Insufficient balance!\n\nYour available balance is ₦${balance.toLocaleString()}.\nYou cannot add an expense of ₦${numericAmount.toLocaleString()}.`
      );
      return;
    }

    setExpenses((prevExpenses) => [
      ...prevExpenses,
      {
        id: Date.now(),
        title: title.trim(),
        amount: numericAmount,
        type,
        date: new Date().toISOString(),
      },
    ]);

    setTitle("");
    setAmount("");
  };

  const deleteItem = (id) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((a, b) => a + b.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((a, b) => a + b.amount, 0);

  const balance = totalIncome - totalExpense;
  
const currentMonthExpenses = expenses
  .filter((e) => {
    if (e.type !== "expense" || !e.date) return false;

    const date = new Date(e.date);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === currentTime.getMonth() &&
      date.getFullYear() === currentTime.getFullYear()
    );
  })
  .reduce((total, e) => total + Number(e.amount || 0), 0);

const budgetRemaining = monthlyBudget - currentMonthExpenses;

const budgetPercentage =
  monthlyBudget > 0
    ? (currentMonthExpenses / monthlyBudget) * 100
    : 0;

const progressPercentage = Math.min(budgetPercentage, 100);

const saveBudget = (e) => {
  e.preventDefault();

  const value = Number(budgetInput);

  if (!budgetInput.trim() || !Number.isFinite(value) || value <= 0) {
    alert("Enter a monthly budget greater than ₦0.");
    return;
  }

  setMonthlyBudget(value);
};


  const filtered = expenses.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = expenses
    .filter((e) => e.type === "expense")
    .map((e) => ({ name: e.title, value: e.amount }));

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div
          className={`p-10 rounded-xl shadow text-center ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}
        >
          <h1 className="text-2xl font-bold mb-2">Expense Tracker</h1>

          <p className={`${mutedTextClass} mb-6`}>
            Login to sync across devices
          </p>

          <button
            onClick={handleLogin}
            className="bg-black text-white px-6 py-3 rounded-lg font-bold"
          >
            Sign in with Google
          </button>

          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`block mx-auto mt-4 px-4 py-2 rounded-lg border ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-white"
                : "bg-white border-gray-200 text-gray-900"
            }`}
          >
            {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 transition-colors ${
        darkMode
          ? "bg-slate-950 text-slate-100"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <p className="font-bold">Hi, {user.displayName || "User"}</p>

          <p className={`text-sm ${mutedTextClass} mt-1`}>
            {currentTime.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          <p className="text-lg font-semibold mt-1">
            {currentTime.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => signOut(auth)}
            className={`text-sm px-4 py-2 rounded-lg border ${
              darkMode
                ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Logout
          </button>

          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800"
                : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
            }`}
          >
            {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
        <div className="bg-blue-600 text-white p-4 sm:p-5 rounded-xl min-w-0">
          <p className="text-sm opacity-70">Balance</p>
          <p className="text-xl sm:text-2xl font-bold break-words">
            ₦{balance.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-700 text-white p-4 sm:p-5 rounded-xl min-w-0">
          <p className="text-sm opacity-80">Income</p>
          <p className="text-xl sm:text-2xl font-bold break-words">
            ₦{totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-orange-600 text-white p-4 sm:p-5 rounded-xl min-w-0">
          <p className="text-sm opacity-80">Spent</p>
          <p className="text-xl sm:text-2xl font-bold break-words">
            ₦{totalExpense.toLocaleString()}
          </p>
        </div>
      </div>
      
{/* MONTHLY BUDGET */}
<section
  className={`max-w-4xl mx-auto mb-6 p-5 rounded-xl shadow ${
    darkMode
      ? "bg-slate-900 text-slate-100 border border-slate-700"
      : "bg-white text-gray-900 border border-gray-200"
  }`}
>
  <h2 className="text-xl font-bold mb-1">Monthly Budget</h2>

  <p className={`text-sm mb-4 ${mutedTextClass}`}>
    {currentTime.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    })} spending limit
  </p>

  <form
    onSubmit={saveBudget}
    className="flex flex-col sm:flex-row gap-3 mb-5"
  >
    <input
      type="number"
      min="1"
      step="any"
      value={budgetInput}
      onChange={(e) => setBudgetInput(e.target.value)}
      placeholder="Enter monthly budget (₦)"
      className={`flex-1 min-w-0 p-3 rounded border ${
        darkMode
          ? "bg-slate-800 text-white border-slate-600"
          : "bg-white text-gray-900 border-gray-300"
      }`}
    />

    <button
      type="submit"
      className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold"
    >
      Save Budget
    </button>
  </form>

  {monthlyBudget > 0 ? (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className={`text-sm ${mutedTextClass}`}>Budget limit</p>
          <p className="font-bold">
            ₦{monthlyBudget.toLocaleString()}
          </p>
        </div>

        <div>
          <p className={`text-sm ${mutedTextClass}`}>Spent this month</p>
          <p className="font-bold">
            ₦{currentMonthExpenses.toLocaleString()}
          </p>
        </div>

        <div>
          <p className={`text-sm ${mutedTextClass}`}>
            {budgetRemaining < 0 ? "Over budget" : "Remaining"}
          </p>
          <p className={`font-bold ${
            budgetRemaining < 0 ? "text-red-500" : "text-green-500"
          }`}>
            ₦{Math.abs(budgetRemaining).toLocaleString()}
          </p>
        </div>
      </div>

      <div className={`h-3 rounded-full overflow-hidden ${
        darkMode ? "bg-slate-700" : "bg-gray-200"
      }`}>
        <div
          className={`h-full transition-all ${
            budgetPercentage >= 100
              ? "bg-red-500"
              : budgetPercentage >= 80
                ? "bg-orange-500"
                : "bg-green-500"
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <p className={`text-sm mt-2 ${
        budgetPercentage >= 100
          ? "text-red-500"
          : budgetPercentage >= 80
            ? "text-orange-500"
            : mutedTextClass
      }`}>
        {budgetPercentage >= 100
          ? "You have reached or exceeded your budget."
          : budgetPercentage >= 80
            ? `Warning: ${budgetPercentage.toFixed(1)}% of your budget used.`
            : `${budgetPercentage.toFixed(1)}% of your budget used.`}
      </p>
    </>
  ) : (
    <p className={`text-sm ${mutedTextClass}`}>
      Set a budget to monitor your monthly spending.
    </p>
  )}
</section>


      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={`p-6 rounded-xl shadow ${panelClass}`}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title e.g Food"
            className={inputClass}
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount e.g 5000"
            type="number"
            className={inputClass}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`w-full p-3 rounded mb-4 border ${
              darkMode
                ? "bg-slate-800 text-white border-slate-600"
                : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button
            onClick={addItem}
            className={`w-full p-3 rounded font-bold ${
              darkMode
                ? "bg-slate-100 text-slate-900 hover:bg-white"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Add {type}
          </button>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={`w-full border p-2 rounded mt-6 mb-3 text-sm ${
              darkMode
                ? "bg-slate-800 text-white border-slate-600 placeholder-slate-400"
                : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
            }`}
          />

          <div className="space-y-2 max-h-[300px] overflow-auto">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`flex justify-between gap-3 p-3 rounded border ${
                  darkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">
                    {item.title}{" "}
                    <span
                      className={
                        item.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      ({item.type})
                    </span>
                  </p>

                  <p className={`text-xs ${mutedTextClass} mt-1`}>
                    {item.date
                      ? new Date(item.date).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Date unavailable"}
                  </p>
                </div>

                <span className="flex gap-3 items-center">
                  <span className="font-bold">
                    ₦{item.amount.toLocaleString()}
                  </span>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 text-xs"
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-xl shadow h-[400px] ${panelClass}`}>
          <h2 className="font-bold mb-4">Spending Chart</h2>

          {chartData.length === 0 ? (
            <p className={mutedTextClass}>
              Add expenses to see chart
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ["#000", "#ef4444", "#22c55e", "#3b82f6", "#f59e0b"][
                          i % 5
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                    color: darkMode ? "#f1f5f9" : "#111827",
                    border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
                    borderRadius: "8px",
                  }}
                  labelStyle={{
                    color: darkMode ? "#f1f5f9" : "#111827",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
