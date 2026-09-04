"use client"

import { useState } from "react";

export default function DemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const stats = [
    { label: "Total Reports", value: "1,284", change: "+12.5%" },
    { label: "Active Incidents", value: "24", change: "-4.2%" },
    { label: "Resolved", value: "1,102", change: "+18.1%" },
    { label: "Pending", value: "158", change: "+3.4%" },
  ];

  const incidents = [
    {
      id: "INC-1024",
      title: "Road Flooding",
      location: "Gachibowli",
      status: "Active",
      priority: "High",
    },
    {
      id: "INC-1023",
      title: "Power Outage",
      location: "Kukatpally",
      status: "Pending",
      priority: "Medium",
    },
    {
      id: "INC-1022",
      title: "Water Pipeline Leak",
      location: "Madhapur",
      status: "Resolved",
      priority: "Low",
    },
    {
      id: "INC-1021",
      title: "Traffic Signal Failure",
      location: "Hitech City",
      status: "Active",
      priority: "High",
    },
  ];

  const filteredIncidents = incidents.filter((incident) =>
    `${incident.title} ${incident.location} ${incident.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Disaster Management Dashboard
            </p>
            <h1 className="mt-1 text-3xl font-bold">Demo UI</h1>
            <p className="mt-1 text-gray-500">
              Component testing and frontend development page
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            + Create Report
          </button>
        </header>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-3xl font-bold">{stat.value}</p>
                <span className="text-sm font-medium text-green-600">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Controls */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent Incidents</h2>
              <p className="text-sm text-gray-500">
                Test search, filtering and table components
              </p>
            </div>

            <div className="flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incidents..."
                className="rounded-lg border px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <button className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50">
                Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Incident</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium">{incident.id}</td>
                    <td className="px-4 py-4">{incident.title}</td>
                    <td className="px-4 py-4 text-gray-500">
                      {incident.location}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          incident.status === "Active"
                            ? "bg-red-100 text-red-700"
                            : incident.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button className="font-medium text-blue-600 hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredIncidents.length === 0 && (
              <div className="py-10 text-center text-gray-500">
                No incidents found.
              </div>
            )}
          </div>
        </section>

        {/* Component testing section */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Form Components</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Incident Title
                </label>
                <input
                  type="text"
                  placeholder="Enter incident title"
                  className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the incident..."
                  className="w-full rounded-lg border px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select className="w-full rounded-lg border px-4 py-2.5">
                  <option>Flood</option>
                  <option>Fire</option>
                  <option>Road Accident</option>
                  <option>Power Outage</option>
                  <option>Other</option>
                </select>
              </div>

              <button className="w-full rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-800">
                Submit
              </button>
            </div>
          </div>

          {/* Buttons / States */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">UI States</h2>

            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap gap-3">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
                  Primary
                </button>

                <button className="rounded-lg border px-4 py-2">
                  Secondary
                </button>

                <button className="rounded-lg bg-red-600 px-4 py-2 text-white">
                  Danger
                </button>

                <button disabled className="rounded-lg bg-gray-200 px-4 py-2 text-gray-400">
                  Disabled
                </button>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                ⚠️ Warning: This is a test notification.
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                ✓ Operation completed successfully.
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                ✕ Something went wrong. Please try again.
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Report</h2>

              <button
                onClick={() => setModalOpen(false)}
                className="text-xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              This modal is included for testing dialogs and overlays.
            </p>

            <div className="mt-5 space-y-4">
              <input
                placeholder="Report title"
                className="w-full rounded-lg border px-4 py-2.5"
              />

              <input
                placeholder="Location"
                className="w-full rounded-lg border px-4 py-2.5"
              />

              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
