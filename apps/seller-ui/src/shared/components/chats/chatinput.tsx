//Path: apps/seller-ui/src/shared/components/chats/chatinput.tsx
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PickerProps } from "emoji-picker-react";
import { ImageIcon, Smile, Send } from "lucide-react";

const EmojiPicker = dynamic(
  () =>
    import("emoji-picker-react").then(
      (mod) => mod.default as React.FC<PickerProps>,
    ),
  { ssr: false },
);

const ChatInput = ({
  onSendMessage,
  message,
  setMessage,
}: {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const handleEmojiClick = (emojiData: any) => {
    setMessage((prevMessage) => prevMessage + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle image upload logic here
      console.log("Image uploaded:", file);
    }
  };

  return (
    <div className="relative border-t border-[#E7E5E4] px-4 py-3">
      <form onSubmit={onSendMessage} className="flex items-center gap-2">
        <label className="w-9 h-9 flex items-center justify-center rounded-full text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#059669] hover:scale-110 cursor-pointer transition-all duration-200 shrink-0">
          <ImageIcon size={18} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden
          />
        </label>

        {/* Emoji picker toggle */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${showEmoji ? "bg-[#D1FAE5] text-[#059669]" : "text-[#78716C] hover:bg-[#D1FAE5] hover:text-[#059669]"}`}
          >
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div className="absolute bottom-12 left-0 z-10 animate-[dropdown-in_150ms_ease-out] origin-bottom-left">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>

        {/* Input field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-[#E7E5E4] rounded-full px-4 py-2 text-sm text-[#292524] placeholder:text-[#78716C] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="w-9 h-9 flex items-center justify-center bg-[#059669] hover:bg-[#047857] text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
