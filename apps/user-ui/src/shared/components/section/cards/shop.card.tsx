import React from "react";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    coverBanner?: string;
    address?: string;
    followers?: [];
    rating?: number;
    category?: string;
  };
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <div>
      {/*Cover*/}
      <div>
        <Image
          src={shop.coverBanner || ""}
          alt={shop.name}
          width={400}
          height={200}
        />
      </div>

      {/*Avatar*/}
      <div>
        <Image
          src={shop.avatar || ""}
          alt={shop.name}
          width={100}
          height={100}
        />
      </div>

      {/*Info*/}
      <div>
        <h3>{shop?.name}</h3>
        <p>{shop?.followers?.length ?? 0} followers</p>

        {/*Address + Rating*/}
        <div>
          {shop.address && (
            <span>
              <MapPin />
              <span>{shop.address}</span>
            </span>
          )}
          <span>
            <Star />
            {shop.rating ?? "N/A"}
          </span>
        </div>

        {/*Category*/}
        {shop.category && (
          <div>
            <span>{shop.category}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopCard;
