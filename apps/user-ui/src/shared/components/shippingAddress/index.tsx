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
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
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
        <h2 className="text-base font-semibold text-gray-800">
          Saved Addresses
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus size={15} /> Add New Address
        </button>
      </div>

      {/* Address List placeholder */}
      <div className="text-sm text-gray-400 text-center py-10 border border-dashed border-gray-200 rounded-xl">
        {addressesLoading ? (
          "Loading addresses..."
        ) : !addresses || addresses?.length === 0 ? (
          "No saved addresses."
        ) : (
          <div>
            {addresses.map((address: any) => (
              <div
                key={address.id}
                className="bg-gray-50 rounded-lg px-4 py-3 mb-3"
              >
                {address.isDefault && (
                  <span className="text-xs text-green-600 font-medium mr-2">
                    Default
                  </span>
                )}
                <div>
                  <MapPin />
                  <div>
                    <p>
                      {address.label} - {address.name}
                    </p>
                    <p>
                      {address.street}, {address.city}, {address.zip},{" "}
                      {address.country}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => {
                      deleteAddress(address.id);
                    }}
                  >
                    <Trash2 />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add New Address
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition mt-1"
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
