import { Upload } from 'lucide-react';
import { PigMascot } from './PigMascot';

interface UploadScreenProps {
  onUpload: (useSample: boolean) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onUpload(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl w-full flex flex-col items-center gap-8">
        <div className="flex flex-col items-center">
          <PigMascot width={100} />
          <h1 className="text-5xl tracking-tight mt-3 mb-2">
            <span className="text-[#b05878]">piggy</span><span className="text-[#57886c]">.ai</span>
          </h1>
          <p className="text-[#5a5a5a]">your brutally honest financial twin</p>
        </div>

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
            onChange={() => onUpload(false)}
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