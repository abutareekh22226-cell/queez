'use client';

import { useState, useEffect } from 'react';
import type { Prisma } from '@prisma/client';
import Link from 'next/link';

// Define a more specific type for Question with included options
type QuestionWithOptions = Prisma.QuestionGetPayload<{
  include: { options: true };
}>;

// Define a type for the option
type Option = Prisma.OptionGetPayload<{}>;

// Function to shuffle an array
function shuffle(array: any[]) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export default function Quiz({ questions: initialQuestions }: { questions: QuestionWithOptions[] }) {
  const [questionsQueue, setQuestionsQueue] = useState<QuestionWithOptions[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithOptions | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [initialQuestionCount, setInitialQuestionCount] = useState(0);

  // New state for batch results
  const [answeredInBatch, setAnsweredInBatch] = useState(0);
  const [scoreInBatch, setScoreInBatch] = useState(0);
  const [showBatchResult, setShowBatchResult] = useState(false);
  const [incorrectQuestionsInBatch, setIncorrectQuestionsInBatch] = useState<QuestionWithOptions[]>([]);
  const [currentBatchQuestions, setCurrentBatchQuestions] = useState<QuestionWithOptions[]>([]);


  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const shuffled = shuffle([...initialQuestions]);
      setQuestionsQueue(shuffled);
      setCurrentQuestion(shuffled[0]);
      setInitialQuestionCount(initialQuestions.length);
    }
  }, [initialQuestions]);

  useEffect(() => {
    if (answeredInBatch === 0 && questionsQueue.length > 0) {
        setCurrentBatchQuestions(questionsQueue.slice(0, 10));
    }
  }, [answeredInBatch, questionsQueue]);

  // Handle case where there are no questions
  if (initialQuestionCount === 0) {
    return (
      <div className="w-full max-w-3xl text-center p-8 bg-black/20 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-lg">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">لا توجد أسئلة متاحة</h2>
        <p className="text-xl text-gray-200 mb-6">
          يبدو أنه لم تتم إضافة أي أسئلة بعد.
        </p>
        <p className="text-lg text-gray-300">
          يمكنك إضافة أسئلة جديدة من  <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 font-semibold underline">لوحة التحكم</Link>.
        </p>
      </div>
    );
  }

  const handleOptionSelect = (option: Option) => {
    if (selectedOption) return; // Prevent changing answer

    setSelectedOption(option);
    const correct = option.isCorrect;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
      setScoreInBatch(prev => prev + 1);
    } else {
        if (currentQuestion) {
            // Add the incorrect question to the back of the queue to be re-asked later
             setQuestionsQueue(prev => {
                const newQueue = [...prev];
                // Insert the incorrect question a few questions away
                const insertIndex = Math.min(newQueue.length, Math.floor(Math.random() * 3) + 2);
                newQueue.splice(insertIndex, 0, currentQuestion);
                return newQueue;
             });
             setIncorrectQuestionsInBatch(prev => [...prev, currentQuestion]);
        }
    }
  };

  const handleNextQuestion = () => {
    if ((answeredInBatch + 1) % 10 === 0 && questionsQueue.length > 1) {
      setShowBatchResult(true);
      setAnsweredInBatch(prev => prev + 1);
    } else {
      moveToNextQuestion();
    }
  };

  const moveToNextQuestion = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    
    // Remove the question that was just answered from the front of the queue
    const newQueue = questionsQueue.slice(1);
    setQuestionsQueue(newQueue);
    setAnsweredInBatch(prev => prev + 1);

    if (newQueue.length > 0) {
      setCurrentQuestion(newQueue[0]);
    } else {
      setShowResults(true);
    }
  }

  const handleContinue = () => {
    setShowBatchResult(false);
    setScoreInBatch(0);
    setIncorrectQuestionsInBatch([]);
    setAnsweredInBatch(0);
    moveToNextQuestion();
  }

  const handleRestartBatch = () => {
    setShowBatchResult(false);
    setScoreInBatch(0);
    setIncorrectQuestionsInBatch([]);
    setAnsweredInBatch(0);

    const batchQuestionsToRestart = shuffle([...currentBatchQuestions]);
    
    const upcomingQuestions = questionsQueue.slice(1);

    const nonBatchQuestions = upcomingQuestions.filter(q => {
        return !currentBatchQuestions.find(batchQ => batchQ.id === q.id);
    });

    const newQueue = [...batchQuestionsToRestart, ...nonBatchQuestions];
    
    setQuestionsQueue(newQueue);
    setCurrentQuestion(newQueue[0]);
    setSelectedOption(null);
    setIsCorrect(null);
  }

  const handleRestart = () => {
      setShowResults(false);
      setScore(0);
      const shuffled = shuffle([...initialQuestions]);
      setQuestionsQueue(shuffled);
      setCurrentQuestion(shuffled[0]);
      setSelectedOption(null);
      setIsCorrect(null);
      // Reset batch state
      setShowBatchResult(false);
      setAnsweredInBatch(0);
      setScoreInBatch(0);
      setIncorrectQuestionsInBatch([]);
  }

  if (showBatchResult) {
    return (
      <div className="w-full max-w-3xl text-center p-8 bg-black/20 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-lg">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">نتيجة المجموعة</h2>
        <p className="text-2xl text-gray-200">
          لقد حصلت على <span className="font-bold text-green-400">{scoreInBatch}</span> من <span className="font-bold text-gray-300">{answeredInBatch % 10 === 0 ? 10 : answeredInBatch % 10}</span>.
        </p>
        {incorrectQuestionsInBatch.length > 0 && (
            <div className="mt-6 text-right">
                <h4 className="font-bold text-lg text-red-400 mb-2">أسئلة تحتاج إلى مراجعة:</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                    {incorrectQuestionsInBatch.map((q) => {
                        const correctOption = q.options.find(opt => opt.isCorrect);
                        return (
                            <li key={q.id} dir="rtl" className="ml-4 mb-3">
                                <span className="font-semibold">{q.text}</span>
                                {correctOption && (
                                    <span className="block text-sm text-green-400 mt-1" dir="rtl">
                                        الإجابة الصحيحة: {correctOption.text}
                                    </span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            </div>
        )}
        <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handleRestartBatch}
              className="px-6 py-3 bg-purple-500/50 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-500/80 border border-purple-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
            >
              إعادة نفس العشر أسئلة
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-blue-500/50 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-500/80 border border-blue-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
            >
              {questionsQueue.slice(1).length > 0 ? 'استئناف باقي الاسئلة' : 'إنهاء الاختبار'}
            </button>
        </div>
      </div>
    );
  }
  
  if (showResults) {
    return (
      <div className="w-full max-w-3xl text-center p-8 bg-black/20 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-lg">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">أحسنت!</h2>
        <p className="text-2xl text-gray-200">
          لقد أتقنت جميع المفاهيم!
        </p>
         <p className="text-lg mt-2 text-gray-400">
            النتيجة النهائية: <span className="font-bold text-green-400">{score}</span> محاولة صحيحة.
         </p>
         <button 
          onClick={handleRestart}
          className="mt-8 px-8 py-3 bg-purple-500/50 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-500/80 border border-purple-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
        >
          إعادة الاختبار
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
       return (
        <div className="w-full max-w-3xl text-center p-8 bg-black/20 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-lg">
            <h2 className="text-2xl font-bold text-yellow-400">جاري تحميل الأسئلة...</h2>
            <p className="text-gray-300 mt-2">إذا استغرق الأمر طويلاً، حاول إعادة تحميل الصفحة.</p>
        </div>
       )
  }


  return (
    <div className="w-full max-w-3xl">
        <div className="p-6 md:p-8 bg-black/20 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-lg">
            <div className="mb-6">
                <p className="text-sm text-purple-300 font-semibold">{`متبقي ${questionsQueue.length -1} سؤال`}</p>
                <h2 className="text-2xl md:text-3xl font-bold mt-2 text-gray-100 leading-tight" dir="rtl">
                {currentQuestion.text}
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => {
                const isSelected = selectedOption?.id === option.id;
                let buttonStyle = 'border-white/10 bg-white/5 hover:bg-white/10';
                
                if (selectedOption) { // An answer has been selected
                    if (option.isCorrect) {
                         buttonStyle = 'border-green-400/50 bg-green-500/20';
                    } else if (isSelected) {
                        buttonStyle = 'border-red-400/50 bg-red-500/20';
                    } else {
                        buttonStyle = 'border-white/10 bg-white/5 opacity-60';
                    }
                }

                return (
                    <button 
                        key={option.id} 
                        onClick={() => handleOptionSelect(option)}
                        disabled={!!selectedOption}
                        className={`text-left p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ease-in-out ${buttonStyle} ${!selectedOption ? 'transform hover:scale-105' : 'cursor-default'}`}
                    >
                        <span className="font-medium text-gray-200" dir="rtl">{option.text}</span>
                    </button>
                )
            })}
            </div>

            {selectedOption && (
              <div className="mt-8 text-center">
                {currentQuestion.explanation && (
                  <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-right">
                    <h4 className="font-bold text-lg text-purple-300 mb-2">الشرح</h4>
                    <p className="text-gray-200" dir="rtl">{currentQuestion.explanation}</p>
                  </div>
                )}
                <button 
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-purple-500/50 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-500/80 border border-purple-400/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 transition-all duration-300 transform hover:scale-105"
                >
                السؤال التالي
                </button>
              </div>
            )}
      </div>
    </div>
  );
}
