/* =========================================================
   AI FINANCIAL ASSISTANT (Module 20)
   Interactive Q&A, Anomaly Detection, Savings Optimization
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise } from '../../utils/currency';
import {
  Bot,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Send,
  MessageSquare,
  DollarSign,
  PieChart,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionNote?: string;
}

export const AiAdvisorPage: React.FC = () => {
  const { family, transactions, categories, budget, accounts, savingsGoals } = useFamilyFinance();

  const totalIncomePaise = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensePaise = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavingsPaise = Math.max(0, totalIncomePaise - totalExpensePaise);

  // Top spending category
  const categorySpending = categories.map(cat => {
    const spent = transactions
      .filter(t => t.category_id === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...cat, spent };
  }).sort((a, b) => b.spent - a.spent);

  const topCategory = categorySpending[0] || { name: 'Food & Groceries', spent: 1765000 };

  const [inputQuery, setInputQuery] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `Hello Arun! I'm your Family Finance Sync AI Advisor. I continuously analyze ${family.name}'s income (${formatPaise(totalIncomePaise)}), monthly burn (${formatPaise(totalExpensePaise)}), and debt obligations. How can I assist your family today?`,
      timestamp: 'Just now',
    },
  ]);

  const presetQueries = [
    'Where did my money go?',
    'Why did expenses increase this month?',
    'How much can I save this month?',
    'Which category is consuming the most money?',
  ];

  const generateAiAnswer = (query: string): { text: string; actionNote?: string } => {
    const q = query.toLowerCase();

    if (q.includes('where') || q.includes('go')) {
      return {
        text: `Your family has spent ${formatPaise(totalExpensePaise)} this cycle. Top allocation is **${topCategory.name}** at ${formatPaise(topCategory.spent)} (${Math.round((topCategory.spent / totalExpensePaise) * 100)}% of total burn), followed by Rent (${formatPaise(2000000)}) and Transport (${formatPaise(850000)}).`,
        actionNote: 'Tip: 4 discretionary dining transactions account for 42% of grocery outlays.',
      };
    } else if (q.includes('increase') || q.includes('why')) {
      return {
        text: `Expenses increased by +3.2% primarily due to the start of the school term (School fees: ₹7,000 and ₹3,250 project supplies) plus organic supermarket bulk orders on 5 & 14 September.`,
        actionNote: 'Anomaly Flag: Education expenses are seasonal and will normalize next cycle.',
      };
    } else if (q.includes('how much') || q.includes('save')) {
      return {
        text: `Current net liquid surplus is **${formatPaise(totalSavingsPaise)}** (${Math.round((totalSavingsPaise / totalIncomePaise) * 100)}% retention rate). If you cap dining at ₹2,500 for the remainder of September, you can achieve an end-of-month surplus of **${formatPaise(totalSavingsPaise + 250000)}**.`,
        actionNote: 'Recommended Action: Sweep ₹20,000 surplus into high-yield emergency FD on 30 Sep.',
      };
    } else if (q.includes('category') || q.includes('most')) {
      return {
        text: `**${topCategory.name}** is currently consuming the most capital at ${formatPaise(topCategory.spent)} out of the allocated ₹18,000 cap (${Math.round((topCategory.spent / 1800000) * 100)}% consumed).`,
        actionNote: 'Alert: Food & Groceries is nearing its 90% critical threshold.',
      };
    } else {
      return {
        text: `Based on your multi-tenant financial telemetry, your family maintains a healthy ${Math.round((totalSavingsPaise / totalIncomePaise) * 100)}% savings rate across 4 verified accounts with ${formatPaise(accounts.reduce((s, a) => s + a.balance, 0))} in consolidated liquidity.`,
        actionNote: 'Proactive Insight: Recurring utility bills total ₹44,700 monthly.',
      };
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    const aiRes = generateAiAnswer(text);
    const aiMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      sender: 'ai',
      text: aiRes.text,
      timestamp: 'Just now',
      actionNote: aiRes.actionNote,
    };

    setChatLog(prev => [...prev, userMsg, aiMsg]);
    setInputQuery('');
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-icon-wrap" style={{ width: 44, height: 44 }}>
            <Bot size={24} color="var(--mint-primary)" />
          </div>
          <div>
            <h1>AI Family Financial Advisor</h1>
            <p style={{ fontSize: '0.88rem', marginTop: '0.2rem' }}>
              Autonomous ledger pattern recognition, anomaly detection, and interactive wealth intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {presetQueries.map((pq, idx) => (
          <button
            key={idx}
            className="btn btn-secondary btn-sm"
            onClick={() => handleSend(pq)}
            style={{ borderRadius: '9999px', fontSize: '0.78rem' }}
          >
            <Sparkles size={12} color="var(--mint-primary)" />
            {pq}
          </button>
        ))}
      </div>

      {/* Interactive Chat Window Card */}
      <div className="card" style={{ flex: 1, minHeight: '420px', display: 'flex', flexDirection: 'column', padding: '1.25rem 1.5rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
          {chatLog.map(msg => {
            const isAi = msg.sender === 'ai';

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isAi ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    background: isAi ? 'var(--bg-canvas-subtle)' : 'var(--card-dark)',
                    color: isAi ? 'var(--text-main)' : '#FFFFFF',
                    padding: '1rem 1.25rem',
                    borderRadius: isAi ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                    border: isAi ? '1px solid var(--border-subtle)' : 'none',
                    boxShadow: 'var(--shadow-sm)',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.72rem', color: isAi ? 'var(--mint-primary)' : 'var(--mint-light)', fontWeight: 700 }}>
                    {isAi ? <Bot size={13} /> : <MessageSquare size={13} />}
                    <span>{isAi ? 'SYNC AI ADVISOR' : 'YOU'}</span>
                  </div>

                  <p style={{ fontSize: '0.88rem', margin: 0 }}>
                    {msg.text}
                  </p>

                  {msg.actionNote && (
                    <div
                      style={{
                        marginTop: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '10px',
                        background: 'rgba(34, 160, 91, 0.12)',
                        border: '1px solid rgba(34, 160, 91, 0.25)',
                        color: 'var(--mint-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Lightbulb size={14} />
                      <span>{msg.actionNote}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}
        >
          <input
            type="text"
            className="input"
            placeholder="Ask anything about family spending, savings, or upcoming bills..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
