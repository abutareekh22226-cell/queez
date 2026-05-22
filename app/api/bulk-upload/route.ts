import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, QuestionType } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ message: 'لم يتم العثور على ملف' }, { status: 400 });
  }

  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // Allow CSV as well for the template
  ];
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ message: 'الرجاء رفع ملف بصيغة Excel (.xlsx أو .xls) فقط' }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return NextResponse.json({ message: 'الملف فارغ أو لا يحتوي على صفحات' }, { status: 400 });
    }

    // Convert sheet to array of arrays, ignoring header names
    const dataRowsWithHeader = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (dataRowsWithHeader.length < 2) { // Must have header + at least one data row
      return NextResponse.json({ message: 'الملف فارغ أو لا يحتوي على بيانات كافية' }, { status: 400 });
    }

    const dataRows = dataRowsWithHeader.slice(1); // Remove header row
    const questionPromises = [];

    for (const row of dataRows) {
        // Destructure based on column order, not header name
        const [
            questionText,
            type,
            correctAnswer,
            option1,
            option2,
            option3,
            option4,
            explanation
        ] = row as (string | undefined)[];

      if (!questionText || !type || !correctAnswer) {
        console.warn(`Skipping row with missing essential data: ${JSON.stringify(row)}`);
        continue;
      }
      
      const questionType = String(type).toUpperCase().trim();

      if (questionType === 'MULTIPLE_CHOICE') {
        const optionsText = [option1, option2, option3, option4].filter((opt): opt is string => !!opt && String(opt).trim() !== '');
        if (optionsText.length < 2) {
          console.warn(`Skipping MULTIPLE_CHOICE question with less than 2 options: ${JSON.stringify(row)}`);
          continue;
        }
        const questionData = {
          text: String(questionText),
          type: 'MULTIPLE_CHOICE' as QuestionType,
          explanation: explanation ? String(explanation) : null,
          options: {
            create: optionsText.map((option) => ({
              text: String(option),
              isCorrect: String(option) === String(correctAnswer),
            })),
          },
        };
        questionPromises.push(prisma.question.create({ data: questionData }));

      } else if (questionType === 'TRUE_FALSE') {
        const tfCorrectAnswer = String(correctAnswer).toLowerCase();
        if (tfCorrectAnswer !== 'صح' && tfCorrectAnswer !== 'خطأ') {
          console.warn(`Skipping TRUE_FALSE question with invalid correct answer: ${JSON.stringify(row)}`);
          continue;
        }
        const questionData = {
          text: String(questionText),
          type: 'TRUE_FALSE' as QuestionType,
          explanation: explanation ? String(explanation) : null,
          options: {
            create: [
              { text: 'صح', isCorrect: tfCorrectAnswer === 'صح' },
              { text: 'خطأ', isCorrect: tfCorrectAnswer === 'خطأ' },
            ],
          },
        };
        questionPromises.push(prisma.question.create({ data: questionData }));
      }
    }

    if (questionPromises.length === 0) {
      return NextResponse.json({ message: 'لم يتم العثور على أسئلة صالحة في الملف. الرجاء مراجعة تنسيق الملف وترتيب الأعمدة.' }, { status: 400 });
    }

    await prisma.$transaction(questionPromises);

    return NextResponse.json({ message: `تم رفع ${questionPromises.length} سؤال بنجاح` });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء معالجة الملف' }, { status: 500 });
  }
}
