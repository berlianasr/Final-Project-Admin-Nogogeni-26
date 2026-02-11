"use client";

import Link from "next/link";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { incrementLetterNumber, logLetter } from "../../services/suratService";
import { uploadToDrive } from "../actions/drive";
import { toRoman } from "../../utils/romanConverter";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { extractPlaceholders } from "../../utils/placeholderParser";

export default function ManualInputPage() {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string>('Staff');

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const nickname = data.user?.user_metadata?.nickname;
            const email = data.user?.email;
            setCurrentUser(nickname || email || 'Staff');
        });
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0];
            if (!selected.name.endsWith('.docx')) {
                setMessage({ type: 'error', text: 'Invalid file. Please upload a .docx file.' });
                return;
            }
            setFile(selected);
            setMessage(null);
            setDownloadUrl(null);
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        setProcessing(true);
        setMessage(null);

        try {
            const arrayBuffer = await file.arrayBuffer();

            const placeholders = extractPlaceholders(arrayBuffer);
            if (!placeholders.includes('No.surat')) {
                setMessage({ type: 'error', text: 'File must contain the <<No.surat>> placeholder.' });
                setProcessing(false);
                return;
            }

            const newNumber = await incrementLetterNumber();

            const date = new Date();
            const monthRoman = toRoman(date.getMonth() + 1);
            const year = date.getFullYear();
            const finalNumberString = `${newNumber}/Nogogeni ITS Team/${monthRoman}/${year}`;

            const zip = new PizZip(arrayBuffer);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                delimiters: { start: '<<', end: '>>' }
            });

            doc.render({
                'No.surat': finalNumberString
            });

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const outBase64 = doc.getZip().generate({
                type: "base64",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // Filename
            const jenisSurat = file.name.replace(/\.[^/.]+$/, '') || 'Surat Manual';
            const safeJenis = jenisSurat.replace(/[^a-zA-Z0-9 ]/g, '_');
            const finalFileName = `${safeJenis}.docx`;
            const archivePath = `manual/${finalFileName}`;

            // Supabase Storage (Legacy/Backup)
            const { error: uploadError } = await supabase.storage
                .from('surat')
                .upload(archivePath, out);

            if (uploadError) {
                console.warn("Archiving failed but document generated:", uploadError);
            }

            // Google Drive Upload
            let driveLink = '';
            try {
                console.log("Attempting Drive Upload...");
                const formData = new FormData();
                formData.append('file', out, finalFileName);
                formData.append('fileName', finalFileName);

                const driveRes = await uploadToDrive(formData);
                console.log("Drive Upload Finished. Result:", driveRes);

                if (driveRes.success) {
                    driveLink = driveRes.webViewLink || '';
                    console.log("Drive Link Obtained:", driveLink);
                } else {
                    console.error("Drive upload success=false. Error:", driveRes.error);
                }
            } catch (e) {
                console.error("Drive upload EXCEPTION:", e);
            }

            const url = URL.createObjectURL(out);
            setDownloadUrl(url);

            // Log to Database
            await logLetter({
                no_surat: finalNumberString,
                template_name: 'Manual Input',
                jenis_surat: jenisSurat,
                recipient: '-',
                created_by: currentUser,
                drive_link: driveLink,
                created_at: new Date().toISOString()
            });

            setMessage({ type: 'success', text: `Success! Assigned Number: ${finalNumberString}` });

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: `Processing failed: ${error.message}` });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 text-gray-800">
            <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <div className="mb-6">
                    <Link href="/" className="text-[#800020] hover:text-[#5c0015] text-sm font-medium inline-flex items-center gap-1 transition-colors">&larr; Back to Dashboard</Link>
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#800020] text-white rounded-xl flex items-center justify-center text-lg shadow-md">✍️</div>
                    <h1 className="text-2xl font-bold text-gray-900">Manual Letter Entry</h1>
                </div>
                <p className="text-gray-500 mb-8 ml-13">
                    Upload a drafted .docx file containing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-[#800020]">{'<<No.surat>>'}</code>.
                    The system will assign the next official number and archive it.
                </p>

                <div className="flex flex-col gap-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 bg-gray-50/50 hover:border-[#800020]/30 transition-colors">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Document</label>
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2.5 file:px-5
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#800020]/10 file:text-[#800020]
                                hover:file:bg-[#800020]/20
                                file:transition-colors file:cursor-pointer
                            "
                        />
                        {file && (
                            <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                                <span className="text-[#800020]">📄</span>
                                <span className="font-medium">{file.name}</span>
                                <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2
                            ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            <span>{message.type === 'success' ? '✅' : '❌'}</span>
                            {message.text}
                        </div>
                    )}

                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            download={`Official_${file?.name || 'Letter'}`}
                            className="bg-green-600 text-white text-center py-3.5 rounded-xl font-semibold hover:bg-green-700 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            📥 Download Official Document
                        </a>
                    )}

                    <button
                        onClick={handleProcess}
                        disabled={!file || processing || !!downloadUrl}
                        className={`py-3.5 rounded-xl font-semibold text-white transition-all duration-200 shadow-md
                            ${!file || processing || downloadUrl
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#800020] hover:bg-[#5c0015] hover:shadow-lg hover:shadow-[#800020]/25 active:scale-[0.98]'
                            }`}
                    >
                        {processing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing & Archiving...
                            </span>
                        ) : 'Process Document'}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                        ⚠ This action is irreversible. It will increment the organization's letter counter.
                    </p>
                </div>
            </div>
        </div>
    );
}
