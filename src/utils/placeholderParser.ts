import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export const extractPlaceholders = (content: ArrayBuffer): string[] => {
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    const text = doc.getFullText();
    // Regex to match <<placeholder>>
    const regex = /<<([^>>]+)>>/g;
    const matches = text.match(regex);

    if (!matches) return [];

    // Extract content between << and >> and remove duplicates
    const uniqueKeys = new Set(
        matches.map((match) => match.replace(/<<|>>/g, '').trim())
    );

    return Array.from(uniqueKeys);
};
