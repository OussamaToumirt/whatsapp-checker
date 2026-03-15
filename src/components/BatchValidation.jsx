import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { validatePhoneNumber } from '../api/validator';
import { CloudUpload, Sheet, Loader2, Download, TriangleAlert, Users } from 'lucide-react';

export default function BatchValidation({ apiKey, onCreditsUpdate }) {
  const [file, setFile] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ valid: 0, invalid: 0 });

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResults([]);
    setStats({ valid: 0, invalid: 0 });
    setProgress(0);

    Papa.parse(selectedFile, {
      complete: (results) => {
        // Assume first column contains phone numbers if no header, or extract from appropriate column
        // Here we just flatten all data and extract anything that looks like a phone number
        let extractedNumbers = [];

        results.data.forEach(row => {
          if (Array.isArray(row)) {
            // Take the first column that has numeric content
            const possibleNum = row.find(cell => typeof cell === 'string' && cell.replace(/\D/g, '').length >= 7);
            if (possibleNum) {
              extractedNumbers.push(possibleNum.replace(/\D/g, ''));
            }
          } else if (typeof row === 'object') {
            // Find a value that looks like a phone number
            const possibleNum = Object.values(row).find(cell => typeof cell === 'string' && cell.replace(/\D/g, '').length >= 7);
            if (possibleNum) {
              extractedNumbers.push(possibleNum.replace(/\D/g, ''));
            }
          }
        });

        extractedNumbers = [...new Set(extractedNumbers)].filter(n => n.length > 5);

        if (extractedNumbers.length > 1000) {
          setError(`File contains ${extractedNumbers.length} numbers. Maximum allowed is 1000 per batch.`);
          setNumbers([]);
        } else if (extractedNumbers.length === 0) {
          setError('Could not find any valid phone numbers in the CSV.');
        } else {
          setNumbers(extractedNumbers);
        }
      },
      error: (err) => {
        setError('Failed to parse CSV file: ' + err.message);
      }
    });
  };

  const processBatch = async () => {
    if (numbers.length === 0 || !apiKey) return;

    setIsProcessing(true);
    let currentResults = [];
    let validCount = 0;
    let invalidCount = 0;

    // Process sequentially to be safe with rate limits, or chunk if API supports it
    // The instructions say single endpoint so we do a loop
    try {
      for (let i = 0; i < numbers.length; i++) {
        // Add small delay to avoid hitting rate limits too hard
        if (i > 0) await new Promise(r => setTimeout(r, 200));

        try {
          const response = await validatePhoneNumber(apiKey, numbers[i]);
          currentResults.push(response);

          if (response.status === 'valid') validCount++;
          else invalidCount++;

          if (response.credits_remaining !== undefined) {
            onCreditsUpdate(response.credits_remaining);
          }
        } catch (err) {
          currentResults.push({
            phone_number: numbers[i],
            status: 'error',
            error: err.message
          });
        }

        setResults([...currentResults]);
        setStats({ valid: validCount, invalid: invalidCount });
        setProgress(Math.round(((i + 1) / numbers.length) * 100));
      }
    } catch (err) {
      setError('Batch processing interrupted: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const csv = Papa.unparse(results.map(r => ({
      Phone: r.phone_number,
      Status: r.status,
      Error: r.error || ''
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'whatsapp_validation_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setNumbers([]);
    setResults([]);
    setProgress(0);
    setStats({ valid: 0, invalid: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-primary" size={24} />
        <h2 className="text-xl text-white">Bulk Validator (CSV)</h2>
      </div>

      {!apiKey && (
        <div className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded flex items-center gap-2 mb-6">
          <TriangleAlert size={16} /> Please configure your API key first.
        </div>
      )}

      {numbers.length === 0 && (
        <div
          className={`drop-zone ${!apiKey ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => apiKey && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <CloudUpload size={48} className="mx-auto mb-4 text-emerald-400/50" />
          <h3 className="text-lg text-white mb-2">Upload CSV File</h3>
          <p className="text-sm px-8">Drag and drop or click to select.<br />Maximum 1000 numbers allowed.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mt-4 flex items-start gap-3">
          <TriangleAlert size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {numbers.length > 0 && results.length === 0 && !isProcessing && (
        <div className="bg-black/20 p-6 rounded-lg border border-white/5 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/20 p-3 rounded-full">
              <Sheet className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-lg text-white font-medium">{file?.name}</h3>
              <p className="text-sm">{numbers.length} numbers detected ready for validation.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="btn btn-primary flex-1" onClick={processBatch}>
              Start Validating {numbers.length} Numbers
            </button>
            <button className="btn btn-outline" onClick={reset}>Cancel</button>
          </div>
        </div>
      )}

      {(isProcessing || results.length > 0) && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-medium text-white">Processing Results</h3>
              <p className="text-sm">
                Validated {results.length} of {numbers.length}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.valid}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Invalid</div>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-800 rounded-full h-2.5 mb-6 overflow-hidden border border-white/5">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>

          {!isProcessing && results.length > 0 && (
            <div className="flex gap-4 mb-6">
              <button className="btn btn-primary flex-1" onClick={downloadResults}>
                <Download size={18} /> Export Results to CSV
              </button>
              <button className="btn btn-outline" onClick={reset}>New Batch</button>
            </div>
          )}

          <div className="table-container max-h-[400px] overflow-y-auto">
            <table>
              <thead className="sticky top-0 bg-[#0f172a] shadow-lg">
                <tr>
                  <th>Phone Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx}>
                    <td className="font-mono text-sm">{result.phone_number}</td>
                    <td>
                      {result.status === 'valid' ? (
                        <span className="badge badge-valid">Valid</span>
                      ) : result.status === 'invalid' ? (
                        <span className="badge badge-invalid">Invalid</span>
                      ) : (
                        <span className="badge bg-red-500/20 text-red-300">Error: {result.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {isProcessing && (
                  <tr>
                    <td colSpan="2" className="text-center py-4 text-gray-400">
                      <Loader2 className="animate-spin inline mr-2" size={16} /> Validating...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
