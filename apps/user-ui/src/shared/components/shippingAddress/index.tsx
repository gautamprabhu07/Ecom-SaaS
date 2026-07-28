// Path: apps/user-ui/src/shared/components/shippingAddress/index.tsx
"use client";
import { MapPin, Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import { countries } from "../../../utils/countries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

const inputClass =
  "w-full border border-[#E7E5E4] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]";
const errorClass = "text-red-500 text-xs mt-1";

const ShippingAddressSection = () => {
  const [showModal, setShowModal] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "Home",
      name: "",
      street: "",
      city: "",
      zip: "",
      country: "",
      isDefault: "false",
    },
  });

  const queryClient = useQueryClient();
  const { mutate: addAddress } = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axiosInstance.post("/api/add-address", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
      reset();
      setShowModal(false);
    },
  });

  //Get addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  const onSubmit = (data: any) =>
    addAddress({ ...data, isDefault: data?.isDefault === "true" });

  const { mutate: deleteAddress } = useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(`/api/delete-address/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-base font-bold text-[#292524]">
          Saved Addresses
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium px-3.5 py-2 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.35)] active:translate-y-0 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
        >
          <Plus size={15} className="transition-transform duration-200 group-hover:rotate-90" /> Add New Address
        </button>
      </div>

      {/* Address List placeholder */}
      <div className="text-sm text-[#78716C] text-center py-10 border border-dashed border-[#E7E5E4] rounded-2xl">
        {addressesLoading ? (
          "Loading addresses..."
        ) : !addresses || addresses?.length === 0 ? (
          "No saved addresses."
        ) : (
          <div className="px-4">
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className="group bg-[#FAF8F3] rounded-2xl px-4 py-3 mb-3 text-left border border-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-[#059669]/30 hover:shadow-[0_10px_30px_-8px_rgba(120,53,15,0.15)]"
              >
                {address.isDefault && (
                  <span className="inline-block text-xs text-[#059669] font-semibold bg-[#D1FAE5] px-2 py-0.5 rounded-full mb-2">
                    Default
                  </span>
                )}
                <div className="flex items-start gap-2">
                  <MapPin
                    size={16}
                    className="text-[#059669] shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#292524]">
                      {address.label} - {address.name}
                    </p>
                    <p className="text-xs text-[#78716C]">
                      {address.street}, {address.city}, {address.zip},{" "}
                      {address.country}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      deleteAddress(address.id);
                    }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 hover:gap-1.5 transition-all duration-200"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292524]/40">
            <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(120,53,15,0.15)] w-full max-w-md p-6 animate-[dropdown-in_200ms_ease-out]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-lg font-bold text-[#292524]">
                  Add New Address
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#78716C] hover:text-[#292524] hover:rotate-90 transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <select className={inputClass} {...register("label")}>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>

                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={inputClass}
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <p className={errorClass}>
                      {errors.name.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Street Address"
                    className={inputClass}
                    {...register("street", { required: "Street is required" })}
                  />
                  {errors.street && (
                    <p className={errorClass}>
                      {errors.street.message as string}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="City"
                      className={inputClass}
                      {...register("city", { required: "City is required" })}
                    />
                    {errors.city && (
                      <p className={errorClass}>
                        {errors.city.message as string}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      className={inputClass}
                      {...register("zip", { required: "Zip code is required" })}
                    />
                    {errors.zip && (
                      <p className={errorClass}>
                        {errors.zip.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <select
                  className={inputClass}
                  {...register("country", { required: "Country is required" })}
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className={errorClass}>
                    {errors.country.message as string}
                  </p>
                )}

                <select className={inputClass} {...register("isDefault")}>
                  <option value="false">Set as Default: No</option>
                  <option value="true">Set as Default: Yes</option>
                </select>

                <button
                  type="submit"
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2.5 rounded-full text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(5,150,105,0.35)] active:translate-y-0 mt-1 shadow-[0_4px_20px_-4px_rgba(120,53,15,0.08)]"
                >
                  Save Address
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingAddressSection;
