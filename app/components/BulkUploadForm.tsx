'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'جارٍ الرفع...' : 'رفع الملف'}
    </button>
  )
}

export default function BulkUploadForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
      setMessage(null) // Clear previous messages on new file selection
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setMessage('الرجاء اختيار ملف أولاً')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    // We need to manually trigger the form status for the submit button
    // This is a bit of a hack since we are not using a server action directly
    const submitButton = event.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement
    if (submitButton) {
      submitButton.disabled = true
      const originalButtonText = submitButton.textContent
      submitButton.textContent = 'جارٍ الرفع...'

      try {
        const response = await fetch('/api/bulk-upload', {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()
        setMessage(result.message)
      } catch (error) {
        setMessage('حدث خطأ غير متوقع')
      } finally {
        submitButton.disabled = false
        submitButton.textContent = originalButtonText
      }
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">رفع جماعي للأسئلة</h2>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
            ملف الأسئلة (Excel)
          </label>
          <input 
            type="file" 
            name="file" 
            id="file" 
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            accept=".xlsx, .xls"
          />
          <p className="text-gray-600 text-xs italic mt-2">
            الرجاء رفع ملف بصيغة .xlsx أو .xls فقط.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <SubmitButton />
        </div>
      </form>
      {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
    </div>
  )
}
