
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Match {
  match: {
    id: string;
    status: string;
  };
  partner: {
    name: string;
    age: number;
    gender: string;
    city: string;
    neighborhood: string;
    profession: string;
    preferredDateNeighborhoods: string[];
    firstDateTypes: string[];
    cuisines: string[];
    interests: string[];
    photos: string[];
  };
  myIntent: string | null;
  theirIntent: string | null;
  myAvailability: Array<{
    id: string;
    date: string;
    start: string;
    end: string;
    tz: string;
  }>;
  partnerAvailabilitySubmitted: boolean;
  booking: any;
}

export default function MatchDetail() {
  const params = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [intentNote, setIntentNote] = useState('');
  const [submittingIntent, setSubmittingIntent] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const token = localStorage.getItem('dating_access_token');
        const response = await fetch(`/api/matches/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMatch(data);
        }
      } catch (error) {
        console.error('Failed to fetch match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [params.id]);

  const handleIntentSubmit = async (intent: 'YES' | 'NO' | 'MAYBE') => {
    setSubmittingIntent(true);
    try {
      const token = localStorage.getItem('dating_access_token');
      const response = await fetch(`/api/matches/${params.id}/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intent,
          note: intentNote || undefined
        })
      });

      if (response.ok) {
        // Refresh match data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to submit intent:', error);
    } finally {
      setSubmittingIntent(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Match not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-6">
          <h1 className="text-2xl font-bold">{match.partner.name}</h1>
          <p className="opacity-90">{match.partner.age} • {match.partner.profession}</p>
          <p className="opacity-75 text-sm">{match.partner.city}, {match.partner.neighborhood}</p>
        </div>

        {/* Photos */}
        {match.partner.photos.length > 0 && (
          <div className="p-6 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {match.partner.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${match.partner.name} photo ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Preferred Date Neighborhoods</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {match.partner.preferredDateNeighborhoods.map(neighborhood => (
                <span key={neighborhood} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {neighborhood.replace('_', ' ')}
                </span>
              ))}
            </div>

            <h3 className="font-semibold mb-3">First Date Ideas</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {match.partner.firstDateTypes.map(type => (
                <span key={type} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
                  {type.replace('_', ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Cuisines</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {match.partner.cuisines.map(cuisine => (
                <span key={cuisine} className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
                  {cuisine}
                </span>
              ))}
            </div>

            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {match.partner.interests.map(interest => (
                <span key={interest} className="bg-purple-100 px-3 py-1 rounded-full text-sm text-purple-800">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Intent Section */}
        {match.match.status === 'NEW' && (
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="font-semibold mb-4">Are you interested in meeting {match.partner.name}?</h3>
            
            <textarea
              placeholder="Add a note (optional)"
              value={intentNote}
              onChange={(e) => setIntentNote(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 resize-none"
              rows={3}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => handleIntentSubmit('YES')}
                disabled={submittingIntent}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Yes, I'm interested! 💚
              </button>
              <button
                onClick={() => handleIntentSubmit('MAYBE')}
                disabled={submittingIntent}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Maybe 🤔
              </button>
              <button
                onClick={() => handleIntentSubmit('NO')}
                disabled={submittingIntent}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Not interested
              </button>
            </div>
          </div>
        )}

        {/* Scheduling Section */}
        {match.match.status === 'SCHEDULE' && (
          <div className="p-6 bg-blue-50 border-t">
            <h3 className="font-semibold mb-4">🎉 It's a match! Time to schedule your date</h3>
            <p className="text-gray-600 mb-4">
              Both of you are interested! Please submit your availability so we can coordinate the perfect date.
            </p>
            
            {match.myAvailability.length > 0 ? (
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium mb-2">Your submitted availability:</h4>
                {match.myAvailability.map(slot => (
                  <div key={slot.id} className="text-sm text-gray-600">
                    {slot.date} from {slot.start} to {slot.end}
                  </div>
                ))}
              </div>
            ) : (
              <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium">
                Submit Your Availability
              </button>
            )}

            <p className="text-sm text-gray-500 mt-4">
              Partner availability submitted: {match.partnerAvailabilitySubmitted ? '✅ Yes' : '⏳ Waiting'}
            </p>
          </div>
        )}

        {/* Scheduled Section */}
        {match.match.status === 'SCHEDULED' && match.booking && (
          <div className="p-6 bg-green-50 border-t">
            <h3 className="font-semibold mb-4">🗓️ Your date is confirmed!</h3>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium">{match.booking.venueName}</h4>
              <p className="text-gray-600">{match.booking.venueAddress}</p>
              <p className="text-gray-600">
                {new Date(match.booking.startTs).toLocaleDateString()} at{' '}
                {new Date(match.booking.startTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded text-sm ${
                match.booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                Payment: {match.booking.paymentStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
