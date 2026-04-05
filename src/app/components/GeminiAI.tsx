import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, UploadCloud, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fileToBase64 } from '../utils/geminiFileUtils';
import { parseBankStatementPDF, sendGeminiChat, ChatMessage } from '../services/geminiService';

export interface DashboardData {
  income: number;
  spent: number;
  net: number;
  savingsRate: number;
  spendingByCategory: Record<string, number>;
  balanceOverTime: Record<string, number>;
}

const PIE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#b05878', '#57886c', '#8e8e8e'];

export const GeminiAIView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processPDF = async () => {
    if (!file) {
      setError("Please provide a PDF file.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const base64Data = await fileToBase64(file);
      const rawTxns = await parseBankStatementPDF(base64Data);
      
      const income = rawTxns.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
      const spent = rawTxns.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);
      const net = income - spent;
      const savingsRate = income > 0 ? (net / income) * 100 : 0;
      
      const spendingByCategory: Record<string, number> = {};
      rawTxns.filter(t => t.type === 'debit').forEach(t => {
         spendingByCategory[t.category || "Other"] = (spendingByCategory[t.category || "Other"] || 0) + t.amount;
      });

      setData({
        income, spent, net, savingsRate, spendingByCategory, balanceOverTime: { "Now": net }
      });
      
      // Auto-start a chat conversation with context
      setMessages([{
        role: 'model',
        parts: [{ text: "I've successfully parsed your bank statement! I found data on your Income, Net Savings, and Categories. Ask me anything about your finances." }]
      }]);
    } catch (err: any) {
      setError(err.message || 'Failed to process the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsChatLoading(true);
    try {
      const resp = await sendGeminiChat(messages, userMsg, 'immigrant');
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: resp }] }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '⚠️ Error: Could not reach Gemini.' }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Dashboard Section */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm p-6 w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#57886c]/10 rounded-full flex items-center justify-center text-[#57886c]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Gemini Statement Parser</h2>
            <p className="text-sm text-[#5a5a5a]">Upload your bank statement PDF to extract key financial data instantly.</p>
          </div>
        </div>



        {error && (
          <div className="mb-6 p-4 bg-[#c0392b]/10 border border-[#c0392b]/20 rounded-xl text-sm text-[#c0392b]">
            {error}
          </div>
        )}

        {!data ? (
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
            <div className="w-full border-2 border-dashed border-[#e0e0e0] rounded-xl p-8 flex flex-col items-center justify-center hover:bg-[#f5f5f0] transition-colors cursor-pointer relative mb-6">
              <input 
                type="file" 
                accept="application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-[#5a5a5a] mb-4" />
              <p className="text-sm font-medium mb-1">{file ? file.name : "Click or drag PDF statement here"}</p>
            </div>
            <button
              onClick={processPDF}
              disabled={!file || isProcessing}
              className="w-full bg-[#57886c] text-white px-6 py-3 rounded-lg hover:bg-[#466060] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <>Extract Finances <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-[#e0e0e0] rounded-xl p-4">
                <div className="text-xs text-[#5a5a5a] mb-1">Income</div>
                <div className="text-2xl font-semibold text-[#57886c]">${data.income.toLocaleString()}</div>
              </div>
              <div className="border border-[#e0e0e0] rounded-xl p-4">
                <div className="text-xs text-[#5a5a5a] mb-1">Spent</div>
                <div className="text-2xl font-semibold text-[#c0392b]">${data.spent.toLocaleString()}</div>
              </div>
              <div className="border border-[#e0e0e0] rounded-xl p-4">
                <div className="text-xs text-[#5a5a5a] mb-1">Net</div>
                <div className="text-2xl font-semibold">${data.net.toLocaleString()}</div>
              </div>
              <div className="border border-[#e0e0e0] rounded-xl p-4">
                <div className="text-xs text-[#5a5a5a] mb-1">Savings Rate</div>
                <div className="text-2xl font-semibold text-[#fcc82d]">{data.savingsRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[#e0e0e0] rounded-xl p-4 h-[250px] flex flex-col">
                <h3 className="text-sm font-semibold mb-2">Spending by Category</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(data.spendingByCategory).map(([name, value]) => ({ name, value }))}
                        cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value"
                      >
                        {Object.keys(data.spendingByCategory).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-[#e0e0e0] rounded-xl p-4 h-[250px] flex flex-col">
                <h3 className="text-sm font-semibold mb-2">Balance Over Time</h3>
                <div className="flex-1 flex items-end gap-2 relative pl-8 pb-4 mt-4">
                  <div className="absolute left-0 top-0 bottom-4 w-6 flex flex-col justify-between text-[10px] text-[#5a5a5a]">
                    <span>$16k</span><span>$8k</span><span>$0k</span>
                  </div>
                  {Object.entries(data.balanceOverTime).map(([month, amount]) => (
                    <div key={month} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div 
                        className="w-full max-w-[16px] bg-[#57886c] rounded-t-sm" 
                        style={{ height: `${Math.min((amount / 16000) * 100, 100)}%` }} 
                        title={`$${amount}`} 
                      />
                      <span className="text-[10px] text-[#5a5a5a] mt-2 absolute -bottom-2">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => setData(null)} className="self-start text-xs text-[#57886c] hover:underline">
              Reset & Upload Another
            </button>
          </div>
        )}
      </div>

      {/* Chatbox Section */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm overflow-hidden w-full flex flex-col h-[400px]">
        <div className="bg-[#1a1a1a] p-4 flex items-center gap-3">
          <Bot className="w-5 h-5 text-white" />
          <h3 className="text-white font-medium text-sm">Ask Gemini About Your Finances</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f9f9f9]">
          {messages.length === 0 && (
            <div className="text-center text-[#5a5a5a] text-sm mt-8">
              No messages yet. I can analyze your upload above or answer general finance questions!
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#57886c]' : 'bg-[#1a1a1a]'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'user' ? 'bg-[#57886c] text-white rounded-tr-none' : 'bg-white border border-[#e0e0e0] text-[#1a1a1a] rounded-tl-none'
              }`}>
                {msg.parts[0].text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex gap-3 max-w-[85%] self-start">
              <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>
              <div className="p-3 bg-white border border-[#e0e0e0] rounded-2xl rounded-tl-none flex items-center shadow-sm">
                <Loader2 className="w-4 h-4 text-[#5a5a5a] animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-3 bg-white border-t border-[#e0e0e0] flex items-center">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            placeholder={"Ask something brutal..."}
            disabled={isChatLoading}
            className="flex-1 bg-[#f5f5f0] border border-[#e0e0e0] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#57886c] disabled:opacity-50 mr-2"
          />
          <button
            onClick={handleSendChat}
            disabled={!chatInput.trim() || isChatLoading}
            className="w-10 h-10 bg-[#57886c] text-white rounded-full flex items-center justify-center hover:bg-[#466060] transition-colors disabled:bg-[#e0e0e0] shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
