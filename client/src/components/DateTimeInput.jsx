/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'

// A reusable date+time picker built from native inputs that supports both widget selection and manual typing.
// value format: 'YYYY-MM-DDTHH:mm' (same as <input type="datetime-local" />)
export default function DateTimeInput({ value, onChange, className = '', required = false, min, max, name, id, disabled }) {
  const [datePart, setDatePart] = useState('')
  const [timePart, setTimePart] = useState('')

  // Sync internal parts when external value changes
  useEffect(() => {
    if (typeof value === 'string' && value.includes('T')) {
      const [d, t] = value.split('T')
      setDatePart(d)
      setTimePart(t?.slice(0,5) || '')
    } else if (!value) {
      setDatePart('')
      setTimePart('')
    }
  }, [value])

  const emit = (d, t) => {
    const v = d && t ? `${d}T${t}` : d || ''
    onChange?.(v)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        type="date"
        name={name ? `${name}-date` : undefined}
        id={id ? `${id}-date` : undefined}
        className={className}
        value={datePart}
        onChange={(e) => { const d = e.target.value; setDatePart(d); emit(d, timePart) }}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
      />
      <input
        type="time"
        name={name ? `${name}-time` : undefined}
        id={id ? `${id}-time` : undefined}
        className={className}
        value={timePart}
        onChange={(e) => { const t = e.target.value; setTimePart(t); emit(datePart, t) }}
        required={required}
        disabled={disabled}
      />
    </div>
  )
}
