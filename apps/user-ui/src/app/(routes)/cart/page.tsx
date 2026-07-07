// "use client";
// import React from "react";
// import { useRouter } from "next/navigation";
// import useUser from "../../../hooks/useUser";
// import useLocationTracking from "../../../hooks/useLocationTracking";
// import useDeviceTracking from "../../../hooks/useDeviceTracking";
// import Link from "next/link";
// import { useStore } from "apps/user-ui/src/store";
// import Image from "next/image";

// const CartPage = () => {
//   const router = useRouter();
//   const { user } = useUser();
//   const location = useLocationTracking();
//   const deviceInfo = useDeviceTracking();
//   const cart = useStore((state: any) => state.cart);
//   const removeFromCart = useStore((state: any) => state.removeFromCart);
//   return (
//     <div>
//       <div>
//         <div>
//           <h1>Shopping Cart</h1>
//           <Link href={"/"}>Home</Link>
//           <span>Cart</span>
//         </div>

//         {cart.length === 0 ? (
//           <div>
//             <p>Your cart is empty.</p>
//           </div>
//         ) : (
//           <div>
//             <table>
//               <thead>
//                 <tr>
//                   <th>Product</th>
//                   <th>Price</th>
//                   <th>Quantity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {cart?.map((item: any) => (
//                   <tr key={item.id}>
//                     <td>
//                       <Image
//                         src={item?.images[0]?.url}
//                         alt={item.title}
//                         width={50}
//                         height={50}
//                       />
//                       <div>
//                         <span>{item.title}</span>
//                         {item?.selectedOptions && (
//                           <div>
//                             {item?.selectedOptions?.color && (
//                               <span>
//                                 Color: {}{" "}
//                                 <span
//                                   style={{
//                                     backgroundColor:
//                                       item?.selectedOptions?.color,
//                                   }}
//                                 />
//                               </span>
//                             )}
//                             {item?.selectedOptions?.size && (
//                               <span>Size: {item?.selectedOptions?.size}</span>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td>{item.name}</td>
//                     <td>{item.price}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CartPage;
