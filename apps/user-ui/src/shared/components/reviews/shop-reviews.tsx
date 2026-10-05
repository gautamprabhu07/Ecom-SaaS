//Path: apps/user-ui/src/shared/components/reviews/shop-reviews.tsx
"use client";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Star, Pencil, Trash2 } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        onClick={() => onChange(n)}
        className="transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded"
      >
        <Star size={24} className={n <= value ? "fill-[#FDBA74] text-[#FDBA74]" : "text-[#E7E5E4]"} />
      </button>
    ))}
  </div>
);

const ShopReviews = ({ shopId, signedIn }: { shopId: string; signedIn: boolean }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const { data, isPending } = useQuery({
    queryKey: ["shop-reviews", shopId, page, signedIn],
    queryFn: async () => (await axiosInstance.get(`/product/api/shop/${shopId}/reviews?page=${page}&limit=10`)).data,
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["shop-reviews", shopId] });
    queryClient.invalidateQueries({ queryKey: ["shop-details", shopId] });
  };
  const onError = (e: any) => setError(e?.response?.data?.message ?? "Something went wrong. Please try again.");

  const save = useMutation({
    mutationFn: async () => {
      const body = { rating, text };
      const url = `/product/api/shop/${shopId}/review`;
      return editing ? axiosInstance.put(url, body) : axiosInstance.post(url, body);
    },
    onSuccess: () => {
      setEditing(false);
      setRating(0);
      setText("");
      setError("");
      setPage(1);
      refresh();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async () => axiosInstance.delete(`/product/api/shop/${shopId}/review`),
    onSuccess: () => {
      setError("");
      refresh();
    },
    onError,
  });

  const viewer = data?.viewer;
  const mine = viewer?.myReview;
  const distribution: Record<string, number> = data?.distribution ?? {};
  const total: number = data?.pagination?.total ?? 0;
  const showForm = editing || viewer?.canReview;

  const startEdit = () => {
    setRating(Math.round(mine.rating));
    setText(mine.reviews ?? "");
    setError("");
    setEditing(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return setError("Please pick a star rating.");
    if (text.trim().length < 10) return setError("Please write at least 10 characters.");
    setError("");
    save.mutate();
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 flex flex-col sm:flex-row gap-5 sm:items-center">
          <div className="text-center sm:px-4">
            <p className="text-3xl font-extrabold text-[#292524]">{data.average.toFixed(1)}</p>
            <p className="flex justify-center gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={14} className={n <= Math.round(data.average) ? "fill-[#FDBA74] text-[#FDBA74]" : "text-[#E7E5E4]"} />
              ))}
            </p>
            <p className="text-xs text-[#78716C]">{total} review{total === 1 ? "" : "s"}</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = distribution[String(n)] ?? 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs text-[#78716C]">
                  <span className="w-3">{n}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#F5F5F4] overflow-hidden">
                    <div className="h-full rounded-full bg-[#059669] transition-all duration-500" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form: only for customers who bought from this shop and haven't reviewed yet (or are editing) */}
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-[#E7E5E4] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#292524]">{editing ? "Edit your review" : "Write a review"}</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Share your experience with this shop (at least 10 characters)"
            className="w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm text-[#292524] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#059669]"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="px-4 py-2 rounded-full bg-[#059669] text-white text-sm font-semibold hover:bg-[#047857] active:scale-95 transition-all disabled:opacity-60"
            >
              {save.isPending ? "Saving..." : editing ? "Save changes" : "Submit review"}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(false); setError(""); }} className="px-4 py-2 rounded-full text-sm text-[#78716C] hover:bg-[#F5F5F4]">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {!showForm && error && <p className="text-xs text-red-600">{error}</p>}

      {/* List */}
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-[#F5F5F4] animate-pulse" />)}
        </div>
      ) : data?.reviews?.length ? (
        data.reviews.map((review: any) => {
          const isMine = mine?.id === review.id;
          return (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-[#E7E5E4] p-4 transition-all duration-300 hover:shadow-[0_10px_30px_-6px_rgba(120,53,15,0.12)] hover:border-[#059669]/30"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-[#292524]">
                  {review.user?.name ?? "Anonymous"}
                  {isMine && <span className="ml-2 text-[10px] font-medium text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded-full">You</span>}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-[#78716C] bg-[#FDBA74]/20 px-2 py-0.5 rounded-full">
                  <Star size={12} className="fill-[#FDBA74] text-[#FDBA74]" />
                  {review.rating}
                </span>
              </div>
              {review.reviews && <p className="text-sm text-[#78716C] leading-relaxed">{review.reviews}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-[#A8A29E]">{new Date(review.createdAt).toLocaleDateString()}</p>
                {isMine && !editing && (
                  <div className="flex gap-1">
                    <button type="button" onClick={startEdit} aria-label="Edit review" className="p-1.5 rounded-full text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#047857] transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.confirm("Delete your review?") && remove.mutate()}
                      aria-label="Delete review"
                      className="p-1.5 rounded-full text-[#78716C] hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 w-14 h-14 rounded-full bg-[#D1FAE5] flex items-center justify-center">
            <span className="text-xl">⭐</span>
          </div>
          <p className="text-sm text-[#78716C]">No reviews yet.</p>
        </div>
      )}

      {(data?.pagination?.pages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-full border border-[#E7E5E4] text-[#78716C] hover:bg-[#F5F5F4] disabled:opacity-40">
            Previous
          </button>
          <span className="text-[#78716C]">Page {page} of {data.pagination.pages}</span>
          <button type="button" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-full border border-[#E7E5E4] text-[#78716C] hover:bg-[#F5F5F4] disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopReviews;
