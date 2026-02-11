"use client";

import Link from "next/link";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { supabase } from "../../lib/supabaseClient";
import { extractPlaceholders } from "../../utils/placeholderParser";

export default function TemplatePage() {
    const [file, setFile] = useState<File | null>(null);
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            validateAndSetFile(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = async (selectedFile: File) => {
        setMessage(null);
        setPlaceholders([]);

        if (!selectedFile.name.endsWith('.docx')) {
            setMessage({ type: 'error', text: 'Invalid file type. Please upload a .docx file.' });
            return;
        }

        setFile(selectedFile);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const extracted = extractPlaceholders(arrayBuffer);
            setPlaceholders(extracted);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to parse file. Is it a valid DOCX?' });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('templates')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase
                .from('templates')
                .insert([
                    {
                        name: file.name,
                        path: fileName,
                        uploaded_at: new Date().toISOString(),
                    }
                ]);

            if (dbError) throw dbError;

            setMessage({ type: 'success', text: 'Template uploaded successfully!' });
            setFile(null);
            setPlaceholders([]);

        } catch (err: any) {
            console.error(err);
            setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 text-gray-800">
            <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <div className="mb-6">
                    <Link href="/" className="text-[#800020] hover:text-[#5c0015] text-sm font-medium inline-flex items-center gap-1 transition-colors">&larr; Back to Dashboard</Link>
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#800020] text-white rounded-xl flex items-center justify-center text-lg shadow-md">📂</div>
                    <h1 className="text-2xl font-bold text-gray-900">Upload Template</h1>
                </div>
                <p className="text-gray-500 mb-8 ml-13">
                    Add a new .docx template to the system. The system will automatically detect placeholders (e.g., {'<<Nama>>'}).
                </p>

                {/* Upload Area */}
                <div
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                        ${isDragOver ? 'border-[#800020] bg-[#800020]/5' : 'border-gray-300 hover:border-[#800020]/40 hover:bg-gray-50'}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload')?.click()}
                >
                    <input
                        id="file-upload"
                        type="file"
                        accept=".docx"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    <div className="bg-[#800020]/10 text-[#800020] p-4 rounded-full mb-4 text-2xl">
                        📂
                    </div>

                    {file ? (
                        <div className="text-center">
                            <p className="font-semibold text-gray-800">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); setPlaceholders([]); }}
                                className="mt-2 text-red-500 text-sm font-medium hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-400 mt-1">Only .docx files are supported</p>
                        </div>
                    )}
                </div>

                {/* Analysis Result */}
                {file && (
                    <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-4">Template Analysis</h3>
                        {placeholders.length > 0 ? (
                            <div>
                                <p className="text-sm text-gray-600 mb-2">Detected Placeholders:</p>
                                <div className="flex flex-wrap gap-2">
                                    {placeholders.map(p => (
                                        <span key={p} className="bg-[#800020]/10 text-[#800020] text-xs px-3 py-1.5 rounded-full border border-[#800020]/20 font-medium">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                                ⚠ No placeholders detected. Ensure usage of {'<<key>>'} format.
                            </p>
                        )}
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div className={`mt-6 p-4 rounded-xl flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        <span>{message.type === 'success' ? '✅' : '❌'}</span>
                        {message.text}
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        disabled={!file || uploading}
                        onClick={handleUpload}
                        className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-md
                            ${!file || uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800020] hover:bg-[#5c0015] hover:shadow-lg hover:shadow-[#800020]/25 active:scale-[0.98]'}
                        `}
                    >
                        {uploading ? 'Uploading...' : 'Save Template'}
                    </button>
                </div>

            </div>
        </div>
    );
}
