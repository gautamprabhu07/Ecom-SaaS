"use client";
import { ChevronRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import axiosInstance from "../../../../../utils/axiosInstance";
import { Controller, useForm } from "react-hook-form";
import ImagePlaceholder from "../../../../../shared/components/image-placeholder";
import Input from "../../../../../../../../packages/components/input";
import ColorSelector from "../../../../../../../../packages/components/colorselector";
import CustomSpecifications from "packages/components/custom-specifications";
import CustomProperties from "packages/components/custom-properties";
import RichTextEditor from "packages/components/rick-text-editor";
import Sizeselector from "packages/components/size-selector";
import { toast } from "react-hot-toast";

const selectClass =
  "w-full border border-[#E7E5E4] rounded-2xl px-3 py-2.5 text-sm text-[#292524] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-[#059669]";
const labelClass = "block text-sm font-medium text-[#292524] mb-1";
const errorClass = "text-red-500 text-xs mt-1 animate-[dropdown-in_150ms_ease-out]";

interface UploadedImage {
  fileId: string;
  file_url: string;
}

const Page = () => {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [pictureUploadingLoader, setPictureUploadingLoader] = useState(false);
  const [images, setImages] = useState<(UploadedImage | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const noop = () => {};

  // Fetch the existing product and prefill the form
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["seller-product", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/product/api/get-seller-product/${productId}`,
      );
      return res.data.product;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (!product) return;

    reset({
      title: product.title,
      short_description: product.short_description,
      detailed_description: product.detailed_description,
      tags: Array.isArray(product.tags) ? product.tags.join(",") : product.tags,
      warranty: product.warranty,
      slug: product.slug,
      brand: product.brand,
      video_url: product.video_url,
      cashOnDelivery: product.cashOnDelivery,
      category: product.category,
      subCategory: product.subCategory,
      colors: product.colors,
      sizes: product.sizes,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock: product.stock,
      discountCodes: product.discount_codes,
      customProperties: product.customProperties,
      custom_specifications: product.custom_specifications,
      starting_date: product.starting_date
        ? new Date(product.starting_date).toISOString().slice(0, 16)
        : "",
      ending_date: product.ending_date
        ? new Date(product.ending_date).toISOString().slice(0, 16)
        : "",
    });

    const existingImages: (UploadedImage | null)[] = (product.images || []).map(
      (img: any) => ({ fileId: img.file_id, file_url: img.url }),
    );
    if (existingImages.length < 8) existingImages.push(null);
    setImages(existingImages);
    setValue("images", existingImages);
  }, [product, reset, setValue]);

  const {
    data: categoriesData,
    isLoading: catLoading,
    isError: catError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () =>
      (await axiosInstance.get("/product/api/get-categories")).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: discountCodes = [], isLoading: discountLoading } = useQuery({
    queryKey: ["shop-discounts"],
    queryFn: async () =>
      (await axiosInstance.get("/product/api/get-discount-codes")).data
        ?.discountCodes || [],
  });

  const categories = categoriesData?.categories || [];
  const subcategoriesData = categoriesData?.subCategories || [];
  const selectedCategory = watch("category");
  const regularPrice = watch("regular_price");
  const subcategories = useMemo(
    () => (selectedCategory ? subcategoriesData[selectedCategory] || [] : []),
    [selectedCategory, subcategoriesData],
  );

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/product/api/update-product/${productId}`, data);
      toast.success("Product updated successfully!");
      router.push("/dashboard/all-products");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const convertFileToBase64 = (file: File) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

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
      if (index === images.length - 1 && images.length < 8)
        updateImages.push(null);
      setImages(updateImages);
      setValue("images", updateImages);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setPictureUploadingLoader(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    const imageToDelete = updatedImages[index];
    if (imageToDelete && typeof imageToDelete === "object") {
      axiosInstance.delete("/product/api/delete-product-image", {
        data: { fileId: imageToDelete.fileId! },
      });
    }
    updatedImages.splice(index, 1);
    if (!updatedImages.includes(null) && updatedImages.length < 8)
      updatedImages.push(null);
    setImages(updatedImages);
    setValue("images", updatedImages);
  };

  if (productLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-64 bg-[#E7E5E4] rounded-full" />
        <div className="h-7 w-80 bg-[#E7E5E4] rounded-full" />
        <div className="flex gap-6">
          <div className="w-64 shrink-0 h-40 bg-[#E7E5E4] rounded-2xl" />
          <div className="flex-1 h-64 bg-[#E7E5E4] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] p-6 font-['Inter']">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6">
          <h2 className="font-['Nunito'] text-2xl font-extrabold text-[#292524]">
            Edit Product
          </h2>
          <div className="flex items-center gap-1.5 text-sm text-[#78716C] mt-1">
            <span>Dashboard</span>
            <ChevronRight size={14} className="text-[#A8A29E]" />
            <span className="text-[#292524] font-medium">Edit Product</span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-105 shrink-0 space-y-3">
            <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-3 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
              {images?.length > 0 && (
                <ImagePlaceholder
                  setOpenImageModal={noop}
                  pictureUploadingLoader={pictureUploadingLoader}
                  size="765 x 850"
                  small={false}
                  images={images}
                  index={0}
                  onImageChange={handleImageChange}
                  setSelectedImage={noop}
                  onRemove={handleRemoveImage}
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-[#E7E5E4] p-1 transition-all duration-200 hover:border-[#059669]/40 hover:shadow-[0_4px_16px_-4px_rgba(120,53,15,0.1)]"
                >
                  <ImagePlaceholder
                    setOpenImageModal={noop}
                    pictureUploadingLoader={pictureUploadingLoader}
                    size="765 x 850"
                    small
                    index={index + 1}
                    images={images}
                    setSelectedImage={noop}
                    onImageChange={handleImageChange}
                    onRemove={handleRemoveImage}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-[#E7E5E4] shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)] p-6 space-y-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_rgba(120,53,15,0.14)]">
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
              {errors.description && (
                <p className={errorClass}>
                  {errors.description.message as string}
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
              {catLoading ? (
                <p className="text-sm text-[#78716C]">Loading categories...</p>
              ) : catError ? (
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
              {catLoading ? (
                <p className="text-sm text-[#78716C]">
                  Loading subcategories...
                </p>
              ) : catError ? (
                <p className="text-sm text-red-500">
                  Error loading subcategories
                </p>
              ) : (
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
              )}
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
              {errors.detailedDescription && (
                <p className={errorClass}>
                  {String(errors.detailedDescription.message)}
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
              {errors.videoUrl && (
                <p className={errorClass}>{String(errors.videoUrl.message)}</p>
              )}
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
                {errors.regularPrice && (
                  <p className={errorClass}>
                    {String(errors.regularPrice.message)}
                  </p>
                )}
              </div>
              <div>
                <Input
                  label="Sale Price"
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
                {errors.salePrice && (
                  <p className={errorClass}>
                    {String(errors.salePrice.message)}
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

            <div>
              <label className={labelClass}>
                Select Discount Codes (optional)
              </label>
              {discountLoading ? (
                <p className="text-sm text-[#78716C]">
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
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5 ${isSelected ? "bg-[#059669] text-white border-[#059669] shadow-[0_4px_14px_-4px_rgba(5,150,105,0.4)]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#059669]"}`}
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
                className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-medium py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.4)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Page;
