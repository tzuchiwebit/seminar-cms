"use client";

import { X, Users } from "lucide-react";

interface Speaker {
  name: string;
  affiliation: string;
  title: string;
  bio?: string;
  topicZh?: string;
  topicEn?: string;
  papers?: string[];
  tags?: string[];
}

interface SpeakerModalProps {
  speaker: Speaker | null;
  onClose: () => void;
  lang?: "zh" | "en";
}

export default function SpeakerModal({ speaker, onClose, lang = "zh" }: SpeakerModalProps) {
  if (!speaker) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-cream rounded-2xl overflow-hidden shadow-2xl max-w-[720px] w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-white transition-colors"
        >
          <X className="w-4 h-4 text-muted" />
        </button>

        {/* Left: Photo + Name */}
        <div className="md:w-[280px] shrink-0 bg-cream-dark p-8 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full bg-cream flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-muted-light/40" />
          </div>
          <h3 className="font-serif text-dark text-2xl font-bold mb-1">
            {speaker.name}
          </h3>
          <p className="font-inter text-muted text-sm">{speaker.affiliation}</p>
          <p className="font-inter text-muted-light text-xs mt-1">
            {speaker.title}
          </p>
        </div>

        {/* Right: Details */}
        <div className="flex-1 p-8">
          {/* About */}
          <div className="mb-6">
            <p className="font-inter text-gold text-xs tracking-[0.15em] uppercase font-medium mb-3">
              {lang === "en" ? "About" : "關於"}
            </p>
            <p className="font-sans text-muted text-sm leading-relaxed">
              {speaker.bio || `${speaker.name}${speaker.affiliation ? `, ${speaker.affiliation}` : ""}${speaker.title ? ` — ${speaker.title}` : ""}`}
            </p>
          </div>

          {/* Topic */}
          {speaker.topicZh && (
            <div className="mb-6">
              <p className="font-inter text-gold text-xs tracking-[0.15em] uppercase font-medium mb-3">
                {lang === "en" ? "Topic" : "主題"}
              </p>
              <p className="font-serif text-dark font-semibold mb-1">
                {speaker.topicZh}
              </p>
              {speaker.topicEn && (
                <p className="font-inter text-muted-light text-sm">
                  {speaker.topicEn}
                </p>
              )}
            </div>
          )}

          {/* Papers */}
          {speaker.papers && speaker.papers.length > 0 && (
            <div className="mb-6">
              <p className="font-inter text-gold text-xs tracking-[0.15em] uppercase font-medium mb-3">
                {lang === "en" ? "Papers" : "論文"}
              </p>
              <ul className="space-y-2">
                {speaker.papers.map((paper, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 font-sans text-muted text-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                    {paper}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {speaker.tags && speaker.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
              {speaker.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-inter text-xs text-muted border border-border rounded-full px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
