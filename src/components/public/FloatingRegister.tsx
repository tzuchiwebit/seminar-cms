"use client";

export default function FloatingRegister() {
  return (
    <a
      href="#register"
      className="fixed bottom-6 right-6 z-50 group w-[72px] h-[72px] rounded-full"
    >
      {/* Spinning conic gradient — full circle background */}
      <span
        className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]"
        style={{
          background: "conic-gradient(from 0deg, #1A1816 0%, #1A1816 50%, #9B7B2F 65%, #E8D5A3 78%, #FFFFFF 82%, #E8D5A3 86%, #9B7B2F 95%, #1A1816 100%)",
        }}
      />
      {/* Dark inner fill */}
      <span className="absolute inset-[2px] rounded-full bg-dark group-hover:bg-dark/80 transition-colors" />
      {/* Text */}
      <span className="absolute inset-0 flex items-center justify-center text-center text-cream font-inter text-xs font-medium leading-tight z-10">
        立即
        <br />
        報名
      </span>
    </a>
  );
}
