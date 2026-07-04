"use client";
import { ChevronRight, Link, Plus } from "lucide-react";
import React, { useState } from "react";

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      <div>
        <h1>Discount Codes</h1>
        <button
          onClick={() => {
            setShowModal(true);
          }}
        >
          <Plus></Plus>Create Discount Code
        </button>
      </div>
      {/*Breadcrumbs*/}
      <div>
        <Link href="/dashboard">Dashboard</Link>
        <ChevronRight />
        <span>Discount Codes</span>
      </div>

      <div>//continue from here..</div>
    </div>
  );
};

export default Page;
