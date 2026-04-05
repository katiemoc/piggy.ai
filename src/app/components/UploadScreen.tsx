import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { PigMascot } from './PigMascot';
import { fileToBase64 } from '../utils/geminiFileUtils';
import { parseBankStatementPDF } from '../services/geminiService';
import { saveTransactionsToStorage } from '../services/browserUseService';

interface UploadScreenProps {
  onUpload: (useSample: boolean) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const txns = await parseBankStatementPDF(base64);
      saveTransactionsToStorage(txns);
      onUpload(false);
    } catch (err: any) {
      console.error("Gemini Upload Parser Error:", err);
      setError(err.message || "Failed to parse PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="min-h-screen flex text-[#1a1a1a] bg-[#f5f5f0] items-center justify-center p-8 relative">
       {isProcessing && (
         <div className="absolute inset-0 bg-[#f5f5f0]/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-[#57886c] animate-spin mb-4" />
            <div className="text-xl font-medium">Extracting financial data...</div>
            <div className="text-sm text-[#5a5a5a] mt-2">Piggy AI is reading your statements</div>
         </div>
       )}

      <div className="max-w-xl w-full flex flex-col items-center gap-8">
        <div className="flex flex-col items-center">
          <PigMascot width={100} />
          <h1 className="text-5xl tracking-tight mt-3 mb-2">
            <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
          </h1>
          <p className="text-[#5a5a5a]">your brutally honest financial twin</p>
        </div>

        {error && <div className="text-[#c0392b] bg-[#c0392b]/10 border border-[#c0392b]/20 px-4 py-3 rounded-lg w-full text-center text-sm">{error}</div>}

        <div
          className="w-full border-2 border-dashed border-[#d0d0d0] rounded-lg p-12 flex flex-col items-center justify-center gap-4 hover:border-[#57886c] transition-colors cursor-pointer bg-white"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="w-12 h-12 text-[#5a5a5a]" />
          <div className="text-center">
            <p className="mb-1">Drag and drop your PDF file here</p>
            <p className="text-sm text-[#5a5a5a]">or click to browse</p>
          </div>
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleChange}
          />
        </div>

        <div className="w-full flex gap-4">
          <button
            onClick={() => onUpload(true)}
            className="flex-1 bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2"
          >
            <span>Use Sample Data</span>
          </button>
          <button
            onClick={() => onUpload(false)}
            className="flex-1 bg-transparent border-2 border-[#d0d0d0] text-[#1a1a1a] px-6 py-3 rounded-lg hover:border-[#57886c] transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Add Manually</span>
          </button>
        </div>
      </div>
    </div>
  );
}