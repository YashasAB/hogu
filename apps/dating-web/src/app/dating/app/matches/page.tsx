
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MatchCard {
  id: string;
  status: string;
  partner: {
    name: string;
    age: number;
    photo: string | null;
  };
  myIntent: string | null;
  theirIntent: string | null;
  hasBooking: boolean;
}

interface MatchesData {
  NEW: MatchCard[];
  SCHEDULE: MatchCard[];
  SCHEDULED: MatchCard[];
}

export default function Matches() {
  const [matches, setMatches] = useState<MatchesData>({ NEW: [], SCHEDULE: [], SCHEDULED: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('dating_access_token');
        const response = await fetch('/api/matches', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const MatchCardComponent = ({ match }: { match: MatchCard }) => (
    <Link href={`/dating/app/matches/${match.id}`} className="block">
      <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            {match.partner.photo ? (
              <img src={match.partner.photo} alt={match.partner.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="text-gray-400 text-xl">👤</span>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{match.partner.name}</h3>
            <p className="text-gray-600">{match.partner.age} years old</p>
            
            <div className="flex space-x-2 mt-2">
              {match.myIntent && (
                <span className={`text-xs px-2 py-1 rounded ${
                  match.myIntent === 'YES' ? 'bg-green-100 text-green-800' :
                  match.myIntent === 'NO' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  You: {match.myIntent}
                </span>
              )}
              {match.theirIntent && (
                <span className={`text-xs px-2 py-1 rounded ${
                  match.theirIntent === 'YES' ? 'bg-green-100 text-green-800' :
                  match.theirIntent === 'NO' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Them: {match.theirIntent}
                </span>
              )}
            </div>
          </div>

          {match.status === 'SCHEDULED' && match.hasBooking && (
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Matches</h1>

      {/* New Matches */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">New Matches</h2>
        {matches.NEW.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg p-6">No new matches yet. We're working on finding great people for you!</p>
        ) : (
          <div className="grid gap-4">
            {matches.NEW.map(match => (
              <MatchCardComponent key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Scheduling */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ready to Schedule</h2>
        {matches.SCHEDULE.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg p-6">No dates to schedule right now.</p>
        ) : (
          <div className="grid gap-4">
            {matches.SCHEDULE.map(match => (
              <MatchCardComponent key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Scheduled */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Dates</h2>
        {matches.SCHEDULED.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-lg p-6">No upcoming dates scheduled.</p>
        ) : (
          <div className="grid gap-4">
            {matches.SCHEDULED.map(match => (
              <MatchCardComponent key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
