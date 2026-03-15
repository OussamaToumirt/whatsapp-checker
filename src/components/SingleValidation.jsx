import React, { useState } from 'react';
import { validatePhoneNumber } from '../api/validator';
import { Phone, Search, Loader2, CircleAlert } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card className="glass-panel border-emerald-500/20 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Phone className="text-emerald-400" size={24} />
        <CardTitle className="text-xl text-white">Single Number Check</CardTitle>
      </div>

      <form onSubmit={handleValidate} className="flex gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Enter phone number with country code (e.g., 14155551234)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || !apiKey}
            className="w-full bg-black/20 border-emerald-500/30 focus-visible:ring-emerald-500 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]"
          disabled={isLoading || !apiKey || !phoneNumber}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Search size={18} className="mr-2" /> Check</>}
        </Button>
      </form>

      {!apiKey && (
        <div className="text-sm text-yellow-200/70 bg-yellow-500/10 p-3 rounded-lg flex items-center gap-2 border border-yellow-500/20">
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
          <div className="text-sm text-slate-400 mb-2">Result for {result.phone_number}</div>

          <div className="mb-2 mt-4">
            {result.status === 'valid' ? (
              <Badge className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30 px-4 py-1.5 text-sm uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Valid WhatsApp
              </Badge>
            ) : (
              <Badge variant="destructive" className="inline-flex items-center gap-2 border-red-500/40 px-4 py-1.5 text-sm uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-red-200"></span>
                Invalid WhatsApp Number
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
