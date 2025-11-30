import Image from "next/image";
import React from "react";

const Loading = () => {
  return (
    <div style={styles.container}>
      {/* <img
        src="/icons/Access_logo_cut.svg"
        alt="Loading"
        style={styles.spinner}
      /> */}

      <Image
        src="/images/Access-bank1.svg"
        alt="Loading"
        style={styles.spinner}
        width={100}
        height={100}
      />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#ffffff",
  },
  spinner: {
    // width: "10rem",
    // height: "10rem",
    animation: "spinX 2s linear infinite",
  },
};

if (typeof window !== "undefined") {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(
    `
    @keyframes spinX {
      from {
        transform: rotateX(0deg);
      }
      to {
        transform: rotateX(360deg);
      }
    }
  `,
    styleSheet.cssRules.length
  );
}

export default Loading;

// "use client";

// import React from "react";

// export default function Loading() {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
//       <div className="flex flex-col items-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
//         <p className="mt-4 text-gray-700 font-medium">Loading...</p>
//       </div>
//     </div>
//   );
// }
