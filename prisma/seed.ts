
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // مسح البيانات القديمة
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});

  console.log('بدء ملء البيانات...');

  // --- سؤال صح/خطأ ---
  const trueFalseQuestion = await prisma.question.create({
    data: {
      text: 'السماء زرقاء.',
      type: 'TRUE_FALSE',
    },
  });

  await prisma.option.createMany({
    data: [
      { text: 'صحيح', isCorrect: true, questionId: trueFalseQuestion.id },
      { text: 'خطأ', isCorrect: false, questionId: trueFalseQuestion.id },
    ],
  });
  console.log('تم إنشاء سؤال صح/خطأ');


  // --- سؤال اختيار من متعدد 1 ---
  const mcq1 = await prisma.question.create({
    data: {
      text: 'ما هي عاصمة فرنسا؟',
      type: 'MULTIPLE_CHOICE',
    },
  });

  await prisma.option.createMany({
    data: [
      { text: 'باريس', isCorrect: true, questionId: mcq1.id },
      { text: 'لندن', isCorrect: false, questionId: mcq1.id },
      { text: 'برلين', isCorrect: false, questionId: mcq1.id },
      { text: 'مدريد', isCorrect: false, questionId: mcq1.id },
    ],
  });
  console.log('تم إنشاء سؤال اختيار من متعدد 1');

  // --- سؤال اختيار من متعدد 2 ---
    const mcq2 = await prisma.question.create({
    data: {
      text: 'ما هو أكبر كوكب في نظامنا الشمسي؟',
      type: 'MULTIPLE_CHOICE',
    },
  });

  await prisma.option.createMany({
    data: [
      { text: 'الأرض', isCorrect: false, questionId: mcq2.id },
      { text: 'المريخ', isCorrect: false, questionId: mcq2.id },
      { text: 'المشتري', isCorrect: true, questionId: mcq2.id },
      { text: 'زحل', isCorrect: false, questionId: mcq2.id },
    ],
  });
   console.log('تم إنشاء سؤال اختيار من متعدد 2');


  console.log('انتهى ملء البيانات.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
