import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const STORAGE_KEY = "daily-tracker:v1";

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultTemplate() {
  return {
    morning: [
      { id: "m1", title: "Wake & Hydrate", done: false },
      { id: "m2", title: "Stretch / Walk 20m", done: false },
      { id: "m3", title: "Shower & Get Ready", done: false }
    ],
    dailyGoals: [
      { id: "g1", title: "Top 1 priority", done: false },
      { id: "g2", title: "Coding / Learning 1 hour", done: false }
    ],
    nutrition: [
      { id: "n1", title: "Breakfast", notes: "" },
      { id: "n2", title: "Lunch", notes: "" }
    ],
    notes: ""
  };
}

export default function App() {
  const [store, setStore] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? JSON.parse(raw)
        : {
            data: {},
            template: defaultTemplate(),
            streak: { lastDate: null, days: 0 }
          };
    } catch (e) {
      return {
        data: {},
        template: defaultTemplate(),
        streak: { lastDate: null, days: 0 }
      };
    }
  });

  const todayKey = getTodayKey();
  const today = store.data[todayKey] ?? JSON.parse(JSON.stringify(store.template));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  function toggleItem(section, id) {
    const updated = JSON.parse(JSON.stringify(store));
    const entry =
      updated.data[todayKey] ||
      (updated.data[todayKey] = JSON.parse(JSON.stringify(updated.template)));

    const target = entry[section].find((x) => x.id === id);
    if (!target) return;

    target.done = !target.done;

    const allDone =
      entry.morning.every((i) => i.done) &&
      entry.dailyGoals.every((i) => i.done);

    if (allDone) {
      const prev = updated.streak || { lastDate: null, days: 0 };
      const todayISO = todayKey;

      if (prev.lastDate !== todayISO) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const ys = getTodayKey(yesterday);

        if (prev.lastDate === ys) prev.days = prev.days + 1;
        else prev.days = 1;

        prev.lastDate = todayISO;
      }
      updated.streak = prev;
    }

    setStore(updated);
  }

  function editItem(section, id, patch) {
    const updated = JSON.parse(JSON.stringify(store));
    const entry =
      updated.data[todayKey] ||
      (updated.data[todayKey] = JSON.parse(JSON.stringify(updated.template)));

    const ref = entry[section].find((x) => x.id === id);
    Object.assign(ref, patch);
    setStore(updated);
  }

  function addItem(section, title) {
    if (!title) return;

    const updated = JSON.parse(JSON.stringify(store));
    const entry =
      updated.data[todayKey] ||
      (updated.data[todayKey] = JSON.parse(JSON.stringify(updated.template)));

    entry[section].push({
      id: `${section}_${Date.now()}`,
      title,
      done: false
    });

    setStore(updated);
  }

  function resetToday() {
    const updated = JSON.parse(JSON.stringify(store));
    updated.data[todayKey] = JSON.parse(JSON.stringify(updated.template));
    setStore(updated);
  }

  function clearAll() {
    if (!confirm("Clear all stored data? This cannot be undone.")) return;

    const updated = {
      data: {},
      template: store.template,
      streak: { lastDate: null, days: 0 }
    };
    setStore(updated);
  }

  function exportJSON() {
    const payload = JSON.stringify(store, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "daily-tracker-export.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const keys = Object.keys(store.data).sort().slice(-14);
    let rows = [["date", "morning_done_count", "goals_done_count", "notes"]];

    keys.forEach((k) => {
      const d = store.data[k];
      const m = d.morning.filter((x) => x.done).length;
      const g = d.dailyGoals.filter((x) => x.done).length;

      rows.push([k, m, g, (d.notes || "").replace(/\n/g, " ")]);
    });

    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "daily-tracker.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const merged = { ...store, ...parsed };
        setStore(merged);
      } catch (err) {
        alert("Invalid JSON");
      }
    };

    reader.readAsText(file);
  }

  const chartData = useMemo(() => {
    const keys = Object.keys(store.data).sort();
    const last7 = keys.slice(-7);

    return last7.map((k) => {
      const d = store.data[k];
      const total =
        (d.morning?.length || 0) + (d.dailyGoals?.length || 0);
      const done =
        (d.morning?.filter((x) => x.done).length || 0) +
        (d.dailyGoals?.filter((x) => x.done).length || 0);

      const pct = total ? Math.round((done / total) * 100) : 0;

      return { date: k, percent: pct };
    });
  }, [store]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Daily Routine Tracker
          </h1>

          <div className="text-right">
            <div className="text-sm text-slate-600">Today • {todayKey}</div>
            <div className="mt-1 text-xs text-slate-500">
              Streak: {store.streak?.days || 0} days
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT SECTION */}
          <section className="col-span-2 bg-white p-4 rounded-2xl shadow-sm">
            {/* Morning */}
            <h2 className="font-semibold mb-2">Morning Routine</h2>

            <ul className="space-y-2">
              {(today.morning || []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.done || false}
                      onChange={() => toggleItem("morning", item.id)}
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          item.done ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {item.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="text-sm text-slate-500"
                      onClick={() => {
                        const t = prompt("Edit title", item.title);
                        if (t !== null) editItem("morning", item.id, { title: t });
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="text-sm text-red-500"
                      onClick={() => {
                        if (confirm("Remove item?")) {
                          const updated = JSON.parse(JSON.stringify(store));
                          updated.data[todayKey] =
                            updated.data[todayKey] ||
                            JSON.parse(JSON.stringify(updated.template));
                          updated.data[todayKey].morning =
                            updated.data[todayKey].morning.filter(
                              (x) => x.id !== item.id
                            );
                          setStore(updated);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* New Morning Task Input */}
            <div className="mt-3 flex gap-2">
              <input
                id="newMorning"
                placeholder="Add new morning item"
                className="flex-1 p-2 rounded-lg border"
              />
              <button
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white"
                onClick={() => {
                  const el = document.getElementById("newMorning");
                  if (!el) return;
                  const val = el.value.trim();
                  if (!val) return;
                  addItem("morning", val);
                  el.value = "";
                }}
              >
                Add
              </button>
            </div>

            <hr className="my-4" />

            {/* Goals */}
            <h2 className="font-semibold mb-2">Daily Goals</h2>

            <ul className="space-y-2">
              {(today.dailyGoals || []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.done || false}
                      onChange={() => toggleItem("dailyGoals", item.id)}
                    />
                    <div>
                      <div
                        className={`font-medium ${
                          item.done ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {item.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="text-sm text-slate-500"
                      onClick={() => {
                        const t = prompt("Edit title", item.title);
                        if (t !== null) editItem("dailyGoals", item.id, {
                          title: t
                        });
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="text-sm text-red-500"
                      onClick={() => {
                        if (confirm("Remove item?")) {
                          const updated = JSON.parse(JSON.stringify(store));
                          updated.data[todayKey] =
                            updated.data[todayKey] ||
                            JSON.parse(JSON.stringify(updated.template));
                          updated.data[todayKey].dailyGoals =
                            updated.data[todayKey].dailyGoals.filter(
                              (x) => x.id !== item.id
                            );
                          setStore(updated);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add Goal */}
            <div className="mt-3 flex gap-2">
              <input
                id="newGoal"
                placeholder="Add new goal"
                className="flex-1 p-2 rounded-lg border"
              />
              <button
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white"
                onClick={() => {
                  const el = document.getElementById("newGoal");
                  if (!el) return;
                  const val = el.value.trim();
                  if (!val) return;
                  addItem("dailyGoals", val);
                  el.value = "";
                }}
              >
                Add
              </button>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <h3 className="font-semibold">Notes</h3>

              <textarea
                value={today.notes || ""}
                onChange={(e) => {
                  const updated = JSON.parse(JSON.stringify(store));
                  (updated.data[todayKey] ||
                    (updated.data[todayKey] = JSON.parse(
                      JSON.stringify(updated.template)
                    ))).notes = e.target.value;
                  setStore(updated);
                }}
                className="w-full p-2 rounded-lg border mt-2"
                rows={4}
              />
            </div>
          </section>

          {/* RIGHT SECTION */}
          <aside className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="font-semibold">Quick Actions</h3>

            <div className="mt-3 grid gap-2">
              <button className="w-full p-2 rounded-lg border" onClick={resetToday}>
                Reset Today
              </button>

              <button
                className="w-full p-2 rounded-lg border"
                onClick={() => {
                  if (confirm("Mark everything done?")) {
                    const updated = JSON.parse(JSON.stringify(store));
                    updated.data[todayKey] =
                      updated.data[todayKey] ||
                      JSON.parse(JSON.stringify(updated.template));

                    updated.data[todayKey].morning.forEach((i) => (i.done = true));
                    updated.data[todayKey].dailyGoals.forEach((i) => (i.done = true));

                    updated.streak = updated.streak || {
                      lastDate: null,
                      days: 0
                    };
                    updated.streak.lastDate = todayKey;
                    updated.streak.days = (updated.streak.days || 0) + 1;

                    setStore(updated);
                  }
                }}
              >
                Mark All Done
              </button>

              <button className="w-full p-2 rounded-lg border" onClick={exportJSON}>
                Export JSON
              </button>

              <button className="w-full p-2 rounded-lg border" onClick={exportCSV}>
                Export CSV
              </button>

              <label className="w-full p-2 rounded-lg border text-center cursor-pointer">
                Import JSON
                <input
                  type="file"
                  className="hidden"
                  accept="application/json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0])
                      importJSON(e.target.files[0]);
                  }}
                />
              </label>

              <button
                className="w-full p-2 rounded-lg border text-red-600"
                onClick={clearAll}
              >
                Clear All Data
              </button>
            </div>

            {/* Weekly Chart */}
            <div className="mt-4">
              <h4 className="font-semibold">Weekly Progress</h4>

              <div style={{ height: 200 }} className="mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="percent"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              <div>Days logged: {Object.keys(store.data).length}</div>
              <div className="mt-2">
                Template items: Morning {store.template.morning.length}, Goals{" "}
                {store.template.dailyGoals.length}
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-center text-sm text-slate-500">
          Built with ❤️ — edit it on GitHub and deploy to GitHub Pages or Vercel.
        </footer>
      </div>
    </div>
  );
}
