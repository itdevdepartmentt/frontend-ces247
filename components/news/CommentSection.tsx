"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useComments } from "@/hooks/use-comments";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Send, Trash2, Loader2, ChevronDown, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentSectionProps {
  newsId: string;
}

export function CommentSection({ newsId }: CommentSectionProps) {
  const { user } = useAuth(false);
  const [page, setPage] = useState(1);
  const { comments, meta, isLoading, createComment, isCreating, deleteComment, toggleLike } =
    useComments(newsId, page);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim() || isCreating) return;
    try {
      await createComment({ content: newComment.trim() });
      setNewComment("");
      toast.success("Komentar berhasil ditambahkan!");
    } catch {
      toast.error("Gagal menambahkan komentar.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success("Komentar berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus komentar.");
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast.error("Silakan login untuk menyukai komentar.");
      return;
    }
    try {
      await toggleLike(commentId);
    } catch {
      toast.error("Gagal menyukai komentar.");
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: any, isReply?: boolean }) => {
    const hasLiked = user && comment.likes?.some((like: any) => like.userId === user.id);
    const likeCount = comment._count?.likes || 0;
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleReplySubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!replyContent.trim() || isCreating) return;
      try {
        await createComment({ content: replyContent.trim(), parentId: comment.id });
        setReplyContent("");
        setIsReplying(false);
        toast.success("Balasan berhasil ditambahkan!");
      } catch {
        toast.error("Gagal menambahkan balasan.");
      }
    };

    const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleReplySubmit(e as any);
      }
    };

    return (
      <div className={cn("group flex gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors duration-150", isReply ? "mt-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800/50 pl-4" : "")} id={`comment-${comment.id}`}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold shadow-sm",
            isReply ? "h-7 w-7 text-xs" : "h-9 w-9",
            comment.user.role === "ADMIN" || comment.user.role === "QC"
              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          )}
        >
          {comment.user.name?.charAt(0).toUpperCase() || "?"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {comment.user.name}
            </span>
            {(comment.user.role === "ADMIN" || comment.user.role === "QC") && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {comment.user.role === "QC" ? "QC" : "Admin"}
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-600">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: localeId,
              })}
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <button
              onClick={() => handleLike(comment.id)}
              className={cn("flex items-center gap-1.5 hover:text-red-500 transition-colors duration-200 cursor-pointer", hasLiked ? "text-red-500" : "")}
            >
              <Heart className={cn("h-3.5 w-3.5", hasLiked ? "fill-current" : "")} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {user && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-indigo-500 transition-colors duration-200 cursor-pointer"
              >
                Balas
              </button>
            )}

            {user && (user.id === comment.user.id || user.role === "ADMIN" || user.role === "QC") && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all duration-150 cursor-pointer"
                title="Hapus komentar"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Reply Input Box */}
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder={`Balas ke ${comment.user.name}...`}
                rows={1}
                className={cn(
                  "flex-1 resize-none rounded-xl border px-3 py-2 text-xs",
                  "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800",
                  "text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all"
                )}
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || isCreating}
                className="flex items-center justify-center h-8 px-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 transition-all text-xs font-semibold cursor-pointer"
              >
                Kirim
              </button>
            </form>
          )}

          {/* Render Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {comment.replies.map((reply: any) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section id="comments" className="mt-12 border-t border-slate-200 dark:border-slate-800/60 pt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/20">
          <MessageCircle className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Komentar
          </h2>
          {meta && (
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {meta.total} komentar
            </p>
          )}
        </div>
      </div>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md mt-0.5">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>

            {/* Input Area */}
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis komentar..."
                rows={2}
                className={cn(
                  "w-full resize-none rounded-2xl border px-4 py-3 pr-14 text-sm",
                  "bg-white dark:bg-slate-900/60",
                  "border-slate-200 dark:border-slate-800",
                  "text-slate-800 dark:text-slate-200",
                  "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400",
                  "transition-all duration-200"
                )}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isCreating}
                className={cn(
                  "absolute right-3 bottom-3 flex items-center justify-center h-8 w-8 rounded-xl",
                  "bg-indigo-500 hover:bg-indigo-600 text-white",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "transition-all duration-200 cursor-pointer",
                  "shadow-lg shadow-indigo-500/20"
                )}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <a
              href="/login"
              className="font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              Login
            </a>{" "}
            untuk menambahkan komentar.
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10">
          <MessageCircle className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Belum ada komentar. Jadilah yang pertama!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}

          {/* Load More */}
          {meta && page < meta.lastPage && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
                Muat lebih banyak
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
