
import { PrismaClient } from '@prisma/client';
import Quiz from './components/Quiz';

const prisma = new PrismaClient();
// Force re-build

// Fetch questions from the database on the server
async function getQuestions() {
  const questions = await prisma.question.findMany({
    include: { options: true },
  });
  // Basic shuffle to make it interesting
  return questions.sort(() => Math.random() - 0.5);
}

export default async function Home() {
  const questions = await getQuestions();

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-purple-900/20 text-white flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-2 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            اختبار تفاعلي
          </h1>
          <p className="text-lg text-gray-400">
            اختر الإجابة التي تعتقد أنها صحيحة.
          </p>
        </header>

        {/* The Quiz client component */}
        <Quiz questions={questions} />
        
      </div>
    </main>
  );
}
