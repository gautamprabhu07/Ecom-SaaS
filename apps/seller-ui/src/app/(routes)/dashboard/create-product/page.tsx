"use client";
import { ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import ImagePlaceholder from "../../../../shared/components/image-placeholder";
import Input from "../../../../../../../packages/components/input";
import ColorSelector from "../../../../../../../packages/components/colorselector";
import CustomSpecifications from "packages/components/custom-specifications";
import CustomProperties from "packages/components/custom-properties";

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [openImageModal, setOpenImageModal] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [images, setImages] = useState<(File | null)[]>([null]);
  const [loading, setLoading] = useState(false);

  const onSubmit = (data: any) => console.log(data);

  const handleImageChange = (file: File | null, index: number) => {
    const updatedImages = [...images];
    updatedImages[index] = file;
    if (index === images.length - 1 && images.length < 8)
      updatedImages.push(null);
    setImages(updatedImages);
    setValue("images", updatedImages);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => {
      let updatedImages = [...prevImages];
      if (index === -1) {
        updatedImages[0] = null;
      } else {
        updatedImages.splice(index, 1);
      }
      if (!updatedImages.includes(null) && updatedImages.length < 8)
        updatedImages.push(null);
      return updatedImages;
    });
    setValue("images", images);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Heading + Breadcrumb */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Create Product
          </h2>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-700">Create Product</span>
          </div>
        </div>

        {/* Content layout */}
        <div className="flex gap-6">
          {/* Left - Image upload */}
          <div className="w-[420px] shrink-0 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              {images?.length > 0 && (
                <ImagePlaceholder
                  setOpenImageModal={setOpenImageModal}
                  size="765 x 850"
                  small={false}
                  index={0}
                  onImageChange={handleImageChange}
                  onRemove={handleRemoveImage}
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 p-1"
                >
                  <ImagePlaceholder
                    setOpenImageModal={setOpenImageModal}
                    size="765 x 850"
                    small
                    index={index + 1}
                    onImageChange={handleImageChange}
                    onRemove={handleRemoveImage}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right - Product details */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <Input
                label="Product Title"
                placeholder="Input Product *"
                {...register("title", {
                  required: "Product title is required",
                })}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">
                  {String(errors.title.message)}
                </p>
              )}
              <div>
                <Input
                  type="textarea"
                  rows={7}
                  cols={10}
                  label="Product Description *(Max 150 words)"
                  placeholder="Input Product Description"
                  {...register("description", {
                    required: "Product description is required",
                    validate: (value) => {
                      const wordCount = value.trim().split(/\s+/).length;
                      return (
                        wordCount <= 150 ||
                        "Description must be less than 150 words"
                      );
                    },
                  })}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message as string}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Tags *"
                  placeholder="apple, flagship"
                  {...register("tags", {
                    required: "Seperate related product tags with commas",
                  })}
                />
                {errors.tags && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.tags.message)}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Warranty *"
                  placeholder="Input warranty period"
                  {...register("warranty", {
                    required: "Warranty period is required",
                  })}
                />
                {errors.warranty && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.warranty.message)}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Slug *"
                  placeholder="Input product slug"
                  {...register("slug", {
                    required: "Product slug is required",
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        "Slug can only contain lowercase letters, numbers, and hyphens",
                    },
                    minLength: {
                      value: 3,
                      message: "Slug must be at least 3 characters long",
                    },
                    maxLength: {
                      value: 50,
                      message: "Slug cannot exceed 50 characters",
                    },
                  })}
                />
                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.slug.message)}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Brand"
                  placeholder="Input product brand"
                  {...register("brand", {
                    required: "Product brand is required",
                  })}
                />
                {errors.brand && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.brand.message)}
                  </p>
                )}
              </div>

              <div>
                <ColorSelector control={control} errors={errors} />
              </div>

              <div>
                <CustomSpecifications control={control} errors={errors} />
              </div>

              <div>
                <CustomProperties control={control} errors={errors} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
