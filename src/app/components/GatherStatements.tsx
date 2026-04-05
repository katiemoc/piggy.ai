// src/components/GatherStatements.tsx
import { useState, useEffect, useRef } from "react";
import { X, Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import {
  createBankTask, createDemoLoginTask, pollUntilDone, stopTask,
  parseTransactions, saveTransactionsToStorage,
  transactionsToCSV, type SessionStatus, type Transaction
} from "../services/browserUseService";

const SUPPORTED_BANKS = [
  { id: "citibank",        name: "Citibank",        logo: "🏦" },
  { id: "chase",           name: "Chase",           logo: "🏛️" },
  { id: "golden1",         name: "Golden 1 CU",     logo: "🌻" },
  { id: "bank of america", name: "Bank of America", logo: "🏧" },
  { id: "wells_fargo",     name: "Wells Fargo",     logo: "🐴" },
  { id: "__demo__",        name: "Demo Bank",       logo: "🧪" },
];

type Step = "select" | "running" | "done";

interface BankTaskState {
  bank: string;
  taskId?: string;
  status: SessionStatus["status"] | "pending";
  liveUrl?: string;
  transactions: Transaction[];
  error?: string;
}

export default function GatherStatements({ onClose }: { onClose: () => void }) {
  const [step, setStep]                   = useState<Step>("select");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [bankTasks, setBankTasks]         = useState<BankTaskState[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeLiveUrl, setActiveLiveUrl] = useState<string | null>(null);
  const activeSessionRef = useRef<string | null>(null);

  // Stop any active session if the modal is closed mid-run
  useEffect(() => {
    return () => {
      if (activeSessionRef.current) stopTask(activeSessionRef.current);
    };
  }, []);

  const toggleBank = (id: string) => {
    setSelectedBanks(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const startGathering = async () => {
    if (selectedBanks.length === 0) return;

    const tasks: BankTaskState[] = selectedBanks.map(bank => ({
      bank, status: "pending", transactions: [],
    }));
    setBankTasks(tasks);
    setStep("running");

    // Run banks one at a time so the user logs in to each sequentially
    for (const bank of selectedBanks) {
      let taskId: string | undefined;
      try {
        taskId = bank === "__demo__"
          ? await createDemoLoginTask()
          : await createBankTask(bank);

        activeSessionRef.current = taskId;
        setBankTasks(prev => prev.map(t =>
          t.bank === bank ? { ...t, taskId, status: "running" } : t
        ));

        const finalStatus = await pollUntilDone(taskId, (status) => {
          setBankTasks(prev => prev.map(t =>
            t.bank === bank
              ? { ...t, status: status.status, liveUrl: status.liveUrl }
              : t
          ));
          if (status.liveUrl) setActiveLiveUrl(status.liveUrl);
        });

        activeSessionRef.current = null;

        const txns = parseTransactions(finalStatus.output || "", bank);
        setBankTasks(prev => prev.map(t =>
          t.bank === bank ? { ...t, status: "finished", transactions: txns } : t
        ));
        setAllTransactions(prev => [...prev, ...txns]);

      } catch (err: any) {
        if (taskId) stopTask(taskId);
        activeSessionRef.current = null;
        setBankTasks(prev => prev.map(t =>
          t.bank === bank ? { ...t, status: "failed", error: err.message } : t
        ));
      }
    }

    setStep("done");
  };

  const handleSave = () => {
    saveTransactionsToStorage(allTransactions);
    const csv  = transactionsToCSV(allTransactions);
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "piggy_statements.csv";
    a.click();
    onClose();
    window.location.href = "/dashboard";
  };

  const statusIcon = (status: BankTaskState["status"]) => {
    if (status === "pending")
      return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    if (["running", "paused"].includes(status))
      return <Loader2 className="w-4 h-4 animate-spin text-[#57886c]" />;
    if (status === "finished")
      return <CheckCircle2 className="w-4 h-4 text-[#57886c]" />;
    if (status === "failed")
      return <AlertCircle className="w-4 h-4 text-[#c0392b]" />;
    return null;
  };

  const statusLabel = (task: BankTaskState) => {
    if (task.status === "running")  return "Agent working…";
    if (task.status === "paused")   return "Waiting for login…";
    if (task.status === "finished") return `✓ ${task.transactions.length} transactions`;
    if (task.status === "failed")   return "Failed";
    return "Queued";
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 font-['Lexend']">
              🐷 Gather Statements
            </h2>
            <p className="text-sm text-gray-500">
              Browser Use will securely extract your transactions
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Select banks */}
        {step === "select" && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Select which banks to import from. You'll log in to each one —{" "}
              <strong>we never see your credentials.</strong>
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SUPPORTED_BANKS.map(bank => (
                <button
                  key={bank.id}
                  onClick={() => toggleBank(bank.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                    ${bank.id === "__demo__" ? "col-span-2" : ""}
                    ${selectedBanks.includes(bank.id)
                      ? "border-[#57886c] bg-[#57886c]/10"
                      : bank.id === "__demo__"
                        ? "border-dashed border-[#b0b0b0] hover:border-[#57886c]/50"
                        : "border-[#e0e0e0] hover:border-[#57886c]/50"
                    }`}
                >
                  <span className="text-2xl">{bank.logo}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-700 font-['Lexend']">
                      {bank.name}
                    </span>
                    {bank.id === "__demo__" && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Test the full flow safely — no real credentials
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#fbbf24]/10 rounded-xl p-3 text-xs text-gray-600 border border-[#fbbf24]/30">
              ⚡ A live browser window opens for each bank. Log in yourself — the AI then
              navigates, downloads the PDF, and extracts your transactions automatically.
            </div>

            <button
              onClick={startGathering}
              disabled={selectedBanks.length === 0}
              className="w-full py-3 rounded-xl bg-[#57886c] text-white font-semibold
                         hover:bg-[#466060] disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors font-['Lexend']"
            >
              Start Gathering ({selectedBanks.length} bank{selectedBanks.length !== 1 ? "s" : ""})
            </button>
          </div>
        )}

        {/* Running */}
        {step === "running" && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Processing one bank at a time.{" "}
              <strong>Open the live browser link and log in — the agent continues automatically.</strong>
            </p>

            {activeLiveUrl && (
              <a
                href={activeLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-[#57886c]/10 border border-[#57886c]/30
                           rounded-xl text-[#57886c] text-sm font-medium hover:bg-[#57886c]/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Live Browser → Log in here
              </a>
            )}

            <div className="space-y-2">
              {bankTasks.map(task => (
                <div
                  key={task.bank}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#e0e0e0] bg-[#f5f5f0]"
                >
                  <div className="flex items-center gap-3">
                    {statusIcon(task.status)}
                    <span className="text-sm font-medium text-gray-700 capitalize font-['Lexend']">
                      {task.bank === "__demo__" ? "Demo Bank" : task.bank}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{statusLabel(task)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="p-6 space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🐷</div>
              <h3 className="text-lg font-semibold text-gray-800 font-['Lexend']">All done!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Found <strong>{allTransactions.length}</strong> transactions
                across {bankTasks.filter(t => t.status === "finished").length} bank
                {bankTasks.filter(t => t.status === "finished").length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-2">
              {bankTasks.map(task => (
                <div
                  key={task.bank}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f5f5f0]"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(task.status)}
                    <span className="text-sm capitalize font-['Lexend']">
                      {task.bank === "__demo__" ? "Demo Bank" : task.bank}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {task.status === "finished"
                      ? `${task.transactions.length} transactions`
                      : task.error || "Failed"}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-[#57886c] text-white font-semibold
                         hover:bg-[#466060] transition-colors font-['Lexend']"
            >
              Save & Go to Dashboard →
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              Discard and close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
