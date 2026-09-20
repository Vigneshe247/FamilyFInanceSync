/* =========================================================
   FUTURE INNOVATION: SMART RECEIPT OCR SCANNER (Section 31)
   ========================================================= */

import React, { useState } from 'react';
import { useFamilyFinance } from '../../context/FamilyFinanceContext';
import { formatPaise, rupeesToPaise } from '../../utils/currency';
import {
  ScanLine,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ReceiptOcrPageProps {
  onTransactionCreated?: () => void;
}

export const ReceiptOcrPage: React.FC<ReceiptOcrPageProps> = ({ onTransactionCreated }) => {
  const { categories, accounts, currentMember, addTransaction } = useFamilyFinance();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    merchant: string;
    amountRupees: string;
    date: string;
    categoryId: string;
    confidence: number;
  } | null>(null);

  const [confirmed, setConfirmed] = useState(false);

  const handleSimulateUpload = () => {
    setIsScanning(true);
    setScannedResult(null);
    setConfirmed(false);

    setTimeout(() => {
      setIsScanning(false);
      setScannedResult({
        merchant: 'Nature Basket Organic Groceries',
        amountRupees: '2450',
        date: new Date().toISOString().slice(0, 10),
        categoryId: 'cat-food',
        confidence: 98.4,
      });
    }, 1200);
  };

  const handleConfirmAndRecord = () => {
    if (!scannedResult) return;

    addTransaction({
      user_id: currentMember.user_id,
      account_id: accounts[0]?.id || 'acc-hdfc',
      category_id: scannedResult.categoryId,
      type: 'expense',
      amount: rupeesToPaise(scannedResult.amountRupees),
      description: `Receipt OCR: ${scannedResult.merchant}`,
      transaction_date: new Date().toISOString(),
      payment_method: 'Smart Receipt Scanner',
      is_shared: true,
      status: 'cleared',
    });

    setConfirmed(true);
    if (onTransactionCreated) {
      setTimeout(onTransactionCreated, 1000);
    }
  };

  return (
    <div className="content-page">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="brand-icon-wrap" style={{ width: 40, height: 40 }}>
            <ScanLine size={22} color="var(--amber)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--ink)' }}>
              Smart Receipt OCR Scanner
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
              Future-ready automated slip digestion • Optical character recognition pipeline (Section 31)
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        {/* Upload Box */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Upload Paper or Digital Receipt</div>
              <div className="card-subtitle">Drag & drop receipt photo or bill PDF</div>
            </div>
          </div>

          <div
            onClick={handleSimulateUpload}
            style={{
              border: '2px dashed var(--line-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'var(--paper-dim)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brass)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
          >
            {isScanning ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <RefreshCw size={36} color="var(--brass)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  Extracting Merchant, Date & Currency via Neural OCR...
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Running bounding box recognition on receipt lines
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <UploadCloud size={42} color="var(--brass)" />
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                  Click to Test Instant OCR Receipt Extraction
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                  Supports JPEG, PNG, HEIC photos & GST tax invoices
                </div>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                  Select Sample Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* OCR Result Preview */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Extracted Transaction Draft</div>
              <div className="card-subtitle">Review and confirm parsed bill data</div>
            </div>
            {scannedResult && (
              <span className="badge badge-sage">
                <Sparkles size={12} /> {scannedResult.confidence}% CONFIDENCE
              </span>
            )}
          </div>

          {!scannedResult && !isScanning ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--ink-muted)' }}>
              <FileText size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 600 }}>No receipt scanned yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Click the upload area on the left to simulate automated invoice processing.
              </p>
            </div>
          ) : scannedResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Detected Merchant</label>
                <input
                  type="text"
                  className="input"
                  value={scannedResult.merchant}
                  onChange={e => setScannedResult({ ...scannedResult, merchant: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Detected Amount (₹ INR)</label>
                  <input
                    type="number"
                    className="input"
                    value={scannedResult.amountRupees}
                    onChange={e => setScannedResult({ ...scannedResult, amountRupees: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Transaction Date</label>
                  <input
                    type="date"
                    className="input"
                    value={scannedResult.date}
                    onChange={e => setScannedResult({ ...scannedResult, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Assigned Category</label>
                <select
                  className="select"
                  value={scannedResult.categoryId}
                  onChange={e => setScannedResult({ ...scannedResult, categoryId: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {confirmed ? (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--sage-light)',
                    color: 'var(--sage)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Transaction saved to family ledger successfully!</span>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handleConfirmAndRecord}
                >
                  <CheckCircle2 size={16} /> Confirm & Insert into Family Ledger
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
