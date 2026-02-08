"use client";

import { useState } from "react";

interface FeedbackButtonsProps {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  category: string;
}

export default function FeedbackButtons({
  articleId,
  articleTitle,
  articleUrl,
  category,
}: FeedbackButtonsProps) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitVote(v: "up" | "down", commentText?: string) {
    setVote(v);
    try {
      await fetch("/api/news/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          article_title: articleTitle,
          article_url: articleUrl,
          category,
          vote: v,
          comment: commentText || null,
        }),
      });
    } catch (e) {
      // silently fail
    }
  }

  function handleThumbsUp() {
    submitVote("up");
    setShowComment(false);
  }

  function handleThumbsDown() {
    setVote("down");
    setShowComment(true);
  }

  function handleSubmitComment() {
    submitVote("down", comment);
    setShowComment(false);
    setSubmitted(true);
  }

  function handleSkipComment() {
    submitVote("down");
    setShowComment(false);
    setSubmitted(true);
  }

  if (vote === "up") {
    return <span className="text-[10px] text-green-500">👍</span>;
  }

  if (submitted || (vote === "down" && !showComment)) {
    return <span className="text-[10px] text-red-400">👎</span>;
  }

  return (
    <div className="inline-flex items-center gap-1">
      {!vote && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleThumbsUp();
            }}
            className="rounded px-1 text-[10px] text-slate-600 transition-colors hover:bg-green-900/30 hover:text-green-400"
            title="Relevant to me"
          >
            👍
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleThumbsDown();
            }}
            className="rounded px-1 text-[10px] text-slate-600 transition-colors hover:bg-red-900/30 hover:text-red-400"
            title="Not relevant"
          >
            👎
          </button>
        </>
      )}
      {showComment && (
        <div
          className="mt-1 flex w-full items-center gap-1"
          onClick={(e) => e.preventDefault()}
        >
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitComment();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="What didn't you like? (optional)"
            className="flex-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-slate-500"
            autoFocus
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmitComment();
            }}
            className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-slate-600"
          >
            Send
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSkipComment();
            }}
            className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-300"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
