import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// ---------------------
// 🔧 Helpers
// ---------------------
const todayKey = new Date().toISOString().slice(0, 10);

const loadStore = () => {
  try {
    const saved = localStorage.getItem("routine-store");
    return saved
      ? JSON.parse(saved)
      : {
          entries: {},
          streak: {
            days: 0,
            lastCompletedDay: null,
          },
        };
  } catch {
    return {
      entries: {},
      streak: { days: 0, lastCompletedDay: null },
    };
  }
};

export default function App() {
  const [store, setStore] = useState(loadStore());

  const todayEntry = store.entries[todayKey] || {
    morning: [
      { id: 1, text: "Wake & Hydrate", done: false },
      { id: 2, text: "Stretch / Walk 20m", done: false },
      { id: 3, text: "Shower & Get Ready", done: false },
    ],
    dailyGoals: [
      { id: 4, text: "Top 1 priority", done: false },
      { id: 5, text: "Coding / Learning 1 hour", done: false },
    ],
    notes: "",
  };

  // ------------------------
  // 🔧 Save to localStorage
  // ------------------------
  const updateStore = (updates) => {
    const updated = { ...store, ...updates };
    setStore(updated);
    localStorage.setItem("routine-store", JSON.stringify(updated));
  };

  const updateEntry = (field, value) => {
    const updated = {
      ...store.entries,
      [todayKey]: { ...todayEntry, [field]: value },
    };
    updateStore({ entries: updated });
  };

  // ------------------------
  // 🔥 STREAK FIXED LOGIC
  // ------------------------
  useEffect(() => {
    const entry = todayEntry;

    const allDone =
      entry.morning.every((i) => i.done) &&
      entry.dailyGoals.every((i) => i.done);

    if (allDone && store.streak.lastCompletedDay !== todayKey) {
      const yesterdayKey = new Date(
        Date.now() - 86400000
      )
        .toISOString()
        .slice(0, 10);

      const continueStreak =
        store.streak.lastCompletedDay === yesterdayKey;

      const newStreak = {
        days: continueStreak ? store.streak.days + 1 : 1,
        lastCompletedDay: todayKey,
      };

      updateStore({ streak: newStreak });
    }
  }, [
    todayEntry.morning,
    todayEntry.dailyGoals,
  ]);

  // ------------------------
  // UI Components
  // ------------------------
  const toggleItem = (section, id) => {
    const updated = todayEntry[section].map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    updateEntry(section, updated);
  };

  const addItem = (section, text) => {
    if (!text.trim()) return;
    const updated = [
      ...todayEntry[section],
      { id: Date.now(), text, done: false },
    ];
    updateEntry(section, updated);
  };

  const deleteItem = (section, id) => {
    const updated = todayEntry[section].filter(
      (i) => i.id !== id
    );
    updateEntry(section, updated);
  };

  const editItem = (section, id, text) => {
    const updated = todayEntry[section].map((i) =>
      i.id === id ? { ...i, text } : i
    );
    updateEntry(section, updated);
  };

  const resetToday = () => {
    updateEntry(
      "morning",
      todayEntry.morning.map((i) => ({ ...i, done: false }))
    );
    updateEntry(
      "dailyGoals",
      todayEntry.dailyGoals.map((i) => ({
        ...i,
        done: false,
      }))
    );
  };

  // ------------------------
  // Weekly Progress Chart
  // ------------------------
  const weeklyData = Object.keys(store.entries)
    .slice(-7)
    .map((date) => {
      const e = store.entries[date];
      const doneCount =
        e.morning.filter((i) => i.done).length +
        e.dailyGoals.filter((i) => i.done).length;
      const totalCount =
        e.morning.length + e.dailyGoals.length;
      return {
        date: date.slice(5),
        percent: Math.round(
          (doneCount / totalCount) * 100
        ),
      };
    });

  // ------------------------
  // JSX UI START
  // ------------------------
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-10">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Daily Routine Tracker
        </h1>

        <div className="text-right">
          <div className="text-sm text-slate-600">
            Today • {todayKey}
          </div>

          {/* 🔥 FIXED STREAK DISPLAY */}
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            {store.streak.days > 0 && (
              <span style={{ fontSize: "18px" }}>
                🔥
              </span>
            )}
            <span>
              Streak: {store.streak.days} days
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT – Main Inputs */}
        <div className="md:col-span-2 space-y-6">

          {/* Morning Routine */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-3">
              Morning Routine
            </h2>

            {todayEntry.morning.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      toggleItem("morning", item.id)
                    }
                  />
                  <span
                    className={
                      item.done
                        ? "line-through text-slate-400"
                        : ""
                    }
                  >
                    {item.text}
                  </span>
                </div>

                <div className="text-xs">
                  <button
                    onClick={() => {
                      const t = prompt(
                        "Edit item:",
                        item.text
                      );
                      if (t) editItem("morning", item.id, t);
                    }}
                    className="text-slate-500 mr-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteItem("morning", item.id)
                    }
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <AddItemInput
              onAdd={(t) => addItem("morning", t)}
            />
          </section>

          {/* Daily Goals */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-3">
              Daily Goals
            </h2>

            {todayEntry.dailyGoals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      toggleItem("dailyGoals", item.id)
                    }
                  />
                  <span
                    className={
                      item.done
                        ? "line-through text-slate-400"
                        : ""
                    }
                  >
                    {item.text}
                  </span>
                </div>

                <div className="text-xs">
                  <button
                    onClick={() => {
                      const t = prompt(
                        "Edit item:",
                        item.text
                      );
                      if (t)
                        editItem(
                          "dailyGoals",
                          item.id,
                          t
                        );
                    }}
                    className="text-slate-500 mr-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteItem(
                        "dailyGoals",
                        item.id
                      )
                    }
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <AddItemInput
              onAdd={(t) => addItem("dailyGoals", t)}
            />
          </section>

        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <section className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-3">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={resetToday}
                className="w-full py-2 bg-slate-100 rounded"
              >
                Reset Today
              </button>

              <button
                onClick={() => {
                  updateEntry(
                    "morning",
                    todayEntry.morning.map((i) => ({
                      ...i,
                      done: true,
                    }))
                  );
                  updateEntry(
                    "dailyGoals",
                    todayEntry.dailyGoals.map((i) => ({
                      ...i,
                      done: true,
                    }))
                  );
                }}
                className="w-full py-2 bg-slate-100 rounded"
              >
                Mark All Done
              </button>
            </div>
          </section>

          {/* Weekly Chart */}
          <section className="bg-white p-6 rounded-x
