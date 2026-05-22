'use client'

import { useState, useRef } from 'react'
import { addQuestion } from '../actions'

export default function AddQuestionForm() {
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [formStatus, setFormStatus] = useState<{ success: boolean; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    const result = await addQuestion(formData);
    setFormStatus(result);

    if (result.success) {
      // Reset the form on successful submission
      formRef.current?.reset();
      setQuestionType('multiple-choice'); // Reset select to default
    }
    // The message will be displayed whether it's a success or an error
  }

  return (
    <form ref={formRef} action={handleAction} className="space-y-6">
      {/* Form fields remain the same */}
       <div>
        <label htmlFor="question-text" className="block text-sm font-medium text-gray-300">
          نص السؤال
        </label>
        <textarea
          id="question-text"
          name="question-text"
          rows={3}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
          required
        ></textarea>
      </div>

      <div>
        <label htmlFor="question-type" className="block text-sm font-medium text-gray-300">
          نوع السؤال
        </label>
        <select
          id="question-type"
          name="question-type"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
        >
          <option value="multiple-choice">اختيار من متعدد</option>
          <option value="true-false">صح / خطأ</option>
        </select>
      </div>

      {questionType === 'multiple-choice' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">الخيارات</h3>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <label htmlFor={`option-${i}`} className="block text-sm font-medium text-gray-400">
                الخيار {i + 1}
              </label>
              <input
                type="text"
                id={`option-${i}`}
                name={`option-${i}`}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                required
              />
            </div>
          ))}

          <div>
            <label htmlFor="correct-answer" className="block text-sm font-medium text-gray-300">
              الإجابة الصحيحة (رقم الخيار)
            </label>
            <input
              type="number"
              id="correct-answer"
              name="correct-answer"
              min="1"
              max="4"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              required
            />
          </div>
        </div>
      )}

      {questionType === 'true-false' && (
         <div>
            <label htmlFor="correct-answer-tf" className="block text-sm font-medium text-gray-300">
              الإجابة الصحيحة
            </label>
            <select
              id="correct-answer-tf"
              name="correct-answer-tf"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="true">صحيح</option>
              <option value="false">خطأ</option>
            </select>
          </div>
      )}

      <div>
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-300">
          الشرح (اختياري)
        </label>
        <textarea
          id="explanation"
          name="explanation"
          rows={3}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
        ></textarea>
      </div>

      {/* Submission button and status message */}
      <div className="flex items-center justify-end space-x-4">
        {formStatus && (
          <p className={`text-sm ${formStatus.success ? 'text-green-400' : 'text-red-400'}`}>
            {formStatus.message}
          </p>
        )}
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          إضافة السؤال
        </button>
      </div>
    </form>
  )
}
