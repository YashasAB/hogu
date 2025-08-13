
import React from 'react';

type SlotStatus = "available" | "cutoff" | "full";

type Slot = {
  id: string;
  date: string;
  time: string;
  capacity: number;
  status: SlotStatus;
  bookingId?: string | null;
};

interface SlotManagementProps {
  date: string;
  slots: Slot[];
  loading: boolean;
  onDateChange: (date: string) => void;
  onSlotStatusChange: (slotId: string, status: SlotStatus) => void;
  onAddSlots: (data: {
    date: string;
    start: string;
    end: string;
    interval: number;
    capacity: number;
  }) => void;
}

export const SlotManagement: React.FC<SlotManagementProps> = ({
  date,
  slots,
  loading,
  onDateChange,
  onSlotStatusChange,
  onAddSlots
}) => {
  const [start, setStart] = React.useState("18:00");
  const [end, setEnd] = React.useState("22:00");
  const [interval, setInterval] = React.useState(30);
  const [capacity, setCapacity] = React.useState(4);

  const getStatusColor = (status: SlotStatus) => {
    switch (status) {
      case "available":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "cutoff":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "full":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const handleAddSlots = () => {
    onAddSlots({ date, start, end, interval, capacity });
  };

  return (
    <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
      <h2 className="text-lg sm:text-xl font-semibold mb-6">Slot Management</h2>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Add Slots Form */}
      <div className="mb-6 p-4 bg-slate-800 rounded-xl">
        <h3 className="text-md font-medium text-slate-200 mb-4">Add New Slots</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Time</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Time</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Interval (min)</label>
            <input
              type="number"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-200 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleAddSlots}
          className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm"
        >
          Add Slots
        </button>
      </div>

      {/* Slots Grid */}
      <div>
        <h3 className="text-md font-medium text-slate-200 mb-4">
          Slots for {new Date(date).toLocaleDateString()}
        </h3>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🕐</span>
            </div>
            <p className="text-slate-400">No slots found for this date</p>
            <p className="text-slate-500 text-sm">Use the form above to add new slots</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`border rounded-lg p-3 transition-colors ${getStatusColor(slot.status)}`}
              >
                <div className="text-sm font-medium">{slot.time}</div>
                <div className="text-xs opacity-75">Cap: {slot.capacity}</div>
                <div className="mt-2">
                  <select
                    value={slot.status}
                    onChange={(e) => onSlotStatusChange(slot.id, e.target.value as SlotStatus)}
                    className="w-full bg-slate-700 border border-slate-600 rounded text-xs px-1 py-1"
                  >
                    <option value="available">Available</option>
                    <option value="cutoff">Cutoff</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
