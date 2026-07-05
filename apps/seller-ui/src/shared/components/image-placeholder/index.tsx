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
      className={`relative w-full rounded-lg border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50 ${small ? "h-[100px]" : "h-[450px]"}`}
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
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              disabled={pictureUploadingLoader}
              type="button"
              onClick={() => onRemove?.(index!)}
              className="p-1 bg-white rounded-full shadow hover:bg-red-50"
            >
              <X size={14} className="text-red-500" />
            </button>
            <button
              type="button"
              disabled={pictureUploadingLoader}
              onClick={() => {
                setOpenImageModal(true);
                setSelectedImage(images[index].file_url);
              }}
              className="p-1 bg-white rounded-full shadow hover:bg-blue-50"
            >
              <WandSparkles size={14} className="text-blue-500" />
            </button>
          </div>
        </>
      ) : (
        <label
          htmlFor={`image-upload-${index}`}
          className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center px-2"
        >
          <div className="p-2 bg-gray-200 rounded-full">
            <Pencil size={small ? 14 : 20} className="text-gray-500" />
          </div>
          {!small && (
            <>
              <p className="text-gray-400 font-medium text-sm">{size}</p>
              <p className="text-gray-400 text-xs">
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
