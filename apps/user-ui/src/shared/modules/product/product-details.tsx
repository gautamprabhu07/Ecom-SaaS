// "use client";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Heart,
//   MapPin,
//   MessageSquareText,
//   Package,
//   ShoppingCartIcon,
//   WalletMinimal,
// } from "lucide-react";
// import React, { useState } from "react";
// import ReactImageMagnify from "react-image-magnify";
// import Image from "next/image";
// import Ratings from "../../components/ratings";
// import Link from "next/link";
// import { useStore } from "../../../store";
// import useUser from "apps/user-ui/src/hooks/useUser";
// import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
// import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";

// const ProductDetails = ({ productDetails }: { productDetails: any }) => {
//   const { user, isLoading } = useUser();
//   const location = useLocationTracking();
//   const deviceInfo = useDeviceTracking();

//   const [currentImage, setCurrentImage] = useState(
//     productDetails?.images?.[0]?.url,
//   );
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isSelected, setIsSelected] = useState(
//     productDetails?.colors?.[0] || "",
//   );
//   const [isSizeSelected, setIsSizeSelected] = useState(
//     productDetails?.sizes?.[0] || "",
//   );
//   const [quantity, setQuantity] = useState(1);
//   const [priceRange, setPriceRange] = useState([
//     productDetails?.sale_price,
//     1199,
//   ]);
//   const [recommendedProducts, setRecommendedProducts] = useState([]);
//   const addToCart = useStore((state: any) => state.addToCart);
//   const cart = useStore((state: any) => state.cart);
//   const isInCart = cart.some((item: any) => item.id === productDetails?.id);
//   const addToWishlist = useStore((state: any) => state.addToWishlist);
//   const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
//   const wishlist = useStore((state: any) => state.wishlist);
//   const isWishlisted = wishlist.some(
//     (item: any) => item.id === productDetails?.id,
//   );

//   const prevImage = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//       setCurrentImage(productDetails?.images?.[currentIndex - 1]);
//     }
//   };

//   const nextImage = () => {
//     if (currentIndex < (productDetails?.images?.length || 0) - 1) {
//       setCurrentIndex(currentIndex + 1);
//       setCurrentImage(productDetails?.images?.[currentIndex + 1]);
//     }
//   };

//   const discountPercentage = Math.round(
//     ((productDetails?.regular_price - productDetails?.sale_price) /
//       productDetails?.regular_price) *
//       100,
//   );

//   return (
//     <div>
//       <div>
//         {/*left column product images*/}
//         <div>
//           <div>
//             {/*Main image with zoom*/}
//             <ReactImageMagnify
//               {...{
//                 smallImage: {
//                   alt: productDetails?.title,
//                   isFluidWidth: true,
//                   src: currentImage || "",
//                 },
//                 largeImage: {
//                   src: currentImage,
//                   width: 1200,
//                   height: 1800,
//                 },
//                 enlargedImageContainerDimensions: {
//                   width: "200%",
//                   height: "200%",
//                 },
//                 enlargedImageStyle: { border: "none", boxShadow: "none" },
//                 enlargedImagePosition: "right",
//               }}
//             />
//           </div>
//           {/* Thumbnail images array */}
//           <div>
//             {productDetails?.images?.length > 4 && (
//               <button onClick={prevImage} disabled={currentIndex === 0}>
//                 <ChevronLeft />
//               </button>
//             )}
//             <div>
//               {productDetails?.images?.map((image: any, index: number) => (
//                 <Image
//                   key={index}
//                   src={image.url}
//                   alt="Thumbnail"
//                   width={60}
//                   height={60}
//                   onClick={() => {
//                     setCurrentIndex(index);
//                     setCurrentImage(image);
//                   }}
//                 />
//               ))}
//             </div>
//             {productDetails?.images?.length > 4 && (
//               <button
//                 onClick={nextImage}
//                 disabled={currentIndex === productDetails?.images?.length - 1}
//               >
//                 <ChevronRight />
//               </button>
//             )}
//           </div>
//         </div>

//         {/*Middle column product details*/}
//         <div>
//           <h1>{productDetails?.title}</h1>
//           <div>
//             <div>
//               <Ratings rating={productDetails?.rating} />
//               <Link href={"#reviews"}>(0 Reviews)</Link>
//             </div>
//           </div>
//           <div>
//             <Heart
//               fill={isWishlisted ? "red" : "transparent"}
//               color={isWishlisted ? "red" : "transparent"}
//               onClick={() =>
//                 isWishlisted
//                   ? removeFromWishlist(
//                       productDetails?.id,
//                       user,
//                       location,
//                       deviceInfo,
//                     )
//                   : addToWishlist(
//                       {
//                         ...productDetails,
//                         quantity,
//                         selectedOptions: {
//                           color: isSelected,
//                           size: isSizeSelected,
//                         },
//                       },
//                       user,
//                       location,
//                       deviceInfo,
//                     )
//               }
//             />
//           </div>
//         </div>
//         <div>
//           <span>
//             Brand: <span>{productDetails?.brand || "No Brand"}</span>
//           </span>
//         </div>

//         <div>
//           <span>${productDetails?.sale_price}</span>
//         </div>
//         <div>
//           <span>{productDetails?.regular_price}</span>
//           <span>{discountPercentage}% Off</span>
//         </div>
//         <div>
//           <div>
//             {/*Color options*/}
//             {productDetails?.colors?.length > 0 && (
//               <div>
//                 <span>Color:</span>
//                 <div>
//                   {productDetails?.colors?.map((color: any, index: number) => (
//                     <button
//                       key={index}
//                       style={{ backgroundColor: color }}
//                       className={`${isSelected === color ? " " : " "}`}
//                       onClick={() => setIsSelected(color)}
//                     ></button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/*Size options*/}
//             {productDetails?.sizes?.length > 0 && (
//               <div>
//                 <span>Size:</span>
//                 <div>
//                   {productDetails?.sizes?.map((size: any, index: number) => (
//                     <button
//                       key={index}
//                       className={`${isSizeSelected === size ? " " : " "}`}
//                       onClick={() => setIsSelected(size)}
//                     >
//                       {size}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         <div>
//           <div>
//             <div>
//               <button
//                 onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
//               >
//                 -
//               </button>
//               <span>{quantity}</span>
//               <button onClick={() => setQuantity((prev) => prev + 1)}>+</button>
//             </div>
//           </div>
//           <div>
//             {productDetails?.stock > 0 ? (
//               <>
//                 <span>In Stock</span>
//                 <span>(Stock {productDetails?.stock})</span>
//               </>
//             ) : (
//               <span>Out of Stock</span>
//             )}
//           </div>
//           <button
//             className={`${isInCart ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"}`}
//             onClick={() =>
//               addToCart(
//                 {
//                   ...productDetails,
//                   quantity,
//                   selectedOptions: { color: isSelected, size: isSizeSelected },
//                 },
//                 user,
//                 location,
//                 deviceInfo,
//               )
//             }
//             disabled={isInCart}
//           >
//             <ShoppingCartIcon />
//             {isInCart ? "Added to Cart" : "Add to Cart"}
//           </button>
//         </div>

//         {/*right column + seller information*/}
//         <div>
//           <div>
//             <span>Delivery options</span>
//             <div>
//               <MapPin />
//               <span> {location?.city + ", " + location?.country}</span>
//             </div>
//           </div>

//           <div>
//             <span>Return & warranty</span>
//             <div>
//               <Package />
//               <span>7 days return</span>
//             </div>

//             <div>
//               <WalletMinimal />
//               <span>Warranty not available</span>
//             </div>
//           </div>
//           <div>
//             <div>
//               {/*Sold by section*/}
//               <div>
//                 <div>
//                   <span>Sold by</span>
//                   <span>{productDetails?.shop?.name || "Unknown Shop"}</span>
//                 </div>
//                 <Link href={"#"}>
//                   <MessageSquareText />
//                   Chat Now
//                 </Link>
//               </div>

//               {/*Seller performance stats*/}
//               <div>
//                 <div>
//                   <p>Positive Seller Ratings</p>
//                   <p>88%</p>
//                 </div>
//               </div>
//               <div>
//                 <p>Ship on Time</p>
//                 <p>90%</p>
//               </div>
//               <div>
//                 <p>Chat Response Rate</p>
//                 <p>95%</p>
//               </div>
//             </div>
//             {/*Go to store*/}
//             <Link href={`/shop/${productDetails?.Shop?.id}`}>Go to Store</Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductDetails;
