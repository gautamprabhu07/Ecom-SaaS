// Path: apps/seller-ui/src/shared/components/image-placeholder/index.tsx
import { Pencil, WandSparkles, X } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";

const ImagePlaceholder = ({
  size,
  small,
  onImageChange,
  onRemove,
  setSelectedImage,
  pictureUploadingLoader,
  images,
  defaultImage = null,
  index = null,
  setOpenImageModal,
}: {
  size: string;
  small?: boolean;
  onImageChange: (file: File | null, index: number) => void;
  onRemove: (index: number) => void;
  images: any;
  pictureUploadingLoader: boolean;
  defaultImage?: string | null;
  setSelectedImage: (e: string) => void;
  index?: any;
  setOpenImageModal: (v: boolean) => void;
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(defaultImage);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      onImageChange(file, index);
    }
  };

  return (
    <div
      className={`group relative w-full rounded-2xl border-2 border-dashed border-[#E7E5E4] overflow-hidden flex items-center justify-center bg-[#FAF8F3] transition-colors duration-200 hover:border-[#059669]/50 ${small ? "h-[100px]" : "h-[450px]"}`}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id={`image-upload-${index}`}
        onChange={handleFileChange}
      />

      {imagePreview ? (
        <>
          <Image
            width={400}
            height={300}
            src={imagePreview}
            alt="uploaded"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              disabled={pictureUploadingLoader}
              type="button"
              onClick={() => onRemove?.(index!)}
              className="p-1 bg-white rounded-full shadow-[0_4px_12px_-2px_rgba(120,53,15,0.2)] text-[#78716C] transition-all duration-200 hover:bg-red-50 hover:text-red-500 hover:scale-110"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              disabled={pictureUploadingLoader}
              onClick={() => {
                setOpenImageModal(true);
                setSelectedImage(images[index].file_url);
              }}
              className="p-1 bg-white rounded-full shadow-[0_4px_12px_-2px_rgba(120,53,15,0.2)] text-[#78716C] transition-all duration-200 hover:bg-[#D1FAE5] hover:text-[#059669] hover:scale-110"
            >
              <WandSparkles size={14} />
            </button>
          </div>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center px-2"
        >
          <div className="p-2 bg-[#D1FAE5] rounded-full transition-transform duration-200 group-hover:scale-110">
            <Pencil size={small ? 14 : 20} className="text-[#059669]" />
          </div>
          {!small && (
            <>
              <p className="text-[#78716C] font-medium text-sm">{size}</p>
              <p className="text-[#A8A29E] text-xs">
                Please choose an image
                <br />
                according to the expected ratio
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
};

export default ImagePlaceholder;
