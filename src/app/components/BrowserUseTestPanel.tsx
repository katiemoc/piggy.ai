import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import {
  createSessionLaunchTest,
  createDemoLoginTask,
  pollUntilDone,
  stopTask,
  ingestCSVString,
  saveTransactionsToStorage,
  SAMPLE_CSV,
} from "../services/browserUseService";

type StepStatus = "idle" | "running" | "pass" | "fail";

interface StepState {
  status: StepStatus;
  detail: string;
  liveUrl?: string;
}

const INIT: StepState = { status: "idle", detail: "" };

export function BrowserUseTestPanel() {
  const [steps, setSteps] = useState({
    launch:   { ...INIT },
    login:    { ...INIT },
    download: { ...INIT },
    ingest:   { ...INIT },
  });

  const set = (key: keyof typeof steps, patch: Partial<StepState>) =>
    setSteps((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  // ── Step 1: Session launch only ──────────────────────────────────────────
  async function testSessionLaunch() {
    set("launch", { status: "running", detail: "Creating session…" });
    let taskId: string | undefined;
    try {
      taskId = await createSessionLaunchTest();
      set("launch", { detail: `Session created: ${taskId}` });

      await pollUntilDone(taskId, (s) => {
        set("launch", { detail: `Status: ${s.status}`, liveUrl: s.liveUrl });
      });

      set("launch", { status: "pass", detail: "Session launched, navigated, and closed cleanly ✓" });
    } catch (err: any) {
      if (taskId) stopTask(taskId);
      set("launch", { status: "fail", detail: err.message });
    }
  }

  // ── Steps 2–4: Login → navigate → download (public test site) ───────────
  async function testLoginAndDownload() {
    set("login",    { status: "running", detail: "Launching demo login task…" });
    set("download", { status: "running", detail: "Waiting for download step…" });
    let taskId: string | undefined;
    try {
      taskId = await createDemoLoginTask();

      const final = await pollUntilDone(taskId, (s) => {
        set("login",    { detail: `Browser status: ${s.status}`, liveUrl: s.liveUrl });
        set("download", { detail: `Browser status: ${s.status}`, liveUrl: s.liveUrl });
      });

      set("login",    { status: "pass", detail: "Login + post-login navigation confirmed ✓" });
      set("download", {
        status: final.output?.includes(",") ? "pass" : "fail",
        detail: final.output
          ? `File content captured (${final.output.length} chars) ✓`
          : "No output returned — download may have failed",
      });
    } catch (err: any) {
      if (taskId) stopTask(taskId);
      set("login",    { status: "fail", detail: err.message });
      set("download", { status: "fail", detail: err.message });
    }
  }

  // ── Step 5: CSV ingestion only (no BrowserUse) ───────────────────────────
  function testIngestion() {
    set("ingest", { status: "running", detail: "Parsing sample CSV…" });
    try {
      const txns = ingestCSVString(SAMPLE_CSV);
      saveTransactionsToStorage(txns);
      set("ingest", {
        status: "pass",
        detail: `Parsed and saved ${txns.length} transactions to localStorage ✓`,
      });
    } catch (err: any) {
      set("ingest", { status: "fail", detail: err.message });
    }
  }

  return (
    <div className="p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl mb-1">BrowserUse Integration Tests</h2>
      <p className="text-sm text-[#5a5a5a] mb-6">
        Run each step independently to validate the pipeline without touching a real bank account.
      </p>

      <div className="flex flex-col gap-4">
        <TestStep
          number={1}
          title="Session Launch"
          description="Verifies the BrowserUse API key works and a session can be created and polled."
          state={steps.launch}
          onRun={testSessionLaunch}
        />
        <TestStep
          number="2–4"
          title="Login → Navigate → Download"
          description={`Uses the public test site the-internet.herokuapp.com with shared demo credentials (tomsmith / SuperSecretPassword!). No real account.`}
          state={steps.login}
          secondState={steps.download}
          onRun={testLoginAndDownload}
        />
        <TestStep
          number={5}
          title="CSV Ingestion"
          description="Feeds hardcoded sample CSV through the full parse + save pipeline. No browser session needed."
          state={steps.ingest}
          onRun={testIngestion}
        />
      </div>

      <div className="mt-6 p-4 bg-[#f5f5f0] rounded-lg text-xs text-[#5a5a5a]">
        <strong>Safe test credentials</strong> — the-internet.herokuapp.com is a public automation sandbox.
        Username: <code>tomsmith</code> · Password: <code>SuperSecretPassword!</code>
      </div>
    </div>
  );
}

function TestStep({
  number, title, description, state, secondState, onRun,
}: {
  number: number | string;
  title: string;
  description: string;
  state: StepState;
  secondState?: StepState;
  onRun: () => void;
}) {
  const isRunning = state.status === "running" || secondState?.status === "running";

  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-[#5a5a5a] bg-[#f5f5f0] px-2 py-0.5 rounded-full">Step {number}</span>
            <span className="text-sm font-medium">{title}</span>
            <StatusIcon status={state.status} />
          </div>
          <p className="text-xs text-[#5a5a5a] mb-3">{description}</p>

          {state.detail && (
            <p className={`text-xs mb-1 ${state.status === "fail" ? "text-[#c0392b]" : "text-[#57886c]"}`}>
              {state.detail}
            </p>
          )}
          {secondState?.detail && secondState.detail !== state.detail && (
            <p className={`text-xs mb-1 ${secondState.status === "fail" ? "text-[#c0392b]" : "text-[#57886c]"}`}>
              Download: {secondState.detail}
            </p>
          )}
          {state.liveUrl && (
            <a href={state.liveUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#57886c] flex items-center gap-1 mt-1">
              <ExternalLink className="w-3 h-3" /> Open live browser
            </a>
          )}
        </div>

        <button
          onClick={onRun}
          disabled={isRunning}
          className="shrink-0 px-4 py-2 bg-[#57886c] text-white text-sm rounded-lg hover:bg-[#466060] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isRunning ? "Running…" : "Run"}
        </button>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-[#57886c]" />;
  if (status === "fail") return <AlertCircle className="w-4 h-4 text-[#c0392b]" />;
  if (status === "running") return <Loader2 className="w-4 h-4 animate-spin text-[#57886c]" />;
  return null;
}
