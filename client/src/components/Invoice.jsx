/* eslint-disable react/prop-types */
import { useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import Icon from './Icon.jsx'

export default function Invoice({ bill, onClose }) {
  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: bill?._id ? `Invoice-${bill._id.slice(-8)}` : 'Invoice',
    pageStyle: `
      @page { size: A4; margin: 16mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  })

  if (!bill) return null

  const appointment = bill.appointment
  const patient = appointment?.patient
  const doctor = appointment?.doctor
  const invoiceDate = new Date(bill.createdAt || Date.now())
  const appointmentDate = appointment?.appointmentDate ? new Date(appointment.appointmentDate) : null

  // BDT currency formatter
  const fmt = useMemo(() => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }), [])
  const currency = (n) => fmt.format(Number(n || 0))

  // Totals with VAT 15% included
  const discount = Number(bill.discount || 0)
  const hasItems = Array.isArray(bill.items) && bill.items.length > 0
  const derivedSubtotal = hasItems
    ? bill.items.reduce((sum, it) => sum + (Number(it.qty || it.quantity || 1) * Number(it.unitPrice || it.price || it.total || 0)), 0)
    : Number(bill.subtotal ?? (bill.total ?? 0))
  const vat = Number(bill.tax ?? (derivedSubtotal * 0.15))
  const total = Number(bill.total ?? (derivedSubtotal + vat - discount))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Print Button Bar */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 flex items-center justify-between rounded-t-2xl print:hidden">
          <h2 className="text-xl font-bold">Invoice Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center gap-2"
            >
              <Icon name="printer" className="w-4 h-4" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice */}
        <div ref={componentRef} className="p-8 bg-white">
          {/* Header */}
          <div className="border-b-4 border-blue-600 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-blue-600 mb-2">AIRELUS HOSPITAL LIMITED</h1>
                <p className="text-gray-600 text-sm">Advanced Healthcare Services</p>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p className="flex items-center gap-1"><Icon name="location" className="w-3 h-3" /> Gulshan, Dhaka, Bangladesh</p>
                  <p className="flex items-center gap-1"><Icon name="phone" className="w-3 h-3" /> +880 161 674 7612</p>
                  <p className="flex items-center gap-1"><Icon name="mail" className="w-3 h-3" /> info@airelushospital.com</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block mb-2">
                  <p className="text-xs uppercase">Invoice</p>
                  <p className="text-xl font-bold">#{bill._id?.slice(-8) || 'N/A'}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Date: <span className="font-semibold">{invoiceDate.toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Patient & Appointment Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Bill To */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-300 pb-1">BILL TO</h3>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-base">{patient?.user?.name || 'N/A'}</p>
                <p className="text-gray-600">Patient ID: {patient?.patientId || 'N/A'}</p>
                {patient?.user?.email && <p className="text-gray-600">Email: {patient.user.email}</p>}
                {patient?.phone && <p className="text-gray-600">Phone: {patient.phone}</p>}
                {patient?.address && <p className="text-gray-600">Address: {patient.address}</p>}
              </div>
            </div>

            {/* Appointment Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-gray-300 pb-1">APPOINTMENT DETAILS</h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Doctor:</span> {doctor?.user?.name || 'N/A'}
                </p>
                {doctor?.specialization && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Specialization:</span> {doctor.specialization}
                  </p>
                )}
                {appointmentDate && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Date:</span> {appointmentDate.toLocaleDateString()}
                  </p>
                )}
                {(doctor?.buildingName || doctor?.buildingNo || doctor?.floorNo || doctor?.roomNo) && (
                  <p className="text-gray-700">
                    <span className="font-semibold">Room:</span> {[
                      doctor?.buildingName || null,
                      doctor?.buildingNo ? `Bldg ${doctor.buildingNo}` : null,
                      doctor?.floorNo ? `Floor ${doctor.floorNo}` : null,
                      doctor?.roomNo ? `Room ${doctor.roomNo}` : null
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="capitalize inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {appointment?.status || 'N/A'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="text-left py-3 px-4 font-semibold">#</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items && bill.items.length > 0 ? (
                  bill.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4">{item.description || item.name || 'Service'}</td>
                      <td className="text-right py-3 px-4">{item.qty || item.quantity || 1}</td>
                      <td className="text-right py-3 px-4">{currency(item.unitPrice || item.price || 0)}</td>
                      <td className="text-right py-3 px-4 font-semibold">
                        {currency((item.qty || item.quantity || 1) * (item.unitPrice || item.price || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-4">1</td>
                    <td className="py-3 px-4">Consultation Fee</td>
                    <td className="text-right py-3 px-4">1</td>
                    <td className="text-right py-3 px-4">{currency(bill.subtotal || bill.total || 0)}</td>
                    <td className="text-right py-3 px-4 font-semibold">{currency(bill.subtotal || bill.total || 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Subtotal (excl. VAT):</span>
                  <span className="font-semibold">{currency(derivedSubtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">VAT (15%) included:</span>
                  <span className="font-semibold">{currency(vat)}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{currency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-blue-600 text-white px-4 rounded-lg">
                  <span className="text-lg font-bold">TOTAL (incl. VAT):</span>
                  <span className="text-2xl font-bold">{currency(total)}</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                    bill.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : bill.status === 'refunded'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  Status: {bill.status?.toUpperCase() || 'UNPAID'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Payment Methods:</h4>
                <p className="text-sm text-gray-600">• Cash</p>
                <p className="text-sm text-gray-600">• Credit/Debit Card</p>
                <p className="text-sm text-gray-600">• Mobile Banking (bKash, Nagad)</p>
                <p className="text-sm text-gray-600">• Bank Transfer</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">
                  Thank you for choosing Airelus Hospital Limited. For any queries regarding this invoice, please contact
                  our billing department.
                </p>
              </div>
            </div>
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                This is a computer-generated invoice and does not require a signature.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                © {new Date().getFullYear()} Airelus Hospital Limited. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
