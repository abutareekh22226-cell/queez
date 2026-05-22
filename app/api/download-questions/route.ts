import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      include: {
        options: true,
      },
    });

    // Format the data for Excel
    const data = questions.map(q => ({
      question: q.text,
      option1: q.options[0]?.text || '',
      isCorrect1: q.options[0]?.isCorrect || false,
      option2: q.options[1]?.text || '',
      isCorrect2: q.options[1]?.isCorrect || false,
      option3: q.options[2]?.text || '',
      isCorrect3: q.options[2]?.isCorrect || false,
      option4: q.options[3]?.text || '',
      isCorrect4: q.options[3]?.isCorrect || false,
      explanation: q.explanation || '',
    }));

    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');

    // Generate a buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the file
    return new NextResponse(buf, {
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="questions.xlsx"`,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }
    });

  } catch (error) {
    console.error('Failed to download questions:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to download questions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
