"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getTemplateDetails, getTemplates, TemplateRecord } from "../../services/templateService";
import { getNextLetterNumber, setLastLetterNumber, logLetter } from "../../services/suratService";
import { uploadToDrive } from "../actions/drive";
import { toRoman } from "../../utils/romanConverter";
import { processBatchData, isNoSuratKey, isNamaKey } from "../../utils/batchHelper";
import { supabase } from "../../lib/supabaseClient";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function GeneratePage() {
    const [templates, setTemplates] = useState<TemplateRecord[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
    const [nextLetterNumber, setNextLetterNumber] = useState<string>("001");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string>('Staff');

    // Fetch initial letter number, templates, and current user
    useEffect(() => {
        getNextLetterNumber().then(setNextLetterNumber);
        getTemplates().then(setTemplates);
        supabase.auth.getUser().then(({ data }) => {
            const nickname = data.user?.user_metadata?.nickname;
            const email = data.user?.email;
            setCurrentUser(nickname || email || 'Staff');
        });
    }, []);

    const handleTemplateChange = async (templateId: string) => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) return;

        setSelectedTemplate(template);
        setLoading(true);
        setError(null);
        setPlaceholders([]);
        setFormData({});
        setPreviewUrl(null);
        setTemplateBuffer(null);

        try {
            const date = new Date();
            const monthRoman = toRoman(date.getMonth() + 1);
            const year = date.getFullYear();
            const autoNumber = `${nextLetterNumber}/Nogogeni ITS Team/${monthRoman}/${year}`;

            const { file, placeholders: extracted } = await getTemplateDetails(
                "templates",
                template.path
            );

            setTemplateBuffer(file);
            setPlaceholders(extracted);

            const initialData: Record<string, string> = {};
            extracted.forEach(key => {
                if (isNoSuratKey(key)) {
                    initialData[key] = autoNumber;
                } else {
                    initialData[key] = "";
                }
            });
            setFormData(initialData);

        } catch (err: any) {
            console.error(err);
            setError("Failed to load template. Please check if the file exists in Supabase Storage or the Public URL is accessible.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const generatePreview = () => {
        if (!templateBuffer) return;

        try {
            const zip = new PizZip(templateBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '<<', end: '>>' }
            });

            const batchData = processBatchData(formData);
            const previewData = batchData[0] || {};

            doc.render(previewData);

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const url = URL.createObjectURL(out);
            setPreviewUrl(url);
        } catch (err) {
            console.error("Preview generation failed:", err);
            setError("Failed to generate preview. Check placeholders.");
        }
    };

    const handleGenerateFinal = async () => {
        if (!templateBuffer) return;
        setLoading(true);

        try {
            const batchData = processBatchData(formData);

            const date = new Date();
            const monthRoman = toRoman(date.getMonth() + 1);
            const year = date.getFullYear();
            const suffix = `/Nogogeni ITS Team/${monthRoman}/${year}`;

            let currentNum = parseInt(nextLetterNumber) || 1;
            const finalBatch = batchData.map(recipient => {
                const letterNum = `${currentNum.toString().padStart(3, '0')}${suffix}`;
                currentNum++;

                const noSuratKey = Object.keys(recipient).find(k => isNoSuratKey(k)) || 'No.surat';

                return {
                    ...recipient,
                    [noSuratKey]: letterNum
                };
            });

            const zipBundle = new JSZip();

            for (const recipient of finalBatch) {
                const zip = new PizZip(templateBuffer);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                    delimiters: { start: '<<', end: '>>' }
                });

                doc.render(recipient);

                const outBase64 = doc.getZip().generate({
                    type: "base64",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });

                const outBlob = doc.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                });

                // Filename: <<Jenis Surat>> <<Nama>>.docx
                const jenisSurat = selectedTemplate?.name?.replace(/\.[^/.]+$/, '') || 'Surat';
                const namaKey = Object.keys(recipient).find(k => isNamaKey(k));
                const namaVal = namaKey ? recipient[namaKey]?.trim() : '';

                const noSuratKey = Object.keys(recipient).find(k => isNoSuratKey(k));
                const noSuratVal = noSuratKey ? recipient[noSuratKey] : '000';

                const safeJenis = jenisSurat.replace(/[^a-zA-Z0-9 ]/g, '_');
                const safeNama = namaVal ? namaVal.replace(/[^a-zA-Z0-9 ]/g, '_') : '';
                const fileName = safeNama
                    ? `${safeJenis} ${safeNama}.docx`
                    : `${safeJenis}.docx`;

                zipBundle.file(fileName, outBlob);

                // Upload to Drive
                let driveLink = '';
                try {
                    const formData = new FormData();
                    formData.append('file', outBlob, fileName);
                    formData.append('fileName', fileName);

                    const uploadRes = await uploadToDrive(formData);
                    if (uploadRes.success) {
                        driveLink = uploadRes.webViewLink || '';
                    }
                } catch (e) {
                    console.error("Drive upload failed for " + fileName, e);
                }

                // Log to Database
                await logLetter({
                    no_surat: noSuratVal,
                    template_name: selectedTemplate?.name || 'Unknown Template',
                    jenis_surat: jenisSurat,
                    recipient: namaVal || '-',
                    created_by: currentUser,
                    drive_link: driveLink,
                    created_at: new Date().toISOString()
                });
            }
            const newLastNumber = currentNum - 1;
            await setLastLetterNumber(newLastNumber);

            alert(`Successfully generated ${finalBatch.length} letters! Counter updated to ${newLastNumber.toString().padStart(3, '0')}.`);

        } catch (err: any) {
            console.error(err);
            setError(`Generation failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 text-gray-800">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <div className="mb-6">
                    <Link href="/" className="text-[#800020] hover:text-[#5c0015] text-sm font-medium inline-flex items-center gap-1 transition-colors">&larr; Back to Dashboard</Link>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#800020] text-white rounded-xl flex items-center justify-center text-lg shadow-md">⚡</div>
                    <h1 className="text-2xl font-bold text-gray-900">Generate Surat</h1>
                </div>

                {/* Step 1: Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                    <select
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none bg-gray-50 transition-all"
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        defaultValue=""
                    >
                        <option value="" disabled>-- Choose a Template --</option>
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-[#800020]">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading...
                    </div>
                )}
                {error && <p className="text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

                {/* Step 2: Dynamic Form */}
                {placeholders.length > 0 && (
                    <div className="space-y-6">
                        <div className="bg-[#800020]/5 border border-[#800020]/15 rounded-xl p-4 mb-4 text-sm text-[#800020]">
                            <strong>Batch Generation:</strong> You can enter multiple values separated by <strong>semicolons (;)</strong>.
                            Example: "John Doe; Jane Smith; Bob" will generate 3 separate letters.
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {placeholders.map((key) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        {key}
                                    </label>

                                    {isNoSuratKey(key) ? (
                                        <div className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-gray-700 font-medium text-sm">
                                            {(() => {
                                                const recipients = processBatchData(formData);
                                                const count = recipients.length;
                                                const startNum = parseInt(nextLetterNumber) || 1;
                                                const endNum = startNum + count - 1;

                                                const date = new Date();
                                                const monthRoman = toRoman(date.getMonth() + 1);
                                                const year = date.getFullYear();
                                                const suffix = `/Nogogeni ITS Team/${monthRoman}/${year}`;

                                                if (count <= 1) {
                                                    return `${startNum.toString().padStart(3, '0')}${suffix}`;
                                                }
                                                return `${startNum.toString().padStart(3, '0')}${suffix} → ${endNum.toString().padStart(3, '0')}${suffix} (${count} recipients)`;
                                            })()}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#800020] focus:border-transparent outline-none bg-gray-50 transition-all"
                                                value={formData[key] || ''}
                                                onChange={(e) => handleInputChange(key, e.target.value)}
                                                placeholder={`Masukkan ${key}...`}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Gunakan pemisah (;) untuk generate batch.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 3: Actions */}
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={generatePreview}
                                className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                                Preview Surat
                            </button>
                            <button
                                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-md
                                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800020] hover:bg-[#5c0015] hover:shadow-lg hover:shadow-[#800020]/25 active:scale-[0.98]'}`}
                                onClick={handleGenerateFinal}
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : 'Generate Final (Download ZIP)'}
                            </button>
                        </div>

                        {previewUrl && (
                            <div className="mt-8 border-t border-gray-200 pt-8">
                                <h3 className="font-bold text-lg mb-4 text-gray-900">Preview (First Recipient)</h3>
                                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-200">
                                    <p className="mb-3 text-gray-600">Click below to download the preview document:</p>
                                    <a href={previewUrl} download="preview.docx" className="text-[#800020] hover:text-[#5c0015] underline font-medium text-lg">
                                        📥 Download Preview.docx
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
