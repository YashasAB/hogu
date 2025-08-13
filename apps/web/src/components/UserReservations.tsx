
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

interface Reservation {
  id: string
  status: string
  partySize: number
  restaurant: {
    name: string
    slug: string
    emoji?: string | null
  }
  slot: {
    date: string
    time: string
  }
}

interface UserReservationsProps {
  user: {
    name: string
    username: string
    email: string
    id: string
  } | null
  userReservations: Reservation[]
  loadingReservations: boolean
  onReservationsUpdate: () => void
}

export default function UserReservations({ 
  user, 
  userReservations, 
  loadingReservations, 
  onReservationsUpdate 
}: UserReservationsProps) {
  const navigate = useNavigate()

  // Helper functions
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    return `${hour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case "SEATED":
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
      case "CANCELLED":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };

  // Function to handle cancellation
  const handleCancelReservation = async (reservationId: string) => {
    const token = localStorage.getItem("hogu_token");
    if (!token) return;

    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log(`Reservation ${reservationId} cancelled successfully.`);
        onReservationsUpdate(); // Refresh the list
      } else {
        console.error("Failed to cancel reservation:", response.statusText);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      // Optionally show an error message to the user
    }
  };

  if (!user || userReservations.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
            />
          </svg>
          Your Reservations
        </h2>
        <Link
          to="/me"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>

      {loadingReservations ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {userReservations.slice(0, 3).map((reservation) => (
            <div
              key={reservation.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <span>{reservation.restaurant.emoji || "🍽️"}</span>
                  {reservation.restaurant.name}
                </h3>
                <span className={getStatusColor(reservation.status)}>
                  {reservation.status === "PENDING"
                    ? "Pending"
                    : reservation.status === "CONFIRMED"
                      ? "Accepted"
                      : reservation.status === "SEATED"
                        ? "Seated"
                        : reservation.status === "COMPLETED"
                          ? "Completed"
                          : reservation.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(reservation.slot.date)}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatTime(reservation.slot.time)}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {reservation.partySize}{" "}
                  {reservation.partySize === 1 ? "person" : "people"}
                </span>
              </div>
              {/* Add cancel button for pending reservations */}
              {reservation.status === "PENDING" && (
                <div className="mt-3 text-right">
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* Existing "Complete Booking" button (if applicable for other statuses) */}
              {reservation.status === "HELD" && (
                <div className="mt-3">
                  <button
                    onClick={() => navigate(
                      `/r/${reservation.restaurant.slug}/hold/${reservation.id}`,
                    )}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Complete Booking
                  </button>
                </div>
              )}
            </div>
          ))}

          {userReservations.length > 3 && (
            <div className="text-center pt-2">
              <Link
                to="/me"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View all {userReservations.length} reservations →
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
