
'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  neighborhood: string;
  tz: string;
  instagramHandle: string;
  profession: string;
  dreams: string;
  fiveYearGoal: string;
  whatIWantInPartner: string;
  whyPartnerWouldLikeMe: string;
  physicalActivity: string;
  photos: Array<{ id: string; url: string; sortOrder: number }>;
  cuisines: string[];
  interests: string[];
  firstDateTypes: string[];
  preferredNeighborhoods: string[];
  seekingGenders: string[];
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('dating_access_token');
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData(data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('dating_access_token');
      
      // Update basic profile
      await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: formData.city,
          neighborhood: formData.neighborhood,
          profession: formData.profession,
          dreams: formData.dreams,
          fiveYearGoal: formData.fiveYearGoal,
          whatIWantInPartner: formData.whatIWantInPartner,
          whyPartnerWouldLikeMe: formData.whyPartnerWouldLikeMe,
          physicalActivity: formData.physicalActivity
        })
      });

      // Update cuisines
      await fetch('/api/me/cuisines', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cuisines: formData.cuisines || []
        })
      });

      // Update interests
      await fetch('/api/me/interests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tags: formData.interests || []
        })
      });

      setEditing(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-16"><p className="text-gray-500">Profile not found</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Basic Info */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <p className="text-gray-900">{profile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <p className="text-gray-900">{profile.age} years old</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-900">{profile.city || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.neighborhood || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-900">{profile.neighborhood || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">About You</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.profession || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-900">{profile.profession || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dreams & Aspirations</label>
              {editing ? (
                <textarea
                  value={formData.dreams || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dreams: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              ) : (
                <p className="text-gray-900">{profile.dreams || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-3">Preferred Date Neighborhoods</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredNeighborhoods.map(neighborhood => (
                <span key={neighborhood} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {neighborhood.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">First Date Ideas</h3>
            <div className="flex flex-wrap gap-2">
              {profile.firstDateTypes.map(type => (
                <span key={type} className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
                  {type.replace('_', ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Favorite Cuisines</h3>
            <div className="flex flex-wrap gap-2">
              {profile.cuisines.map(cuisine => (
                <span key={cuisine} className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
                  {cuisine}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(interest => (
                <span key={interest} className="bg-purple-100 px-3 py-1 rounded-full text-sm text-purple-800">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Looking For */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Looking For</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Interested in meeting</h3>
              <div className="flex flex-wrap gap-2">
                {profile.seekingGenders.map(gender => (
                  <span key={gender} className="bg-pink-100 px-3 py-1 rounded-full text-sm text-pink-800">
                    {gender.replace('_', ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {profile.whatIWantInPartner && (
              <div>
                <h3 className="font-medium mb-2">What I want in a partner</h3>
                <p className="text-gray-700">{profile.whatIWantInPartner}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
