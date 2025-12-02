export class Backend {
  static auth = process.env.NEXT_AUTH_MIDDLEWARE_URL;
  static room = process.env.NEXT_ROOM_MIDDLEWARE_URL;
  static booking = process.env.NEXT_BOOKING_MIDDLEWARE_URL;
}

export class Authentication {
  static login = `/api/Auth/Login`;
  static getAllUsers = `/api/Auth/Users`;
  static createUser = `/api/Auth/Register`;
  static updateUser = `/api/Auth/Users`;
  static deleteUser = `/api/Auth/Users`;
  static logout = `/api/Authentication/Logout`;
  static validateADuser = `/ad/v2/UserByNT`;
}

export class Room {
  static getAllRooms = `/api/Rooms`;
}

export default {
  Backend,
  Authentication,
  Room,
};
