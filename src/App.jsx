import React, { useState, useEffect } from 'react';
import ApiKeyInput from './components/ApiKeyInput';
import SingleValidation from './components/SingleValidation';
import BatchValidation from './components/BatchValidation';
import { ShieldCheck, MessageCircle, Github } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

function App() {
  const [apiKey, setApiKey] = useState('');
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('wav_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleKeySave = (key) => {
    localStorage.setItem('wav_api_key', key);
    setApiKey(key);
  };

  return (
    <div className="container relative z-10 mt-10">
      <header className="flex items-center justify-between mb-12 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 rounded-xl p-3 shadow-lg shadow-emerald-500/20">
            <MessageCircle className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl text-white">WhatsApp Validator</h1>
            <p className="text-emerald-400 font-medium">Fast & Reliable Checking Tool</p>
          </div>
        </div>

        {credits !== null && (
          <Badge variant="outline" className="py-2 px-4 flex items-center gap-2 border-emerald-500/30 bg-emerald-500/10 shadow-none text-emerald-300 text-sm font-medium hover:bg-emerald-500/20 rounded-full">
            <ShieldCheck className="text-emerald-400" size={20} />
            Credits Remaining: {credits}
          </Badge>
        )}
      </header>

      <main>
        <ApiKeyInput onKeySave={handleKeySave} savedKey={apiKey} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SingleValidation apiKey={apiKey} onCreditsUpdate={setCredits} />
          <BatchValidation apiKey={apiKey} onCreditsUpdate={setCredits} />
        </div>
      </main>

      <footer className="mt-20 border-t border-white/10 pt-8 pb-4 text-center">
        <p className="text-xs text-gray-500 mt-4">
          This tool connects to the <a href="https://wavalidator.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400">wavalidator.com</a> API. Make sure your API key has sufficient credits.
        </p>
      </footer>
    </div>
  );
}

export default App;
