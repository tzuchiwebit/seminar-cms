"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (pb.authStore.isValid) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await pb.collection("users").authWithPassword(email, password);
      router.replace("/admin");
    } catch {
      setErrorMsg("帳號或密碼錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="font-serif text-[#1A1816] text-[28px] font-bold">
            慈濟全球共善學思會
          </h1>
          <p className="text-[#5A554B] text-[14px] mt-2">CMS 管理後台</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E0D8]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] text-[#5A554B] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 border border-[#E5E0D8] rounded-lg text-[14px] text-[#1A1816] bg-white focus:outline-none focus:border-[#9B7B2F] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#5A554B] mb-1.5">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-[#E5E0D8] rounded-lg text-[14px] text-[#1A1816] bg-white focus:outline-none focus:border-[#9B7B2F] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#9B7B2F] text-white rounded-lg text-[14px] font-medium hover:bg-[#836829] transition-colors disabled:opacity-50"
            >
              {loading ? "登入中..." : "登入"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
