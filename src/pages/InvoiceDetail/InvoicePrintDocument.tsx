// Print / PDF invoice template — intentionally Czech-only (legal/tax-document wording).
// Self-contained design: scoped `.pf-` classes + hardcoded palette so the output is
// deterministic regardless of theme/dark-mode and safe for html2canvas (no oklch/tokens).
import { useEffect, useState, type RefObject } from 'react';
import QRCode from 'qrcode';
import type { CompanyResponseDto, ContactSnapshotDto, InvoiceResponseDto } from '@/api/model';
import { formatDate, formatMoney } from './utils';
import { toNumber } from '@/pages/UpdateInvoice/useUpdateInvoiceForm';

interface InvoicePrintDocumentProps {
  invoice: InvoiceResponseDto;
  company?: CompanyResponseDto;
  invoiceRef: RefObject<HTMLDivElement | null>;
}

interface Party {
  name: string;
  ico?: string;
  dic?: string;
  address: string[];
}

const companyToParty = (company?: CompanyResponseDto): Party => {
  const houseLine = [company?.houseNumber, company?.orientationNumber]
    .filter(Boolean)
    .join('/');
  const line1 = [company?.street, houseLine].filter(Boolean).join(' ');
  const line2 = [company?.psc, company?.city].filter(Boolean).join(' ');
  const country =
    company?.country && company.country.toUpperCase() !== 'CZ' ? company.country : undefined;
  return {
    name: company?.companyName || company?.name || '—',
    ico: company?.ico,
    dic: company?.dic,
    address: [line1, line2, country].filter(Boolean) as string[],
  };
};

const contactToParty = (contact?: ContactSnapshotDto): Party => {
  const line1 = contact?.street;
  const line2 = [contact?.psc, contact?.city].filter(Boolean).join(' ');
  const country =
    contact?.country && contact.country.toUpperCase() !== 'CZ' ? contact.country : undefined;
  return {
    name: contact?.name || '—',
    ico: contact?.ico,
    dic: contact?.dic,
    address: [line1, line2, country].filter(Boolean) as string[],
  };
};

// CZ "QR Platba" SPAYD payload — only built when we have an IBAN + amount to charge.
const buildSpayd = (invoice: InvoiceResponseDto): string | null => {
  const iban = invoice.bankAccount?.iban?.replace(/\s+/g, '').toUpperCase();
  const amount = toNumber(invoice.totalWithTax);
  if (!iban || amount <= 0) return null;

  const swift = invoice.bankAccount?.swift?.replace(/\s+/g, '').toUpperCase();
  const acc = swift ? `${iban}+${swift}` : iban;
  const vs = (invoice.variableSymbol || invoice.number || '').replace(/\D/g, '');
  const msg = `FAKTURA ${invoice.number ?? ''}`.trim().slice(0, 60);

  const fields = [
    'SPD*1.0',
    `ACC:${acc}`,
    `AM:${amount.toFixed(2)}`,
    `CC:${invoice.currency || 'CZK'}`,
    vs && `X-VS:${vs}`,
    `MSG:${msg}`,
  ].filter(Boolean);
  return fields.join('*');
};

const Row = ({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  accent?: boolean;
}) => (
  <div className="pf-row">
    <span className="k">{label}</span>
    <span className={`v${mono ? ' tnum' : ''}${accent ? ' accent' : ''}`}>{value || '—'}</span>
  </div>
);

export const InvoicePrintDocument = ({
  invoice,
  company,
  invoiceRef,
}: InvoicePrintDocumentProps) => {
  const currency = invoice.currency || 'CZK';
  const isReceived = invoice.type === 'RECEIVED';

  // The party that issued the document goes top-left + masthead; the recipient top-right.
  const supplier = isReceived ? contactToParty(invoice.contactSnapshot) : companyToParty(company);
  const customer = isReceived ? companyToParty(company) : contactToParty(invoice.contactSnapshot);

  const bank = invoice.bankAccount;
  const variableSymbol = invoice.variableSymbol || invoice.number;

  // VAT recapitulation per rate (basis + tax), mirroring the on-screen detail table.
  const recapMap = new Map<number, { base: number; vat: number }>();
  invoice.items.forEach((item) => {
    const rate = toNumber(item.vatRate);
    const base = toNumber(item.quantity) * toNumber(item.unitPrice);
    const entry = recapMap.get(rate) ?? { base: 0, vat: 0 };
    entry.base += base;
    entry.vat += base * (rate / 100);
    recapMap.set(rate, entry);
  });
  const recap = [...recapMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, value]) => ({ rate, ...value }));
  const hasVat = toNumber(invoice.totalTax) > 0;

  const paidAmount = (invoice.payments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const fullyPaid = paidAmount > 0 && paidAmount + 0.01 >= toNumber(invoice.totalWithTax);
  const lastPaymentDate = (invoice.payments ?? [])
    .map((p) => p.paymentDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const spayd = buildSpayd(invoice);
  useEffect(() => {
    let active = true;
    if (!spayd) {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(spayd, { margin: 0, width: 256, errorCorrectionLevel: 'M' })
      .then((url) => active && setQrUrl(url))
      .catch(() => active && setQrUrl(null));
    return () => {
      active = false;
    };
  }, [spayd]);

  return (
    <div
      id="invoice-print-root"
      ref={invoiceRef}
      className="fixed left-[-99999px] top-0 w-[210mm] bg-white print:static print:left-0 print:w-full"
    >
      <div className="invoice-sheet pf-root">
        <style>{PF_CSS}</style>

        {/* Masthead */}
        <div className="pf-mast">
          <div className="pf-brand">
            <div className="pf-mark" />
            <div>
              <div className="pf-nm">{supplier.name}</div>
              {company?.description && !isReceived && (
                <div className="pf-tg">{company.description}</div>
              )}
            </div>
          </div>
          <div className="pf-title">
            <h1>
              Faktura <span className="pf-num tnum">{invoice.number || ''}</span>
            </h1>
            {hasVat && <div className="pf-kind">Daňový doklad</div>}
          </div>
        </div>
        <hr className="pf-rule" />

        {/* Parties */}
        <div className="pf-parties">
          <div className="pf-party">
            <div className="pf-anno">Dodavatel</div>
            <div className="pf-name">{supplier.name}</div>
            <div className="pf-addr">
              {supplier.address.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="pf-kv">
              <Row label="IČO" value={supplier.ico} mono />
              <Row label="DIČ" value={supplier.dic} mono />
            </div>
            <div className="pf-kv spaced">
              <Row label="Bankovní účet" value={bank?.number} mono />
              {bank?.iban && <Row label="IBAN" value={bank.iban} mono />}
              <Row label="Variabilní symbol" value={variableSymbol} mono accent />
              <Row label="Způsob platby" value="Převodem" />
            </div>
          </div>
          <div className="pf-party">
            <div className="pf-anno">Odběratel</div>
            <div className="pf-name">{customer.name}</div>
            <div className="pf-addr">
              {customer.address.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="pf-kv">
              <Row label="IČO" value={customer.ico} mono />
              <Row label="DIČ" value={customer.dic} mono />
            </div>
            <div className="pf-kv spaced">
              <Row label="Datum vystavení" value={formatDate(invoice.createdDate)} mono />
              <Row label="Datum splatnosti" value={formatDate(invoice.dueDate)} mono />
              {hasVat && <Row label="Datum zdan. plnění" value={formatDate(invoice.duzpDate)} mono />}
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="pf-items">
          <thead>
            <tr>
              <th className="l">Označení dodávky</th>
              <th>Množství</th>
              {hasVat && <th>DPH</th>}
              <th>Cena za MJ</th>
              <th>{hasVat ? 'Celkem bez DPH' : 'Celkem'}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => {
              const quantity = toNumber(item.quantity);
              const base = quantity * toNumber(item.unitPrice);
              return (
                <tr key={item.id ?? `${item.name}-${i}`}>
                  <td className="l desc">{item.name}</td>
                  <td className="tnum">
                    {quantity}
                    {item.unit ? ` ${item.unit}` : ''}
                  </td>
                  {hasVat && <td className="tnum">{toNumber(item.vatRate)} %</td>}
                  <td className="tnum">{formatMoney(item.unitPrice, currency)}</td>
                  <td className="tnum amt">{formatMoney(base, currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Lower: QR + recap */}
        <div className="pf-lower">
          <div className="pf-qrwrap">
            {qrUrl ? (
              <>
                <div className="pf-qr">
                  <img src={qrUrl} alt="QR Platba" />
                </div>
                <div className="pf-qr-cap pf-anno">QR Platba</div>
              </>
            ) : (
              <div className="pf-qr placeholder">
                <span>QR Platba</span>
              </div>
            )}
          </div>
          <div className="pf-recap">
            {hasVat && (
              <table>
                <thead>
                  <tr>
                    <th className="l">Sazba</th>
                    <th>Základ</th>
                    <th>DPH</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.map((r) => (
                    <tr key={r.rate}>
                      <td className="l">{r.rate} %</td>
                      <td className="tnum">{formatMoney(r.base, currency)}</td>
                      <td className="tnum">{formatMoney(r.vat, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="pf-total">
              <span className="t">Celkem k úhradě</span>
              <span className="a tnum">{formatMoney(invoice.totalWithTax, currency)}</span>
            </div>
            {fullyPaid && (
              <div className="pf-paidwrap">
                <span className="pf-chip">
                  <span className="dot" /> Uhrazeno{' '}
                  {lastPaymentDate ? formatDate(lastPaymentDate) : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {invoice.note && (
          <div className="pf-note">
            <div className="pf-anno">Poznámka</div>
            <div className="pf-body">{invoice.note}</div>
          </div>
        )}

        {/* Footer */}
        <div className="pf-foot">
          <div className="pf-legal">
            {hasVat
              ? 'Daňový doklad dle zákona č. 235/2004 Sb., o DPH. '
              : ''}
            Vystaveno elektronicky, platné i bez podpisu a razítka.
          </div>
        </div>
      </div>
    </div>
  );
};

const PF_CSS = `
.pf-root {
  --paper:#ffffff; --ink:#1c1b1a; --ink-2:#45433f; --ink-3:#74716c; --ink-4:#a8a59f;
  --line:#d9d6d0; --line-2:#eae7e1; --accent:#466dc8;
  --pos:#1f8a4c; --pos-soft:#e8f6ee;
  width:100%; min-height:297mm; background:var(--paper); color:var(--ink);
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif; padding:16mm 16mm 12mm;
  display:flex; flex-direction:column; box-sizing:border-box;
}
.pf-root * { box-sizing:border-box; }
.pf-root .tnum { font-variant-numeric:tabular-nums; font-feature-settings:'tnum','lnum'; letter-spacing:-0.01em; }
.pf-anno { font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-4); }

.pf-mast { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.pf-brand { display:flex; align-items:center; gap:11px; }
.pf-mark { width:30px; height:30px; border-radius:6px; background:var(--accent); flex-shrink:0; }
.pf-nm { font-size:14px; font-weight:700; letter-spacing:-0.01em; }
.pf-tg { font-size:11px; color:var(--ink-3); margin-top:1px; }
.pf-title { text-align:right; }
.pf-title h1 { margin:0; font-size:27px; font-weight:700; letter-spacing:-0.02em; line-height:1.05; }
.pf-title h1 .pf-num { color:var(--accent); }
.pf-kind { font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-3); margin-top:8px; }
.pf-rule { border:none; border-top:1px dashed var(--line); margin:16px 0 0; }

.pf-parties { display:grid; grid-template-columns:1fr 1fr; margin-top:26px; }
.pf-party { padding-right:36px; }
.pf-party + .pf-party { padding-left:36px; padding-right:0; border-left:1px dashed var(--line); }
.pf-name { font-size:16px; font-weight:700; letter-spacing:-0.01em; margin-top:10px; }
.pf-addr { font-size:13px; color:var(--ink-3); line-height:1.6; margin-top:4px; }
.pf-kv { margin-top:18px; }
.pf-kv.spaced { margin-top:18px; padding-top:14px; border-top:1px dashed var(--line-2); }
.pf-row { display:flex; justify-content:space-between; align-items:baseline; padding:4px 0; font-size:13px; gap:16px; }
.pf-row .k { color:var(--ink-3); white-space:nowrap; }
.pf-row .v { font-weight:600; color:var(--ink); text-align:right; }
.pf-row .v.accent { color:var(--accent); }

.pf-items { width:100%; border-collapse:collapse; margin-top:30px; }
.pf-items thead th { font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-4); text-align:right; padding:0 0 10px; border-bottom:1px solid var(--ink); }
.pf-items thead th.l { text-align:left; }
.pf-items tbody td { font-size:13.5px; padding:13px 0; border-bottom:1px dashed var(--line); text-align:right; color:var(--ink-2); vertical-align:top; }
.pf-items tbody td.l { text-align:left; }
.pf-items tbody td.desc { font-weight:600; color:var(--ink); }
.pf-items tbody td.amt { font-weight:600; color:var(--ink); }

.pf-lower { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:30px; align-items:start; }
.pf-qrwrap { display:flex; flex-direction:column; align-items:flex-start; }
.pf-qr { width:118px; height:118px; border:1px dashed var(--line); border-radius:6px; padding:9px; background:#fff; }
.pf-qr img { display:block; width:100%; height:100%; }
.pf-qr.placeholder { display:flex; align-items:center; justify-content:center; font-size:10px; color:var(--ink-4); text-align:center; }
.pf-qr-cap { margin-top:9px; }
.pf-recap table { width:100%; border-collapse:collapse; }
.pf-recap th { font-family:ui-monospace,'Cascadia Code','Segoe UI Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-4); text-align:right; padding:0 0 10px; }
.pf-recap th.l { text-align:left; }
.pf-recap td { font-size:13.5px; text-align:right; color:var(--ink-2); padding:4px 0; }
.pf-recap td.l { text-align:left; color:var(--ink); font-weight:500; }
.pf-total { display:flex; justify-content:space-between; align-items:baseline; gap:18px; margin-top:14px; padding-top:15px; border-top:1px solid var(--ink); }
.pf-total .t { font-size:13px; color:var(--ink-3); white-space:nowrap; }
.pf-total .a { font-size:25px; font-weight:700; letter-spacing:-0.02em; color:var(--accent); }
.pf-paidwrap { display:flex; justify-content:flex-end; }
.pf-chip { display:inline-flex; align-items:center; gap:6px; margin-top:14px; padding:4px 11px; border-radius:999px; font-size:12px; font-weight:600; color:var(--pos); background:var(--pos-soft); }
.pf-chip .dot { width:6px; height:6px; border-radius:50%; background:var(--pos); }

.pf-note { margin-top:32px; max-width:80%; }
.pf-body { font-size:12px; color:var(--ink-3); line-height:1.65; margin-top:10px; white-space:pre-wrap; }
.pf-foot { margin-top:auto; padding-top:22px; }
.pf-legal { font-size:10.5px; color:var(--ink-4); line-height:1.7; border-top:1px dashed var(--line); padding-top:12px; }
`;
