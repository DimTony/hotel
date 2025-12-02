import { Room } from "@/lib/types";
import { Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";

interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  return (
    <button className="cursor-pointer  hover:bg-white/20 backdrop-blur-xl bg-white/10 w-full h-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-full flex flex-col justify-between px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl">{room.roomNumber}</span>
              <span className="text-gray-400">#</span>
            </div>
            <span className="text-gray-400 text-sm">{room.roomType}</span>
          </div>

          {/* <button> */}
          <ChevronRight size={16} />
          {/* </button> */}
        </div>

        <span
          className={`
    w-fit text-[8px] font-semibold leading-2 tracking-widest py-1 px-2 border rounded-md
    ${
      room.status === "Available"
        ? "bg-green-100 text-green-700 border-green-300"
        : ""
    }
    ${
      room.status === "Pending"
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : ""
    }
    ${
      room.status === "Unavailable"
        ? "bg-red-100 text-red-700 border-red-300"
        : ""
    }
  `}
        >
          {room.status}
        </span>

        <div className="py-4 px-2 gap-2 flex items-center backdrop-blur-xl bg-white/10 rounded-lg">
          <Calendar size={14} />

          <div className="flex flex-col items-start">
            <span className="text-xs">John Doe</span>
            <span className="text-[9px]">Dec 5</span>
          </div>
        </div>
      </div>
    </button>
  );
};
