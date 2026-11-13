/**
 * Installment RECOVERY receipt — one shared, framework-free template.
 *
 * The SAME file lives in the web app (src/lib/installment-receipt-template.ts)
 * and the desktop app (src/renderer/src/lib/installment-receipt-template.ts):
 * both render the receipt by turning the API's receipt payload
 * (GET /installments/{plan}/payments/{payment}/receipt) into one
 * self-contained HTML document, so the printed output is identical on Web
 * POS (iframe + browser print) and Desktop POS (the existing hidden-window
 * print engine). Keep the two copies identical.
 *
 * Nothing here is hard-coded shop data: every name, number, amount, Urdu
 * instruction and the paper size come from the payload.
 */

export interface InstallmentReceiptData {
  currency: string
  paper: 'a5' | 'a5-landscape' | 'a4' | string
  business: { name: string; address: string | null; phones: string[]; logo: string | null }
  branch: { name: string } | null
  notes: { left: string; right: string }
  receipt: {
    number: string
    installment_date: string | null
    printed_at: string
    is_down_payment: boolean
    payment_method: string | null
    reference: string | null
  }
  account: { number: string; opening_date: string | null; status: string; due_day: number; plan_details: string[] }
  customer: {
    name: string | null
    guardian_relation: string | null
    guardian_name: string | null
    phone: string | null
    cnic: string | null
    address: string | null
    photo: string | null
  }
  recovery_officer: string | null
  received_by: string | null
  money: {
    total_price: string
    advance: string
    pre_balance: string
    installment_paid: string
    discount: string
    fine: string
    remaining_balance: string
    monthly_installment: string
    total_installments: number
    remaining_installments: number
  }
  installment_no: number | null
  installment_label: string | null
  provider: { name: string; phone: string | null }
}

export interface ReceiptFonts {
  /** URL or data: URI of the Urdu Nastaliq font (regular / bold). */
  urduRegular: string
  urduBold: string
}

const PAPER: Record<string, { page: string; width: string }> = {
  a5: { page: 'A5 portrait', width: '136mm' },
  'a5-landscape': { page: 'A5 landscape', width: '198mm' },
  a4: { page: 'A4 portrait', width: '190mm' }
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** "60000.00" → "60,000" ; "9500.50" → "9,500.50" — no float rounding of the string. */
function amount(value: string | number): string {
  const [whole, fraction = '00'] = String(value ?? '0').split('.')
  const negative = whole.startsWith('-')
  const digits = whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const frac = fraction.padEnd(2, '0').slice(0, 2)
  return `${negative ? '-' : ''}${digits}${frac === '00' ? '' : `.${frac}`}`
}

function currencyLabel(code: string): string {
  return code === 'PKR' ? 'Rs' : code
}

/** "2026-02-03" → "03-02-2026" (calendar date, no timezone shift). */
function date(value: string | null): string {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : value
}

/** ISO timestamp (already in the business timezone) → "03-02-2026 05:41 PM". */
function dateTime(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return value
  const h = Number(m[4])
  const hour12 = ((h + 11) % 12) + 1
  return `${m[3]}-${m[2]}-${m[1]} ${String(hour12).padStart(2, '0')}:${m[5]} ${h >= 12 ? 'PM' : 'AM'}`
}

const PHOTO_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 72"><rect width="60" height="72" fill="#f2f2f2"/><circle cx="30" cy="27" r="12" fill="#c9c9c9"/><path d="M8 72c2-15 11-22 22-22s20 7 22 22z" fill="#c9c9c9"/></svg>'
  )

export function renderInstallmentReceiptHtml(r: InstallmentReceiptData, fonts: ReceiptFonts): string {
  const paper = PAPER[r.paper] ?? PAPER.a5
  const cur = currencyLabel(r.currency)
  const m = r.money
  const money = (v: string): string => `${cur} ${amount(v)}`
  const hasDiscount = Number(m.discount) > 0
  const hasFine = Number(m.fine) > 0
  const badge = r.receipt.is_down_payment ? 'ADV' : (r.installment_label ?? '—')

  const row = (label: string, value: string, strong = false): string =>
    `<tr${strong ? ' class="strong"' : ''}><th>${esc(label)}</th><td>${esc(value)}</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${esc(r.receipt.number)}</title>
<style>
  @font-face { font-family: 'ReceiptUrdu'; font-weight: 400; src: url('${fonts.urduRegular}') format('woff2'); }
  @font-face { font-family: 'ReceiptUrdu'; font-weight: 700; src: url('${fonts.urduBold}') format('woff2'); }
  @page { size: ${paper.page}; margin: 6mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #fff; color: #000; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: ${paper.width}; margin: 0 auto; border: 1.5px solid #000; page-break-inside: avoid; break-inside: avoid; }
  .head { display: flex; align-items: center; gap: 3mm; padding: 2.5mm 3mm 2mm; border-bottom: 1.5px solid #000; }
  .head img { width: 13mm; height: 13mm; object-fit: contain; }
  .head .title { flex: 1; text-align: center; }
  .head h1 { font-size: 21px; font-weight: 900; letter-spacing: 0.6px; text-transform: uppercase; line-height: 1.05; }
  .head .sub { margin-top: 1mm; font-size: 10px; font-weight: 600; }
  .dates { display: flex; justify-content: space-between; padding: 1.2mm 3mm; border-bottom: 1px solid #000; font-size: 9.5px; }
  .dates b { font-weight: 700; }
  .urdu-band { display: grid; grid-template-columns: 1fr 23mm 1fr; align-items: stretch; border-bottom: 1.5px solid #000; }
  .urdu { direction: rtl; unicode-bidi: isolate; font-family: 'ReceiptUrdu', 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif; font-weight: 700;
          font-size: 12.5px; line-height: 2.05; text-align: center; padding: 1mm 2.5mm 1.6mm; display: flex; align-items: center; justify-content: center; }
  .urdu.left { border-right: 1px solid #000; }
  .urdu.right { border-left: 1px solid #000; }
  .badge { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5mm 0; }
  .badge .box { min-width: 15mm; height: 13mm; padding: 0 2mm; background: #000; color: #fff; font-size: 24px; font-weight: 900;
                display: flex; align-items: center; justify-content: center; border-radius: 1mm; line-height: 1; }
  .badge .cap { margin-top: 0.8mm; font-size: 8px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
  .info { padding: 1.6mm 3mm; border-bottom: 1.5px solid #000; display: grid; grid-template-columns: 1fr 1fr; column-gap: 4mm; row-gap: 0.9mm; }
  .info .f { display: flex; gap: 1.5mm; min-width: 0; }
  .info .f.full { grid-column: 1 / -1; }
  .info .k { flex-shrink: 0; font-weight: 700; }
  .info .v { flex: 1; min-width: 0; border-bottom: 1px dotted #555; padding-bottom: 0.2mm; overflow-wrap: anywhere; }
  .body { display: grid; grid-template-columns: 1fr 33mm; }
  table.money { width: 100%; border-collapse: collapse; }
  table.money th, table.money td { border-bottom: 1px solid #000; padding: 1mm 2.5mm; font-size: 10.5px; }
  table.money th { text-align: left; font-weight: 700; width: 52%; border-right: 1px solid #000; }
  table.money td { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  table.money tr.strong th, table.money tr.strong td { font-size: 12px; font-weight: 900; background: #ececec; }
  table.money tr:last-child th, table.money tr:last-child td { border-bottom: 0; }
  .side { border-left: 1.5px solid #000; display: flex; flex-direction: column; align-items: center; padding: 2mm 2mm 1.5mm; }
  .side .photo { width: 26mm; height: 31mm; object-fit: cover; border: 1px solid #000; background: #f2f2f2; }
  .side .sign { margin-top: auto; width: 100%; text-align: center; }
  .side .line { border-top: 1px solid #000; margin: 7mm 1mm 0.8mm; }
  .side .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .side .who { font-size: 9.5px; margin-top: 0.4mm; overflow-wrap: anywhere; }
  .foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 3mm; padding: 1.2mm 3mm; border-top: 1.5px solid #000; font-size: 8.5px; }
  .foot .stamp { text-align: center; min-width: 32mm; }
  .foot .stamp .line { border-top: 1px solid #000; margin-bottom: 0.6mm; }
  .meta { font-size: 8.5px; color: #222; }
  @media screen { body { padding: 6mm 0; background: #e9e9e9; } .sheet { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,.15); } }
</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    ${r.business.logo ? `<img src="${esc(r.business.logo)}" alt="" />` : ''}
    <div class="title">
      <h1>${esc(r.business.name)}</h1>
      <div class="sub">${esc(r.business.address ?? '')}${r.business.phones.length ? ` &nbsp;·&nbsp; Ph: ${esc(r.business.phones.join(', '))}` : ''}</div>
    </div>
    ${r.business.logo ? '<div style="width:13mm"></div>' : ''}
  </div>

  <div class="dates">
    <span><b>Installment Date:</b> ${esc(date(r.receipt.installment_date))}</span>
    <span><b>Receipt #</b> ${esc(r.receipt.number)}</span>
    <span><b>Printed:</b> ${esc(dateTime(r.receipt.printed_at))}</span>
  </div>

  <div class="urdu-band">
    <div class="urdu left" lang="ur" dir="rtl">${esc(r.notes.left)}</div>
    <div class="badge">
      <div class="box">${esc(badge)}</div>
      <div class="cap">${r.receipt.is_down_payment ? 'Advance' : 'Installment No.'}</div>
    </div>
    <div class="urdu right" lang="ur" dir="rtl">${esc(r.notes.right)}</div>
  </div>

  <div class="info">
    <div class="f"><span class="k">Account No.</span><span class="v">${esc(r.account.number)}</span></div>
    <div class="f"><span class="k">Opening Date</span><span class="v">${esc(date(r.account.opening_date))}</span></div>
    <div class="f full"><span class="k">Customer Name</span><span class="v">${esc(r.customer.name ?? '')}</span></div>
    <div class="f"><span class="k">${esc(r.customer.guardian_relation ?? 'S/O')}</span><span class="v">${esc(r.customer.guardian_name ?? '')}</span></div>
    <div class="f"><span class="k">Mobile No.</span><span class="v">${esc(r.customer.phone ?? '')}</span></div>
    <div class="f full"><span class="k">Plan Details</span><span class="v">${esc(r.account.plan_details.join(', '))} — ${m.total_installments} × ${esc(money(m.monthly_installment))}</span></div>
    <div class="f full"><span class="k">Recovery Officer</span><span class="v">${esc(r.recovery_officer ?? '')}</span></div>
  </div>

  <div class="body">
    <table class="money">
      ${row('Total Price', money(m.total_price))}
      ${row('Advance', money(m.advance))}
      ${row('Pre Balance', money(m.pre_balance))}
      ${row(r.receipt.is_down_payment ? 'Advance Paid' : 'Installment Paid', money(m.installment_paid), true)}
      ${row('Discount', hasDiscount ? money(m.discount) : '—')}
      ${row('Fine', hasFine ? money(m.fine) : '—')}
      ${row('Remaining Balance', money(m.remaining_balance), true)}
      ${row('Monthly Installment', money(m.monthly_installment))}
      ${row('Total Installments', String(m.total_installments))}
      ${row('Remaining Installments', String(m.remaining_installments))}
    </table>
    <div class="side">
      <img class="photo" src="${esc(r.customer.photo ?? PHOTO_PLACEHOLDER)}" alt="" />
      <div class="sign">
        <div class="line"></div>
        <div class="lbl">Received By</div>
        <div class="who">${esc(r.received_by ?? '')}</div>
      </div>
    </div>
  </div>

  <div class="foot">
    <div>
      <div class="meta">${r.receipt.payment_method ? `Paid by ${esc(r.receipt.payment_method)}${r.receipt.reference ? ` (${esc(r.receipt.reference)})` : ''}` : ''}${r.receipt.payment_method && r.branch ? ' &nbsp;·&nbsp; ' : ''}${r.branch ? `Branch: ${esc(r.branch.name)}` : ''}</div>
      <div class="meta">Software by <b>${esc(r.provider.name)}</b>${r.provider.phone ? ` · ${esc(r.provider.phone)}` : ''}</div>
    </div>
    <div class="stamp"><div class="line"></div>Stamp / Signature</div>
  </div>
</div>
</body>
</html>`
}
