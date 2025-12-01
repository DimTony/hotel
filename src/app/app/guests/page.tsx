import React from "react";

const UserManagement = () => {
  return (
    <div className="relative min-h-screen h-full w-full bg-[url('/images/home.jpg')] bg-cover bg-center pt-10 px-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 text-white py-6">
        Guests
      </div>
    </div>
  );
};

export default UserManagement;
