import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PigMascot } from './PigMascot';
import { parseBankStatementPDF } from '../services/geminiService';
import { saveTransactionsToStorage } from '../services/browserUseService';
import { ManualEntryModal } from './ManualEntryModal';

interface UploadScreenProps {
  onUpload: (useSample: boolean) => void;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => [
      ...prev,
      ...pdfs
        .filter(f => !prev.some(p => p.file.name === f.name))
        .map(f => ({ file: f, status: 'pending' as const }))
    ]);
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== name));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const processAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length) return;
    setIsProcessing(true);

    for (const item of pending) {
      setFiles(prev => prev.map(f => f.file.name === item.file.name ? { ...f, status: 'processing' } : f));
      try {
        const txns = await parseBankStatementPDF(item.file);
        saveTransactionsToStorage(txns);
        setFiles(prev => prev.map(f => f.file.name === item.file.name ? { ...f, status: 'done' } : f));
      } catch (err: any) {
        console.error('Gemini Upload Parser Error:', err);
        setFiles(prev => prev.map(f => f.file.name === item.file.name ? { ...f, status: 'error', error: err.message } : f));
      }
    }

    setIsProcessing(false);
    // Auto-navigate if at least one succeeded
    if (files.some(f => f.status === 'done') || pending.some(p => p.status === 'done')) {
      onUpload(false);
    }
  };

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');
  const hasPending = files.some(f => f.status === 'pending');

  return (
    <div className="min-h-screen flex text-[#1a1a1a] bg-[#f5f5f0] items-center justify-center p-8 relative">
      {showManualEntry && (
        <ManualEntryModal
          onClose={() => setShowManualEntry(false)}
          onSave={() => { setShowManualEntry(false); onUpload(false); }}
        />
      )}

      <div className="max-w-xl w-full flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <PigMascot width={100} />
          <h1 className="text-5xl tracking-tight mt-3 mb-2">
            <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
          </h1>
          <p className="text-[#5a5a5a]">your brutally honest financial twin</p>
        </div>

        {/* Drop zone */}
        <div
          className={`w-full border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer bg-white ${isDragging ? 'border-[#57886c] bg-[#57886c]/5' : 'border-[#d0d0d0] hover:border-[#57886c]'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-10 h-10 text-[#5a5a5a]" />
          <div className="text-center">
            <p className="mb-1">Drag and drop PDF statements here</p>
            <p className="text-sm text-[#5a5a5a]">Multiple files supported · click to browse</p>
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={handleChange}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {files.map(({ file, status, error }) => (
              <div key={file.name} className="flex items-center gap-3 bg-white border border-[#e0e0e0] rounded-lg px-4 py-3">
                {status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-[#d0d0d0] shrink-0" />}
                {status === 'processing' && <Loader2 className="w-4 h-4 text-[#57886c] animate-spin shrink-0" />}
                {status === 'done' && <CheckCircle className="w-4 h-4 text-[#57886c] shrink-0" />}
                {status === 'error' && <div className="w-4 h-4 rounded-full bg-[#c0392b] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  {status === 'error' && <p className="text-xs text-[#c0392b] truncate">{error}</p>}
                  {status === 'done' && <p className="text-xs text-[#57886c]">Imported successfully</p>}
                </div>
                {status === 'pending' && (
                  <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }} className="text-[#5a5a5a] hover:text-[#c0392b] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          {files.length > 0 && hasPending && (
            <button
              onClick={processAll}
              disabled={isProcessing}
              className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : <>Analyze {files.filter(f => f.status === 'pending').length} PDF{files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''} with Piggy AI</>
              }
            </button>
          )}

          {allDone && (
            <button
              onClick={() => onUpload(false)}
              className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors"
            >
              View Dashboard →
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => onUpload(true)}
              className="flex-1 bg-transparent border-2 border-[#d0d0d0] text-[#1a1a1a] px-6 py-3 rounded-lg hover:border-[#57886c] transition-colors"
            >
              Use Sample Data
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex-1 bg-transparent border-2 border-[#d0d0d0] text-[#1a1a1a] px-6 py-3 rounded-lg hover:border-[#57886c] transition-colors"
            >
              + Add Manually
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-[#5a5a5a] hover:text-[#1a1a1a] transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
