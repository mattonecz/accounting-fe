// True vector PDF of the invoice (selectable, searchable text) via @react-pdf/renderer.
// Replaces the former html2canvas+jsPDF raster screenshot. Pure & portable: it takes a
// prepared model + optional QR image and renders — no hooks, no DOM, no i18n — so the
// same component runs on the NestJS backend (renderToBuffer/renderToStream).
//
// Layout mirrors the on-screen print template (design-F palette, Inter). react-pdf has
// no CSS grid, so two-column rows use flexDirection:'row' + width:'50%'. Sizes are pt
// (≈ px × 0.75). Fonts are registered separately via registerPdfFonts().
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { InvoicePdfModel } from './invoicePdfData';

const C = {
  ink: '#1c1b1a',
  ink2: '#45433f',
  ink3: '#74716c',
  ink4: '#a8a59f',
  line: '#d9d6d0',
  line2: '#eae7e1',
  accent: '#466dc8',
  pos: '#1f8a4c',
  posSoft: '#e8f6ee',
  paper: '#ffffff',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.paper,
    color: C.ink,
    fontFamily: 'Inter',
    fontSize: 9.75,
    lineHeight: 1.4,
    paddingTop: 46,
    paddingBottom: 34,
    paddingHorizontal: 46,
  },

  // Masthead
  mast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 4.5,
    backgroundColor: C.accent,
    marginRight: 8,
  },
  brandName: { fontSize: 10.5, fontWeight: 700 },
  tagline: { fontSize: 8.25, color: C.ink3, marginTop: 1 },
  titleWrap: { alignItems: 'flex-end' },
  h1: { fontSize: 20, fontWeight: 700 },
  h1Num: { color: C.accent },
  kind: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: C.ink3,
    marginTop: 6,
  },
  rule: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    borderStyle: 'dashed',
    marginTop: 12,
  },

  // Parties
  parties: { flexDirection: 'row', marginTop: 20 },
  partyLeft: { width: '50%', paddingRight: 27 },
  partyRight: {
    width: '50%',
    paddingLeft: 27,
    borderLeftWidth: 1,
    borderLeftColor: C.line,
    borderStyle: 'dashed',
  },
  anno: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.ink4,
  },
  partyName: { fontSize: 12, fontWeight: 700, marginTop: 7 },
  addr: { marginTop: 3 },
  addrLine: { fontSize: 9.75, color: C.ink3, lineHeight: 1.5 },
  kv: { marginTop: 13 },
  kvSpaced: {
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line2,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  rowK: { fontSize: 9.75, color: C.ink3 },
  rowV: { fontSize: 9.75, fontWeight: 600, color: C.ink, textAlign: 'right' },
  rowVAccent: { color: C.accent },

  // Items table
  itemsHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.ink,
    paddingBottom: 7,
    marginTop: 22,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    borderStyle: 'dashed',
    paddingVertical: 9,
  },
  th: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.ink4,
  },
  colDesc: { flexGrow: 1, flexShrink: 1, paddingRight: 8 },
  colQty: { width: 70, textAlign: 'right' },
  colVat: { width: 46, textAlign: 'right' },
  colUnit: { width: 82, textAlign: 'right' },
  colTotal: { width: 90, textAlign: 'right' },
  tdDesc: { fontSize: 10, fontWeight: 600, color: C.ink },
  tdNum: { fontSize: 10, color: C.ink2 },
  tdAmt: { fontSize: 10, fontWeight: 600, color: C.ink },

  // Lower: QR + recap
  lower: { flexDirection: 'row', marginTop: 22 },
  qrCol: { width: '50%' },
  recapCol: { width: '50%', paddingLeft: 30 },
  qrBox: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: 'dashed',
    borderRadius: 4.5,
    padding: 7,
  },
  qrImg: { width: '100%', height: '100%' },
  qrPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  qrPlaceholderText: { fontSize: 7.5, color: C.ink4 },
  qrCap: { marginTop: 7 },

  recapHead: { flexDirection: 'row', paddingBottom: 7 },
  recapRow: { flexDirection: 'row', paddingVertical: 2.5 },
  rcLabel: { flexGrow: 1 },
  rcCol: { width: 90, textAlign: 'right' },
  rcTdLabel: { fontSize: 10, color: C.ink, fontWeight: 500 },
  rcTdNum: { fontSize: 10, color: C.ink2, textAlign: 'right' },

  totalWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: C.ink,
  },
  totalLabel: { fontSize: 9.75, color: C.ink3 },
  totalAmount: { fontSize: 18.75, fontWeight: 700, color: C.accent },

  paidWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.posSoft,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.pos,
    marginRight: 5,
  },
  chipText: { fontSize: 9, fontWeight: 600, color: C.pos },

  // Note + footer
  note: { marginTop: 26, maxWidth: '80%' },
  noteBody: { fontSize: 9, color: C.ink3, lineHeight: 1.6, marginTop: 7 },
  foot: { marginTop: 'auto' },
  legal: {
    fontSize: 8,
    color: C.ink4,
    lineHeight: 1.6,
    borderTopWidth: 1,
    borderTopColor: C.line,
    borderStyle: 'dashed',
    paddingTop: 9,
    marginTop: 18,
  },
});

const InfoRow = ({
  label,
  value,
  accent,
}: {
  label: string;
  value?: string;
  accent?: boolean;
}) => (
  <View style={s.row}>
    <Text style={s.rowK}>{label}</Text>
    <Text style={accent ? [s.rowV, s.rowVAccent] : s.rowV}>{value || '—'}</Text>
  </View>
);

interface InvoicePdfDocumentProps {
  model: InvoicePdfModel;
  qrDataUrl?: string | null;
}

export const InvoicePdfDocument = ({
  model,
  qrDataUrl,
}: InvoicePdfDocumentProps) => {
  const { hasVat } = model;

  return (
    <Document title={`Faktura ${model.number}`}>
      <Page size="A4" style={s.page} wrap>
        {/* Masthead */}
        <View style={s.mast}>
          <View style={s.brand}>
            <View style={s.mark} />
            <View>
              <Text style={s.brandName}>{model.supplier.name}</Text>
              {model.supplierTagline ? (
                <Text style={s.tagline}>{model.supplierTagline}</Text>
              ) : null}
            </View>
          </View>
          <View style={s.titleWrap}>
            <Text style={s.h1}>
              Faktura <Text style={s.h1Num}>{model.number}</Text>
            </Text>
            {hasVat ? <Text style={s.kind}>Daňový doklad</Text> : null}
          </View>
        </View>
        <View style={s.rule} />

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyLeft}>
            <Text style={s.anno}>Dodavatel</Text>
            <Text style={s.partyName}>{model.supplier.name}</Text>
            <View style={s.addr}>
              {model.supplier.address.map((line, i) => (
                <Text key={i} style={s.addrLine}>
                  {line}
                </Text>
              ))}
            </View>
            <View style={s.kv}>
              <InfoRow label="IČO" value={model.supplier.ico} />
              <InfoRow label="DIČ" value={model.supplier.dic} />
            </View>
            <View style={s.kvSpaced}>
              <InfoRow label="Bankovní účet" value={model.bankNumber} />
              {model.iban ? <InfoRow label="IBAN" value={model.iban} /> : null}
              <InfoRow
                label="Variabilní symbol"
                value={model.variableSymbol}
                accent
              />
              <InfoRow label="Způsob platby" value="Převodem" />
            </View>
          </View>
          <View style={s.partyRight}>
            <Text style={s.anno}>Odběratel</Text>
            <Text style={s.partyName}>{model.customer.name}</Text>
            <View style={s.addr}>
              {model.customer.address.map((line, i) => (
                <Text key={i} style={s.addrLine}>
                  {line}
                </Text>
              ))}
            </View>
            <View style={s.kv}>
              <InfoRow label="IČO" value={model.customer.ico} />
              <InfoRow label="DIČ" value={model.customer.dic} />
            </View>
            <View style={s.kvSpaced}>
              <InfoRow label="Datum vystavení" value={model.createdDate} />
              <InfoRow label="Datum splatnosti" value={model.dueDate} />
              {hasVat ? (
                <InfoRow label="Datum zdan. plnění" value={model.duzpDate} />
              ) : null}
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={s.itemsHead}>
          <Text style={[s.colDesc, s.th]}>Označení dodávky</Text>
          <Text style={[s.colQty, s.th]}>Množství</Text>
          {hasVat ? <Text style={[s.colVat, s.th]}>DPH</Text> : null}
          <Text style={[s.colUnit, s.th]}>Cena za MJ</Text>
          <Text style={[s.colTotal, s.th]}>
            {hasVat ? 'Celkem bez DPH' : 'Celkem'}
          </Text>
        </View>
        {model.items.map((item, i) => (
          <View key={i} style={s.itemRow} wrap={false}>
            <Text style={[s.colDesc, s.tdDesc]}>{item.name}</Text>
            <Text style={[s.colQty, s.tdNum]}>{item.quantityLabel}</Text>
            {hasVat ? (
              <Text style={[s.colVat, s.tdNum]}>{item.vatRate} %</Text>
            ) : null}
            <Text style={[s.colUnit, s.tdNum]}>{item.unitPrice}</Text>
            <Text style={[s.colTotal, s.tdAmt]}>{item.total}</Text>
          </View>
        ))}

        {/* Lower: QR + recap */}
        <View style={s.lower} wrap={false}>
          <View style={s.qrCol}>
            {qrDataUrl ? (
              <View>
                <View style={s.qrBox}>
                  <Image style={s.qrImg} src={qrDataUrl} />
                </View>
                <Text style={[s.anno, s.qrCap]}>QR Platba</Text>
              </View>
            ) : (
              <View style={[s.qrBox, s.qrPlaceholder]}>
                <Text style={s.qrPlaceholderText}>QR Platba</Text>
              </View>
            )}
          </View>
          <View style={s.recapCol}>
            {hasVat ? (
              <View>
                <View style={s.recapHead}>
                  <Text style={[s.rcLabel, s.th]}>Sazba</Text>
                  <Text style={[s.rcCol, s.th]}>Základ</Text>
                  <Text style={[s.rcCol, s.th]}>DPH</Text>
                </View>
                {model.recap.map((r) => (
                  <View key={r.rate} style={s.recapRow}>
                    <Text style={[s.rcLabel, s.rcTdLabel]}>{r.rate} %</Text>
                    <Text style={[s.rcCol, s.rcTdNum]}>{r.base}</Text>
                    <Text style={[s.rcCol, s.rcTdNum]}>{r.vat}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={s.totalWrap}>
              <Text style={s.totalLabel}>Celkem k úhradě</Text>
              <Text style={s.totalAmount}>{model.totalWithTax}</Text>
            </View>
            {model.fullyPaid ? (
              <View style={s.paidWrap}>
                <View style={s.chip}>
                  <View style={s.dot} />
                  <Text style={s.chipText}>
                    Uhrazeno
                    {model.lastPaymentDate ? ` ${model.lastPaymentDate}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Note */}
        {model.note ? (
          <View style={s.note}>
            <Text style={s.anno}>Poznámka</Text>
            <Text style={s.noteBody}>{model.note}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={s.foot}>
          <Text style={s.legal}>
            {hasVat ? 'Daňový doklad dle zákona č. 235/2004 Sb., o DPH. ' : ''}
            Vystaveno elektronicky, platné i bez podpisu a razítka.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
