import React, { useState, useEffect } from 'react';
import { KeyRound, CircleCheck, ChevronRight, CircleHelp } from 'lucide-react';

export default function ApiKeyInput({ onKeySave, savedKey }) {
  const [apiKey, setApiKey] = useState(savedKey || '');
  const [isEditing, setIsEditing] = useState(!savedKey);

  useEffect(() => {
    if (savedKey) {
      setApiKey(savedKey);
      setIsEditing(false);
    }
  }, [savedKey]);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onKeySave(apiKey.trim());
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="glass-panel flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-full">
            <CircleCheck className="text-emerald-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg text-white mb-1">API Key Configured</h3>
            <p className="text-sm">Your WAValidator API Key is securely stored in your browser.</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-outline text-sm"
        >
          Update Key
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel mb-8 border-emerald-500/30">
      <div className="flex items-center gap-3 mb-4">
        <KeyRound className="text-emerald-400" size={24} />
        <h2 className="text-xl text-white">WAValidator API Key Settings</h2>
      </div>

      <p className="mb-6">
        To use this tool, you need an API key from WAValidator.
        Your key is stored locally and never sent anywhere except directly to the validation API.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex gap-4">
          <input
            type="password"
            placeholder="Enter your WAValidator API Key (e.g., wav_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
            className="flex-1"
          />
          <button type="submit" className="btn btn-primary whitespace-nowrap">
            Save Key <ChevronRight size={18} />
          </button>
        </div>
      </form>

      <div className="mt-6 flex items-start gap-2 text-sm text-yellow-200/70 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
        <CircleHelp size={18} className="shrink-0 mt-0.5" />
        <div>
          Don't have an API key or ran out of credits?
          <a href="https://wavalidator.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 font-medium ml-1 hover:underline">
            Go to wavalidator.com to top up
          </a>
        </div>
      </div>
    </div>
  );
}
