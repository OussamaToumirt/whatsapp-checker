import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { validatePhoneNumber } from '../api/validator';
import { CloudUpload, Sheet, Loader2, Download, TriangleAlert, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <Card className="glass-panel border-emerald-500/20 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Users className="text-emerald-400" size={24} />
        <CardTitle className="text-xl text-white">Bulk Validator (CSV)</CardTitle>
      </div>

      {!apiKey && (
        <div className="text-sm text-yellow-200/70 bg-yellow-500/10 p-3 rounded-lg flex items-center gap-2 border border-yellow-500/20">
          <TriangleAlert size={16} /> Please configure your API key first.
        </div>
      )}

      {numbers.length === 0 && (
        <div
          className={`drop-zone border-dashed border-2 border-emerald-500/30 rounded-xl p-12 text-center transition-all cursor-pointer bg-black/10 hover:bg-emerald-500/5 hover:border-emerald-400 ${!apiKey ? 'opacity-50 pointer-events-none' : ''}`}
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
          <h3 className="text-lg text-white mb-2 font-medium">Upload CSV File</h3>
          <p className="text-sm text-slate-400">Drag and drop or click to select.<br />Maximum 1000 numbers allowed.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
          <TriangleAlert size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {numbers.length > 0 && results.length === 0 && !isProcessing && (
        <div className="bg-black/20 p-6 rounded-lg border border-white/5 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-500/20 p-3 rounded-full">
              <Sheet className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg text-white font-medium mb-1">{file?.name}</h3>
              <p className="text-sm text-slate-400">{numbers.length} numbers detected ready for validation.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={processBatch}>
              Start Validating {numbers.length} Numbers
            </Button>
            <Button variant="outline" className="border-emerald-500/30 text-white hover:bg-emerald-500/10" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}

      {(isProcessing || results.length > 0) && (
        <div className="animate-fade-in flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Processing Results</h3>
              <p className="text-sm text-slate-400">
                Validated {results.length} of {numbers.length}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stats.valid}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Invalid</div>
              </div>
            </div>
          </div>

          <Progress value={progress} className="h-2.5 bg-gray-800 border border-white/5 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400" />

          {!isProcessing && results.length > 0 && (
            <div className="flex gap-4">
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={downloadResults}>
                <Download size={18} className="mr-2" /> Export Results to CSV
              </Button>
              <Button variant="outline" className="border-emerald-500/30 text-white hover:bg-emerald-500/10" onClick={reset}>New Batch</Button>
            </div>
          )}

          <div className="rounded-md border border-white/10 bg-black/20 max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-[#0f172a] shadow-lg">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">Phone Number</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, idx) => (
                  <TableRow key={idx} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-mono text-sm text-slate-300">{result.phone_number}</TableCell>
                    <TableCell>
                      {result.status === 'valid' ? (
                        <Badge className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30">Valid</Badge>
                      ) : result.status === 'invalid' ? (
                        <Badge variant="destructive" className="border-red-500/40">Invalid</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-300 border-red-500/30">Error: {result.error}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {isProcessing && (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={2} className="text-center py-8 text-slate-400">
                      <Loader2 className="animate-spin inline mr-2" size={16} /> Validating...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Card>
  );
}
