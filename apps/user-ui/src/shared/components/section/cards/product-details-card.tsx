// Path: apps/user-ui/src/shared/components/section/cards/product-details-card.tsx
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Ratings from "../../ratings";
import { Heart, MapPin, ShoppingCartIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "apps/user-ui/src/store";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";

const ProductDetailsCard = ({
  data,
  setOpen,
}: {
  data: any;
  setOpen: (open: boolean) => void;
}) => {
  const [activeImage, setActiveImage] = useState(0);
  const [isSelected, setIsSelected] = useState(data?.colors?.[0] || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSizeSelected, setIsSizeSelected] = useState(data?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const isInCart = useStore((state: any) =>
    state.cart.some((item: any) => item.id === data.id),
  );
  const isWishlisted = useStore((state: any) =>
    state.wishlist.some((item: any) => item.id === data.id),
  );
  const addToCart = useStore((state: any) => state.addToCart);
  const addToWishlist = useStore((state: any) => state.addToWishlist);
  const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const router = useRouter();

  const handleChat = async () => {
    if(isLoading) return;
    setIsLoading(true);
    try{
      const res = await axiosInstance.post("/chatting/api/create-user-conversationGroup", {
        sellerId: data?.Shop?.sellerId,
      });
      router.push(`/inbox?conversationId=${res.data.conversation.id}`);
    }
    catch(error){
      console.error("Error initiating chat:", error);
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition"
        >
          <X size={20} />
        </button>

        <div className="flex gap-6">
          {/* Images */}
          <div className="w-64 shrink-0 space-y-2">
            <div className="relative h-64 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50">
              {data?.images?.[activeImage]?.url && (
                <Image
                  src={data.images[activeImage].url}
                  alt="product"
                  layout="fill"
                  objectFit="contain"
                />
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {data?.images?.map((image: any, index: number) => (
                <div
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition ${activeImage === index ? "border-emerald-500" : "border-neutral-200"}`}
                >
                  <Image
                    src={image.url}
                    alt={image.url}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            {/* Seller */}
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-200">
                {data?.Shop?.avatar?.url && (
                  <Image
                    src={data.Shop.avatar.url}
                    alt="shop"
                    layout="fill"
                    objectFit="cover"
                  />
                )}
              </div>
              <div>
                <Link
                  href={`/shop/${data?.Shop?.name}`}
                  className="text-sm font-medium text-neutral-800 hover:text-emerald-600"
                >
                  {data?.Shop?.name}
                </Link>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin size={11} />
                  <span>{data?.Shop?.address}</span>
                </div>
              </div>
              <Ratings rating={data?.Shop?.ratings} />
              <button
                onClick={() => handleChat()}
                className="ml-auto text-xs border border-emerald-500 text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-50 transition"
              >
                Chat with seller
              </button>
            </div>

            <h3 className="text-lg font-semibold text-neutral-800">
              {data?.title}
            </h3>
            <p className="text-sm text-neutral-500">
              {data?.short_description}
            </p>
            {data?.brand && (
              <p className="text-xs text-neutral-500">
                Brand:{" "}
                <span className="font-medium text-neutral-700">
                  {data?.brand}
                </span>
              </p>
            )}

            {/* Colors */}
            {data?.colors?.length > 0 && (
              <div className="flex items-center gap-2">
                <strong className="text-sm text-neutral-700">Color:</strong>
                <div className="flex gap-1.5">
                  {data?.colors?.map((color: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setIsSelected(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition ${isSelected === color ? "border-emerald-500 scale-110" : "border-neutral-300"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {data?.sizes?.length > 0 && (
              <div className="flex items-center gap-2">
                <strong className="text-sm text-neutral-700">Size:</strong>
                <div className="flex gap-1.5">
                  {data.sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setIsSizeSelected(size)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${isSizeSelected === size ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-neutral-600 border-neutral-300 hover:border-emerald-400"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-neutral-900">
                ${data?.sale_price}
              </span>
              {data?.regular_price && (
                <span className="text-sm text-neutral-400 line-through">
                  ${data?.regular_price}
                </span>
              )}
              {data?.stock > 0 ? (
                <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  In stock
                </span>
              ) : (
                <span className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                  Out of stock
                </span>
              )}
            </div>

            {/* Quantity + Actions */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition"
                >
                  −
                </button>
                <span className="px-3 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= data?.stock}
                  className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition"
                >
                  +
                </button>
              </div>
              <button
                disabled={isInCart}
                onClick={() =>
                  addToCart(
                    {
                      ...data,
                      quantity,
                      selectedOptions: {
                        color: isSelected,
                        size: isSizeSelected,
                      },
                    },
                    user,
                    location,
                    deviceInfo,
                  )
                }
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-full transition"
              >
                <ShoppingCartIcon size={16} /> Add to cart
              </button>
              <button
                onClick={() =>
                  isWishlisted
                    ? removeFromWishlist(data.id, user, location, deviceInfo)
                    : addToWishlist(
                        {
                          ...data,
                          quantity,
                          selectedOptions: {
                            color: isSelected,
                            size: isSizeSelected,
                          },
                        },
                        user,
                        location,
                        deviceInfo,
                      )
                }
                className="w-9 h-9 flex items-center justify-center border border-neutral-300 rounded-full hover:bg-rose-50 hover:border-rose-300 transition"
              >
                <Heart size={16} fill={isWishlisted ? "red" : "transparent"} />
              </button>
            </div>

            {/* Delivery */}
            <p className="text-xs text-neutral-500 pt-1">
              <span className="font-medium text-neutral-700">
                Estimated delivery:{" "}
              </span>
              {estimatedDelivery.toDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
