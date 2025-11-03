'use client'

import React, { useState } from 'react'

export function TestComponent() {
  const [showStatus, setShowStatus] = useState(false)
  const [selected, setSelected] = useState('')

  const message = !selected ? 'Select' : 'Ready'

  return (
    <div>
      {!showStatus && (
        <div>
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}
