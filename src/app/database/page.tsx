"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLetters, LetterRecord } from "../../services/suratService";

export default function DatabasePage() {
    const [letters, setLetters] = useState<LetterRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLetters = async () => {
            const data = await getLetters();
            setLetters(data);
            setLoading(false);
        };
        fetchLetters();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 text-gray-800">
            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#800020] text-white rounded-xl flex items-center justify-center text-lg shadow-md">🗄️</div>
                        <h1 className="text-2xl font-bold text-gray-900">Database Surat</h1>
                    </div>
                    <Link href="/" className="text-[#800020] hover:text-[#5c0015] text-sm font-medium inline-flex items-center gap-1 transition-colors">&larr; Back to Dashboard</Link>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Total Surat</p>
                        <p className="text-2xl font-bold text-gray-900">{letters.length}</p>
                    </div>
                    <div className="bg-[#800020]/5 rounded-xl p-4 border border-[#800020]/10">
                        <p className="text-sm text-gray-500">Uploaded to Drive</p>
                        <p className="text-2xl font-bold text-[#800020]">{letters.filter(l => l.drive_link).length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-sm text-gray-500">Pending Upload</p>
                        <p className="text-2xl font-bold text-gray-600">{letters.filter(l => !l.drive_link).length}</p>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No. Surat</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jenis Surat</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat Oleh</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder (Drive)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-[#800020]" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : letters.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                                        No letters found in database.
                                    </td>
                                </tr>
                            ) : (
                                letters.map((letter, index) => (
                                    <tr key={letter.id || index} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{letter.no_surat}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#800020]/10 text-[#800020]">
                                                {letter.jenis_surat || letter.template_name || 'Undangan'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{letter.recipient || "-"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {letter.created_at ? new Date(letter.created_at).toLocaleString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{letter.created_by || "System"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {letter.drive_link ? (
                                                <a href={letter.drive_link} target="_blank" rel="noopener noreferrer" className="text-[#800020] hover:text-[#5c0015] font-medium hover:underline inline-flex items-center gap-1">
                                                    Open Drive <span className="text-xs">↗</span>
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full">Not Uploaded</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
