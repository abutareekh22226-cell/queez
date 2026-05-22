'use client';

import { useState } from 'react';
import { updateQuestion } from '../actions';
import type { Prisma } from '@prisma/client';

type QuestionWithOptions = Prisma.QuestionGetPayload<{
  include: { options: true };
}>;

export default function EditQuestionForm({ question: initialQuestion }: { question: QuestionWithOptions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState(initialQuestion);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestion(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newOptions = [...question.options];
    
    if (name === `optionText${index}`) {
        newOptions[index] = { ...newOptions[index], text: value };
    } else if (name === `isCorrect${index}`) {
         // Uncheck all other options when a new one is checked
        newOptions.forEach((option, i) => {
            newOptions[i].isCorrect = i === index ? checked : false;
        });
    }

    setQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateQuestion(question);
    if (result.success) {
      setIsOpen(false);
    } else {
      // Handle error (e.g., show a notification)
      console.error(result.error);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">تعديل</button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <h2 className="text-2xl font-bold mb-6 text-center">تعديل السؤال</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">نص السؤال</label>
                <textarea
                  id="text"
                  name="text"
                  value={question.text}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخيارات</label>
                <div className="space-y-4">
                  {question.options.map((option, index) => (
                    <div key={option.id || index} className="flex items-center space-x-4 space-x-reverse">
                      <input
                        type="text"
                        name={`optionText${index}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`isCorrect${index}`}
                          name={`isCorrect${index}`}
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, e)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label htmlFor={`isCorrect${index}`} className="ml-2 text-sm text-gray-900 cursor-pointer">صحيحة</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-1">الشرح (اختياري)</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={question.explanation || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
