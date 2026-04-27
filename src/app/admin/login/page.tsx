"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";

const ALLOWED_DOMAIN = "tzuchi.org.tw";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (pb.authStore.isValid) {
      router.replace("/admin");
    }
  }, [router]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErrorMsg("");

    try {
      const authData = await pb.collection("users").authWithOAuth2({
        provider: "google",
        urlCallback: (url) => {
          // Add hd param to restrict to tzuchi.org.tw domain + prompt account chooser
          const authUrl = new URL(url);
          authUrl.searchParams.set("hd", ALLOWED_DOMAIN);
          authUrl.searchParams.set("prompt", "select_account");
          window.open(authUrl.toString(), "_blank", "width=500,height=600,menubar=no,toolbar=no");
        },
      });
      const userEmail = authData.record?.email || "";

      if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
        pb.authStore.clear();
        setErrorMsg("僅限 @tzuchi.org.tw 帳號登入");
        return;
      }

      router.replace("/admin");
    } catch (e: any) {
      console.error("[Google login] failed:", e);
      // PB returns { status, data: { message } } for rule denials etc.
      const status = e?.status ?? e?.response?.status;
      const detail = e?.data?.message || e?.message || "";
      if (status === 400 && /create/i.test(detail)) {
        setErrorMsg("此帳號尚未註冊到系統，請聯絡管理員");
      } else if (status === 404) {
        setErrorMsg("OAuth 設定錯誤，請聯絡管理員");
      } else {
        setErrorMsg(`Google 登入失敗${detail ? "：" + detail : ""}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setErrorMsg("僅限 @tzuchi.org.tw 帳號登入");
      setLoading(false);
      return;
    }

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

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-[#E5E0D8] rounded-lg hover:bg-[#FAF8F5] transition-colors text-[14px] text-[#1A1816] font-medium disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? "登入中..." : "Google @tzuchi.org.tw"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E5E0D8]" />
            <span className="text-[12px] text-[#5A554B]">或使用帳號密碼</span>
            <div className="flex-1 h-px bg-[#E5E0D8]" />
          </div>

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

          <p className="text-center text-[12px] text-[#5A554B]/60 mt-6">
            僅限 @tzuchi.org.tw 帳號登入
          </p>
        </div>
      </div>
    </div>
  );
}
