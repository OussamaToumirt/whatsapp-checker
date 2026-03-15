import React, { useState, useEffect } from 'react';
import { KeyRound, CircleCheck, ChevronRight, CircleHelp, CircleAlert, Loader2 } from 'lucide-react';
import { checkApiKey } from '../api/validator';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

export default function ApiKeyInput({ onKeySave, savedKey }) {
  const [apiKey, setApiKey] = useState(savedKey || '');
  const [isEditing, setIsEditing] = useState(!savedKey);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (savedKey) {
      setApiKey(savedKey);
      setIsEditing(false);
    }
  }, [savedKey]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsConfiguring(true);
    setError('');

    try {
      const isValid = await checkApiKey(apiKey.trim());
      
      if (isValid) {
        onKeySave(apiKey.trim());
        setIsEditing(false);
      } else {
        setError('Invalid API Key. Please verify your key on wavalidator.com.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify API key. Please try again.');
    } finally {
      setIsConfiguring(false);
    }
  };

  if (!isEditing) {
    return (
      <Card className="glass-panel flex items-center justify-between mb-8 p-6 flex-row border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-full">
            <CircleCheck className="text-emerald-400" size={24} />
          </div>
          <div>
            <CardTitle className="text-lg text-white mb-1">API Key Configured</CardTitle>
            <p className="text-sm text-slate-300">Your WAValidator API Key is securely stored in your browser.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsEditing(true)}
          className="bg-transparent border-emerald-500/30 text-white hover:bg-emerald-500/10 hover:text-white"
        >
          Update Key
        </Button>
      </Card>
    );
  }

  return (
    <Card className="glass-panel mb-8 border-emerald-500/30 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <KeyRound className="text-emerald-400" size={24} />
        <CardTitle className="text-xl text-white">WAValidator API Key Settings</CardTitle>
      </div>

      <p className="text-slate-300 text-sm">
        To use this tool, you need an API key from WAValidator.
        Your key is stored locally and never sent anywhere except directly to the validation API.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Input
            type="password"
            placeholder="Enter your WAValidator API Key (e.g., wav_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            disabled={isConfiguring}
            className="flex-1 bg-black/20 border-emerald-500/30 focus-visible:ring-emerald-500 text-white placeholder:text-slate-500 disabled:opacity-50"
          />
          <Button type="submit" disabled={isConfiguring || !apiKey.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap min-w-[120px]">
             {isConfiguring ? <Loader2 className="animate-spin" size={18} /> : <>Save Key <ChevronRight size={18} className="ml-1" /></>}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md flex items-center gap-3 animate-fade-in text-sm mt-1">
            <CircleAlert size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      <div className="flex items-start gap-2 text-sm text-yellow-200/70 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
        <CircleHelp size={18} className="shrink-0 mt-0.5" />
        <div>
          Don't have an API key or ran out of credits?
          <a href="https://wavalidator.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 font-medium ml-1 hover:underline">
            Go to wavalidator.com to top up
          </a>
        </div>
      </div>
    </Card>
  );
}
