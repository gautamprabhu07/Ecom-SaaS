//Path: apps/seller-ui/src/app/%28routes%29/dashboard/create-event/page.tsx
"use client";
import { ChevronRight, X } from "lucide-react";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { Controller, useForm } from "react-hook-form";
import ImagePlaceholder from "../../../../shared/components/image-placeholder";
import Input from "../../../../../../../packages/components/input";
import ColorSelector from "../../../../../../../packages/components/colorselector";
import CustomSpecifications from "packages/components/custom-specifications";
import CustomProperties from "packages/components/custom-properties";
import RichTextEditor from "packages/components/rick-text-editor";
import Sizeselector from "packages/components/size-selector";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const selectClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const errorClass = "text-red-500 text-xs mt-1";

interface UploadedImage {
  fileId: string;
  file_url: string;
}

type EventFormData = {
  title: string;
  short_description: string;
  detailed_description: string;
  tags: string;
  warranty: string;
  slug: string;
  brand: string;
  cashOnDelivery: string;
  category: string;
  subCategory: string;
  video_url?: string;
  regular_price: number;
  sale_price: number;
  stock: number;
  starting_date: string;
  ending_date: string;
  discountCodes?: string[];
  images?: (UploadedImage | null)[];
};

const Page = () => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      starting_date: "",
      ending_date: "",
    },
  });

  const [pictureUploadingLoader, setPictureUploadingLoader] = useState(false);
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selected, setSelected] = useState("");
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/product/api/get-categories");
        return res.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/product/api/get-discount-codes");
      return res?.data?.discountCodes || [];
    },
  });

  const categories = data?.categories || [];
  const subcategoriesData = data?.subCategories || [];
  const selectedCategory = watch("category");
  const regularPrice = watch("regular_price");
  const startingDate = watch("starting_date");
  const subcategories = useMemo(
    () => (selectedCategory ? subcategoriesData[selectedCategory] || [] : []),
    [selectedCategory, subcategoriesData],
  );

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);
      await axiosInstance.post("/product/api/create-product", data);
      toast.success("Event created successfully!");
      router.push("/dashboard/all-events");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (file: File | null, index: number) => {
    if (!file) return;
    setPictureUploadingLoader(true);
    try {
      const fileName = await convertFileToBase64(file);

      const response = await axiosInstance.post(
        "/product/api/upload-product-image",
        { fileName },
      );
      const uploadedImage: UploadedImage = {
        fileId: response.data.fileId,
        file_url: response.data.file_url,
      };
      const updateImages = [...images];

      updateImages[index] = uploadedImage;
      if (index === images.length - 1 && images.length < 8) {
        updateImages.push(null);
      }

      setImages(updateImages);
      setValue("images", updateImages);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setPictureUploadingLoader(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    try {
      const updatedImages = [...images];
      const imageToDelete = updatedImages[index];
      if (imageToDelete && typeof imageToDelete === "object") {
        axiosInstance.delete("/product/api/delete-product-image", {
          data: { fileId: imageToDelete.fileId! },
        });
      }

      updatedImages.splice(index, 1);

      if (!updatedImages.includes(null) && updatedImages.length < 8) {
        updatedImages.push(null);
      }

      setImages(updatedImages);
      setValue("images", updatedImages);
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Heading + Breadcrumb */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Create Event</h2>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <span>Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-gray-700">Create Event</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left - Image upload */}
          <div className="w-[420px] shrink-0 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3">
              {images?.length > 0 && (
                <ImagePlaceholder
                  setOpenImageModal={setOpenImageModal}
                  pictureUploadingLoader={pictureUploadingLoader}
                  size="765 x 850"
                  small={false}
                  images={images}
                  index={0}
                  onImageChange={handleImageChange}
                  setSelectedImage={setSelected}
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
                    pictureUploadingLoader={pictureUploadingLoader}
                    size="765 x 850"
                    small
                    index={index + 1}
                    images={images}
                    setSelectedImage={setSelected}
                    onImageChange={handleImageChange}
                    onRemove={handleRemoveImage}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right - Event details */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              An event is a product with a limited-time offer window. Fill in
              the product details below, then set when the offer starts and
              ends.
            </div>

            <Input
              label="Product Title"
              placeholder="Input Product *"
              {...register("title", { required: "Product title is required" })}
            />
            {errors.title && (
              <p className={errorClass}>{String(errors.title.message)}</p>
            )}

            <div>
              <Input
                type="textarea"
                rows={7}
                cols={10}
                label="Product Description *(Max 150 words)"
                placeholder="Input Product Description"
                {...register("short_description", {
                  required: "Product description is required",
                  validate: (value) =>
                    value.trim().split(/\s+/).length <= 150 ||
                    "Description must be less than 150 words",
                })}
              />
              {errors.short_description && (
                <p className={errorClass}>
                  {String(errors.short_description.message)}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Tags *"
                placeholder="apple, flagship"
                {...register("tags", {
                  required: "Separate related product tags with commas",
                })}
              />
              {errors.tags && (
                <p className={errorClass}>{String(errors.tags.message)}</p>
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
                <p className={errorClass}>{String(errors.warranty.message)}</p>
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
                <p className={errorClass}>{String(errors.slug.message)}</p>
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
                <p className={errorClass}>{String(errors.brand.message)}</p>
              )}
            </div>

            <ColorSelector control={control} errors={errors} />
            <CustomSpecifications control={control} errors={errors} />
            <CustomProperties control={control} errors={errors} />

            <div>
              <label className={labelClass}>Cash on Delivery</label>
              <select
                className={selectClass}
                {...register("cashOnDelivery", {
                  required: "Please select an option",
                })}
                defaultValue="yes"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              {isLoading ? (
                <p className="text-sm text-gray-500">Loading categories...</p>
              ) : isError ? (
                <p className="text-sm text-red-500">Error loading categories</p>
              ) : (
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <select {...field} className={selectClass}>
                      <option value="">Select a category</option>
                      {categories.map((category: string) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.category && (
                <p className={errorClass}>{String(errors.category.message)}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Subcategory *</label>
              <Controller
                name="subCategory"
                control={control}
                rules={{ required: "Subcategory is required" }}
                render={({ field }) => (
                  <select {...field} className={selectClass}>
                    <option value="">Select a subcategory</option>
                    {selectedCategory &&
                      subcategories.map((sub: string) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                )}
              />
              {errors.subCategory && (
                <p className={errorClass}>
                  {String(errors.subCategory.message)}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Detailed Description * (Max 100 words)
              </label>
              <Controller
                name="detailed_description"
                control={control}
                rules={{
                  required: "Detailed description is required",
                  validate: (value) =>
                    value
                      .trim()
                      .split(/\s+/)
                      .filter((w: string) => w).length <= 100 ||
                    "Detailed description must be less than 100 words",
                }}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.detailed_description && (
                <p className={errorClass}>
                  {String(errors.detailed_description.message)}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Video URL"
                placeholder="Input product video URL"
                {...register("video_url", {
                  pattern: {
                    value:
                      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
                    message: "Please enter a valid YouTube URL",
                  },
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Regular Price *"
                  placeholder="0.00"
                  {...register("regular_price", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Must be a positive number" },
                    validate: (v) => !isNaN(v) || "Must be a number",
                  })}
                />
                {errors.regular_price && (
                  <p className={errorClass}>
                    {String(errors.regular_price.message)}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Sale Price (Offer Price) *"
                  placeholder="0.00"
                  {...register("sale_price", {
                    required: "Sale price is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Must be a positive number" },
                    validate: (v) => {
                      if (isNaN(v)) return "Must be a number";
                      if (regularPrice && v > regularPrice)
                        return "Cannot exceed regular price";
                      return true;
                    },
                  })}
                />
                {errors.sale_price && (
                  <p className={errorClass}>
                    {String(errors.sale_price.message)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Input
                label="Stock *"
                placeholder="Input product stock"
                {...register("stock", {
                  required: "Stock is required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Must be non-negative" },
                  max: { value: 1000, message: "Cannot exceed 1000" },
                  validate: (v) => {
                    if (isNaN(v)) return "Must be a number";
                    if (!Number.isInteger(v)) return "Must be an integer";
                    return true;
                  },
                })}
              />
              {errors.stock && (
                <p className={errorClass}>{String(errors.stock.message)}</p>
              )}
            </div>

            <Sizeselector control={control} errors={errors} />

            {/* Offer window — this is what makes it an "event" */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Offer Window
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Starting Date *</label>
                  <input
                    type="datetime-local"
                    className={selectClass}
                    {...register("starting_date", {
                      required: "Starting date is required for an event",
                    })}
                  />
                  {errors.starting_date && (
                    <p className={errorClass}>
                      {String(errors.starting_date.message)}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Ending Date *</label>
                  <input
                    type="datetime-local"
                    className={selectClass}
                    {...register("ending_date", {
                      required: "Ending date is required for an event",
                      validate: (v) => {
                        if (!startingDate) return true;
                        return (
                          new Date(v) > new Date(startingDate) ||
                          "Ending date must be after starting date"
                        );
                      },
                    })}
                  />
                  {errors.ending_date && (
                    <p className={errorClass}>
                      {String(errors.ending_date.message)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Discount codes */}
            <div>
              <label className={labelClass}>
                Select Discount Codes (optional)
              </label>
              {discountLoading ? (
                <p className="text-sm text-gray-500">
                  Loading discount codes...
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {discountCodes?.map((code: any) => {
                    const isSelected = (watch("discountCodes") || []).includes(
                      code.id,
                    );
                    return (
                      <button
                        key={code.id}
                        type="button"
                        onClick={() => {
                          const currentSelection = watch("discountCodes") || [];
                          const updatedSelection = currentSelection?.includes(
                            code.id,
                          )
                            ? currentSelection.filter(
                                (id: string) => id !== code.id,
                              )
                            : [...currentSelection, code.id];
                          setValue("discountCodes", updatedSelection);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
                      >
                        {code?.public_name} ({code.discountValue}
                        {code.discountType === "percentage" ? "%" : "$"})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
