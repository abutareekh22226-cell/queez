import AddQuestionForm from '../components/AddQuestionForm';
import BulkUploadForm from '../components/BulkUploadForm';
import prisma from '@/lib/prisma';
import { deleteQuestion } from '../actions';
import EditQuestionForm from '../components/EditQuestionForm';
import { Prisma } from '@prisma/client';

type QuestionWithOptions = Prisma.QuestionGetPayload<{
    include: { options: true };
}>;

async function getQuestions(): Promise<QuestionWithOptions[]> {
  const questions = await prisma.question.findMany({
    include: {
      options: true,
    },
    orderBy: {
      id: 'desc',
    }
  });
  return questions;
}

export default async function Dashboard() {
  const questions = await getQuestions();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <AddQuestionForm />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <BulkUploadForm />
          <div className="mt-6 text-center">
            <div className="flex justify-center items-center space-x-4">
                <a 
                href="/templates/questions-sample.xlsx"
                download
                className="text-blue-500 hover:text-blue-700 underline"
                >
                تحميل نموذج ملف Excel
                </a>
                <a 
                href="/api/download-questions"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                تنزيل كل الاسئلة
                </a>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              قم بتنزيل النموذج لترى التنسيق الصحيح للأسئلة والخيارات.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">إدارة الأسئلة</h2>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="p-4 border rounded-md bg-gray-50">
                <p className="font-semibold text-lg text-gray-800" dir="rtl">{question.text}</p>
                <div className="mt-2 space-y-1">
                    {question.options.map(option => (
                    <p key={option.id} className={`${option.isCorrect ? 'text-green-600' : 'text-gray-700'} ml-4`} dir="rtl">
                        - {option.text} {option.isCorrect && "(الإجابة الصحيحة)"}
                    </p>
                    ))}
                </div>
                {question.explanation && (
                    <p className="text-sm text-gray-500 mt-2" dir="rtl">
                        <span className="font-bold">الشرح:</span> {question.explanation}
                    </p>
                )}
                <div className="flex items-center justify-end space-x-2 mt-4">
                    <EditQuestionForm question={question} />
                    <form action={async () => {
                        'use server';
                        await deleteQuestion(question.id);
                    }}>
                        <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">حذف</button>
                    </form>
                </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
