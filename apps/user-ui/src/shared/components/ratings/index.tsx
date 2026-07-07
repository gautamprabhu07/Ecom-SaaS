import React, { FC } from "react";

type Props = {
  rating: number;
};

const Ratings: FC<Props> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<span key={`full-${i}`}>★</span>);
    } else {
      stars.push(<span key={`empty-${i}`}>☆</span>);
    }
  }
  return <div>{stars}</div>;
};

export default Ratings;
