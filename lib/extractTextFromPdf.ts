import PdfParse from "pdf-parse";
import Tesseract from 'tesseract.js';

export const extractTextFromPdf = async (fileBuffer: Buffer) => {
    let extractedText = ""
    try {
        const pdfData = await PdfParse(fileBuffer);
        extractedText = pdfData.text
    } catch (error) {
        const ocrResult = await Tesseract.recognize(fileBuffer, "eng");
        extractedText = ocrResult.data.text
    }

    return extractedText
}