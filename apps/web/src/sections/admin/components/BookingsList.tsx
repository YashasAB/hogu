
import React from 'react';

type BookingStatus = "PENDING" | "HELD" | "CONFIRMED" | "CANCELLED" | "SEATED" | "COMPLETED";

type Booking = {
  id: string;
  slotId: string;
  partySize: number;
  status: BookingStatus;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  slot: {
    date: string;
    time: string;
    partySize: number;
  };
};

interface BookingsListProps {
  bookings: Booking[];
  loading: boolean;
  onStatusChange: (bookingId: string, status: BookingStatus) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  loading,
  onStatusChange
}) => {
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
      case "HELD":
        return "bg-amber-500/20 text-amber-300";
      case "CONFIRMED":
        return "bg-green-500/20 text-green-300";
      case "SEATED":
        return "bg-blue-500/20 text-blue-300";
      case "COMPLETED":
        return "bg-purple-500/20 text-purple-300";
      case "CANCELLED":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
      <h2 className="text-lg sm:text-xl font-semibold mb-6">Upcoming Bookings</h2>

      <div className="mt-6 overflow-hidden">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No bookings today</h3>
            <p className="text-slate-500">New reservations will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-slate-800 rounded-xl p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-slate-200">
                        {booking.user.name || booking.user.email}
                      </h4>
                      <span className="text-xs text-slate-400">
                        Party of {booking.partySize}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                      <span>📅 {new Date(booking.slot.date).toLocaleDateString()}</span>
                      <span>🕐 {booking.slot.time}</span>
                      <span>📧 {booking.user.email}</span>
                      {booking.user.phone && <span>📞 {booking.user.phone}</span>}
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      Booked {new Date(booking.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>

                    {booking.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onStatusChange(booking.id, "CONFIRMED")}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => onStatusChange(booking.id, "CANCELLED")}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => onStatusChange(booking.id, "SEATED")}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Seat
                      </button>
                    )}

                    {booking.status === "SEATED" && (
                      <button
                        onClick={() => onStatusChange(booking.id, "COMPLETED")}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
