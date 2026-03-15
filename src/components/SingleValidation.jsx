import React, { useState } from 'react';
import { validatePhoneNumber } from '../api/validator';
import { Phone, Search, Loader2, CircleAlert } from 'lucide-react';

export default function SingleValidation({ apiKey, onCreditsUpdate }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // Remove any non-numeric characters for the API
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const response = await validatePhoneNumber(apiKey, cleanNumber);

      setResult(response);

      if (response.credits_remaining !== undefined) {
        onCreditsUpdate(response.credits_remaining);
      }
    } catch (err) {
      setError(err.message || 'Failed to validate number');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center gap-3 mb-6">
        <Phone className="text-primary" size={24} />
        <h2 className="text-xl text-white">Single Number Check</h2>
      </div>

      <form onSubmit={handleValidate} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter phone number with country code (e.g., 14155551234)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || !apiKey}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary min-w-[120px]"
          disabled={isLoading || !apiKey || !phoneNumber}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Search size={18} /> Check</>}
        </button>
      </form>

      {!apiKey && (
        <div className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded flex items-center gap-2 mb-4">
          <CircleAlert size={16} /> Please configure your API key first.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
          <CircleAlert size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-black/20 border border-white/5 rounded-lg p-6 animate-fade-in text-center">
          <div className="text-sm text-gray-400 mb-2">Result for {result.phone_number}</div>

          <div className="mb-6 mt-4">
            {result.status === 'valid' ? (
              <div className="inline-flex items-center text-emerald-400 gap-2 mb-2 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xl font-bold uppercase tracking-wider text-emerald-300">Valid WhatsApp</span>
              </div>
            ) : (
              <div className="inline-flex items-center text-red-400 gap-2 mb-2 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="text-xl font-bold uppercase tracking-wider text-red-300">Invalid Number</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
