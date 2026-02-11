"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastLetterNumber } from "../services/suratService";
import { toRoman } from "../utils/romanConverter";

export default function Home() {
  const [lastNumber, setLastNumber] = useState("Loading...");
  const [fullNumberString, setFullNumberString] = useState("");

  useEffect(() => {
    const fetchNumber = async () => {
      const num = await getLastLetterNumber();
      setLastNumber(num);

      const date = new Date();
      const monthRoman = toRoman(date.getMonth() + 1);
      const year = date.getFullYear();

      setFullNumberString(`${num}/Nogogeni ITS Team/${monthRoman}/${year}`);
    };

    fetchNumber();
  }, []);

  const cards = [
    {
      href: "/template",
      icon: "📂",
      title: "Upload Template",
      desc: "Upload new .docx templates for sponsorship, proposals, or invitations.",
      accent: "bg-[#800020]",
      hoverText: "group-hover:text-[#800020]",
    },
    {
      href: "/manual-input",
      icon: "✍️",
      title: "Manual Input",
      desc: "Register a manually created letter and get an official number.",
      accent: "bg-[#800020]",
      hoverText: "group-hover:text-[#800020]",
    },
    {
      href: "/generate",
      icon: "⚡",
      title: "Generate Surat",
      desc: "Automatically generate letters from templates with bulk support.",
      accent: "bg-[#800020]",
      hoverText: "group-hover:text-[#800020]",
    },
    {
      href: "/database",
      icon: "🗄️",
      title: "Database",
      desc: "View and manage history of all generated letters.",
      accent: "bg-[#800020]",
      hoverText: "group-hover:text-[#800020]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-8 font-sans">

      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 bg-[#800020]/10 text-[#800020] text-xs font-semibold uppercase tracking-widest rounded-full mb-6">
          Nogogeni ITS Team
        </div>
        <h2 className="text-lg text-gray-500 uppercase tracking-widest font-semibold mb-4">
          Nomor Surat Terakhir
        </h2>
        <div className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
          {fullNumberString || "..."}
        </div>
        <p className="mt-4 text-gray-400 text-sm">
          Updates in real-time based on system database.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col items-center text-center cursor-pointer group-hover:-translate-y-1 group-hover:border-[#800020]/20">
              <div className={`w-16 h-16 ${card.accent} text-white rounded-full flex items-center justify-center mb-6 text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </div>
              <h3 className={`text-xl font-bold mb-2 text-gray-800 ${card.hoverText} transition-colors`}>
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-16 text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Nogogeni ITS Team. Internal Administration System.
      </footer>
    </div>
  );
}
