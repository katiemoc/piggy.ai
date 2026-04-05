// components/GatherStatements.tsx
// Drop this in: src/app/components/GatherStatements.tsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, CheckCircle2, XCircle, Loader2,
  Download, RefreshCw, ShieldCheck, ChevronRight, X,
} from 'lucide-react';
import {
  SUPPORTED_BANKS,
  startBankTask,
  pollBankTask,
  downloadCSV,
  saveTransactionsToStorage,
  mapApiStatus,
  type Transaction,
  type BankTask,
  type TaskStatus,
} from '../services/browserUseService';

interface GatherStatementsProps {
  onComplete?: (transactions: Transaction[]) => void;
  onClose?: () => void;
}

type Step = 'select' | 'running' | 'done';

const STATUS_LABEL: Record<TaskStatus, string> = {
  idle:          'Waiting',
  starting:      'Starting…',
  waiting_login: 'Waiting for your login',
  navigating:    'Navigating site…',
  extracting:    'Extracting transactions…',
  done:          'Done',
  error:         'Failed',
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  idle:          'text-[#5a5a5a]',
  starting:      'text-[#fbbf24]',
  waiting_login: 'text-[#e8924a]',
  navigating:    'text-[#3d85c8]',
  extracting:    'text-[#3d85c8]',
  done:          'text-[#57886c]',
  error:         'text-[#c0392b]',
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done')  return <CheckCircle2 className="w-4 h-4 text-[#57886c]" />;
  if (status === 'error') return <XCircle className="w-4 h-4 text-[#c0392b]" />;
  if (status === 'idle')  return <div className="w-4 h-4 rounded-full border-2 border-[#d0d0d0]" />;
  return <Loader2 className="w-4 h-4 text-[#3d85c8] animate-spin" />;
}

function BankCard({ name, selected, onToggle }: { name: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left w-full ${
        selected
          ? 'bg-[#57886c]/10 border-[#57886c] text-[#1a1a1a]'
          : 'bg-white border-[#e0e0e0] text-[#5a5a5a] hover:border-[#57886c]/50 hover:bg-[#f5f5f0]'
      }`}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-[#57886c] border-[#57886c]' : 'border-[#d0d0d0]'}`}>
        {selected && (
          <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <Building2 className={`w-4 h-4 shrink-0 ${selected ? 'text-[#57886c]' : 'text-[#aaa]'}`} />
      <span className="text-sm font-medium">{name}</span>
    </button>
  );
}

function BankStatusRow({ task }: { task: BankTask }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
      task.status === 'done'  ? 'bg-[#f0faf4] border-[#57886c]/30' :
      task.status === 'error' ? 'bg-[#fff5f5] border-[#c0392b]/20' :
      'bg-white border-[#e0e0e0]'
    }`}>
      <StatusIcon status={task.status} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#1a1a1a] truncate">{task.bankName}</div>
        {task.status === 'waiting_login' && (
          <div className="text-xs text-[#e8924a] mt-0.5">
            🔐 Browser opened — log in to {task.bankName}
          </div>
        )}
        {task.liveUrl && task.status !== 'done' && (
          <div className="text-xs text-[#3d85c8] mt-0.5">
            <a href={task.liveUrl} target="_blank" rel="noreferrer" className="underline">
              View live browser session
            </a>
          </div>
        )}
        {task.status === 'done' && task.transactions.length > 0 && (
          <div className="text-xs text-[#57886c] mt-0.5">
            ✓ {task.transactions.length} transactions found
          </div>
        )}
        {task.status === 'done' && task.transactions.length === 0 && (
          <div className="text-xs text-[#5a5a5a] mt-0.5">No transactions found</div>
        )}
        {task.status === 'error' && (
          <div className="text-xs text-[#c0392b] mt-0.5">{task.error ?? 'Could not extract data'}</div>
        )}
      </div>
      <span className={`text-xs shrink-0 ${STATUS_COLOR[task.status]}`}>
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}

export function GatherStatements({ onComplete, onClose }: GatherStatementsProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [bankTasks, setBankTasks] = useState<BankTask[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // Ref keeps polling interval in sync with latest state without re-registering the interval
  const bankTasksRef = useRef<BankTask[]>([]);
  bankTasksRef.current = bankTasks;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const toggleBank = (id: string) =>
    setSelectedBankIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );

  const startGathering = useCallback(async () => {
    setStep('running');

    const initial: BankTask[] = selectedBankIds.map(id => ({
      bankId: id,
      bankName: SUPPORTED_BANKS.find(b => b.id === id)!.name,
      taskId: null,
      status: 'starting' as TaskStatus,
      transactions: [],
    }));
    setBankTasks(initial);

    // Start browser automation for each bank
    const results = await Promise.all(
      initial.map(async (task): Promise<BankTask> => {
        try {
          const result = await startBankTask(task.bankId);
          return { ...task, taskId: result.taskId, liveUrl: result.liveUrl, status: 'waiting_login' };
        } catch (err) {
          return {
            ...task,
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to start',
          };
        }
      })
    );
    setBankTasks(results);
  }, [selectedBankIds]);

  // Local automation workflow — no API polling needed
  useEffect(() => {
    if (step !== 'running') return;

    const intervalId = setInterval(async () => {
      const current = bankTasksRef.current;
      if (current.length === 0) return;

      const updated = await Promise.all(
        current.map(async (task): Promise<BankTask> => {
          if (!task.taskId || task.status === 'done' || task.status === 'error') return task;
          try {
            const result = await pollBankTask(task.taskId);
            const newStatus = mapApiStatus(result.status);
            return {
              ...task,
              liveUrl: result.liveUrl ?? task.liveUrl,
              status: newStatus,
              transactions: newStatus === 'done' ? result.transactions : task.transactions,
            };
          } catch {
            return task;
          }
        })
      );

      const allTerminal = updated.every(t => t.status === 'done' || t.status === 'error');
      if (allTerminal) {
        clearInterval(intervalId);
        const merged = updated.flatMap((t) => t.transactions);
        saveTransactionsToStorage(merged);
        setAllTransactions(merged);
        setStep('done');
        onCompleteRef.current?.(merged);
      } else {
        setBankTasks(updated);
      }
    }, 6000);

    return () => clearInterval(intervalId);
  }, [step]); // Only run when step changes to 'running'

  const completedCount = bankTasks.filter(t => t.status === 'done').length;
  const totalCount     = bankTasks.length;
  const progressPct    = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const totalTxns      = allTransactions.length;

  const handleReset = () => {
    setStep('select');
    setSelectedBankIds([]);
    setBankTasks([]);
    setAllTransactions([]);
  };

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-lg w-full max-w-lg mx-auto overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
        <div>
          <h2 className="text-base font-medium text-[#1a1a1a]">Gather Finance Statements</h2>
          <p className="text-xs text-[#5a5a5a] mt-0.5">
            {step === 'select'  && 'Select banks to import from'}
            {step === 'running' && `${completedCount} of ${totalCount} banks complete`}
            {step === 'done'    && `${totalTxns} transactions imported`}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5a5a5a] hover:bg-[#f5f5f0] hover:text-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-6 py-5">

        {/* ── SELECT ─────────────────────────────────────────────────────── */}
        {step === 'select' && (
          <>
            <div className="flex gap-2 p-3 bg-[#57886c]/08 border border-[#57886c]/20 rounded-xl mb-5">
              <ShieldCheck className="w-4 h-4 text-[#57886c] shrink-0 mt-0.5" />
              <p className="text-xs text-[#5a5a5a] leading-relaxed">
                <span className="text-[#57886c] font-medium">Privacy-first.</span>{' '}
                Browser windows will open for each bank. Log in manually, download your transactions as CSV, then upload them to the app.
                We never see your credentials or access your accounts directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {SUPPORTED_BANKS.map(bank => (
                <BankCard
                  key={bank.id}
                  name={bank.name}
                  selected={selectedBankIds.includes(bank.id)}
                  onToggle={() => toggleBank(bank.id)}
                />
              ))}
            </div>

            <button
              onClick={startGathering}
              disabled={selectedBankIds.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#57886c] text-white rounded-xl text-sm font-medium hover:bg-[#466060] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>⚡</span>
              Start Gathering
              {selectedBankIds.length > 0 && (
                <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {selectedBankIds.length} bank{selectedBankIds.length > 1 ? 's' : ''}
                </span>
              )}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </>
        )}

        {/* ── RUNNING ────────────────────────────────────────────────────── */}
        {step === 'running' && (
          <>
            <div className="mb-5">
              <div className="flex justify-between text-xs text-[#5a5a5a] mb-1.5">
                <span>Progress</span>
                <span>{completedCount}/{totalCount} complete</span>
              </div>
              <div className="w-full h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#57886c] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {bankTasks.map(task => (
                <BankStatusRow key={task.bankId} task={task} />
              ))}
            </div>

            <div className="flex gap-2 p-3 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-[#5a5a5a] leading-relaxed">
                Browser windows have opened for each bank. Log in to each one, navigate to your transaction history,
                download as CSV, then upload the CSV files manually using the upload feature.
              </p>
            </div>
          </>
        )}

        {/* ── DONE ───────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <>
            <div className="flex flex-col items-center text-center py-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-[#57886c]/15 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-[#57886c]" />
              </div>
              <h3 className="text-base font-medium text-[#1a1a1a] mb-1">
                Statements gathered!
              </h3>
              <p className="text-sm text-[#5a5a5a]">
                Browser sessions opened successfully! Download your transaction CSVs from each bank website,
                then use the CSV upload feature to import your data for AI analysis.
              </p>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {bankTasks.map(task => (
                <div key={task.bankId} className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f0] rounded-xl">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={task.status} />
                    <span className="text-sm text-[#1a1a1a]">{task.bankName}</span>
                  </div>
                  <span className={`text-xs ${task.status === 'done' ? 'text-[#57886c]' : 'text-[#c0392b]'}`}>
                    {task.status === 'done' ? `${task.transactions.length} transactions` : 'Failed'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {totalTxns > 0 && (
                <button
                  onClick={() => downloadCSV(allTransactions)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#57886c] text-white rounded-xl text-sm font-medium hover:bg-[#466060] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV ({totalTxns} transactions)
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#d0d0d0] text-[#5a5a5a] rounded-xl text-sm hover:border-[#57886c] hover:text-[#57886c] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Gather from more banks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}