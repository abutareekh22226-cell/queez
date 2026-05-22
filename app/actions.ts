'use server';
import { revalidatePath } from 'next/cache';
import prisma from '../lib/prisma';
import type { Prisma, QuestionType } from '@prisma/client';

type QuestionWithOptions = Prisma.QuestionGetPayload<{
    include: { options: true };
}>;

export async function addQuestion(formData: FormData) {
    const text = formData.get('text') as string;
    const explanation = formData.get('explanation') as string;
    const questionTypeFormValue = formData.get('questionType') as string;

    const type: QuestionType = questionTypeFormValue === 'multiple-choice' ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE';

    let options: { text: string; isCorrect: boolean }[] = [];

    if (type === 'MULTIPLE_CHOICE') {
        for (let i = 0; i < 4; i++) {
            const optionText = formData.get(`options[${i}].text`) as string;
            const isCorrect = formData.get(`options[${i}].isCorrect`) === 'on';
            if (optionText) {
                options.push({ text: optionText, isCorrect });
            }
        }
    }

    try {
        await prisma.question.create({
            data: {
                text,
                explanation,
                type,
                options: {
                    create: options,
                },
            },
        });
        revalidatePath('/dashboard');
        return { success: true, message: 'تم إضافة السؤال بنجاح!' };
    } catch (error) {
        console.error("Failed to create question:", error);
        return { success: false, message: 'فشل في إنشاء السؤال.' };
    }
}

export async function updateQuestion(question: QuestionWithOptions) {

    const { id, text, explanation, options } = question;

    try {
        // Start a transaction
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Update the question text and explanation
            await tx.question.update({
                where: { id },
                data: { text, explanation },
            });

            // 2. Update the options
            for (const option of options) {
                if (option.id) {
                    await tx.option.update({
                        where: { id: option.id },
                        data: { 
                            text: option.text, 
                            isCorrect: option.isCorrect 
                        },
                    });
                }
            }
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Failed to update question:", error);
        return { success: false, error: "Failed to update question" };
    }
}

export async function deleteQuestion(questionId: number) {
    try {
        await prisma.question.delete({
            where: { id: questionId },
            include: { options: true }, // Ensure options are deleted as well
        });
        revalidatePath('/dashboard');
    } catch (error) {
        console.error("Failed to delete question:", error);
    }
}
