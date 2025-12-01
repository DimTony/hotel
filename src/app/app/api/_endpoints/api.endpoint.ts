export class Backend {
  static auth = process.env.NEXT_AUTH_MIDDLEWARE_URL;
  static room = process.env.NEXT_ROOM_MIDDLEWARE_URL;
  static booking = process.env.NEXT_BOOKING_MIDDLEWARE_URL;
}

export class Authentication {
  // POST
  // static login = `/api/Authentication/Login`;
  static login = `/api/Auth/Login`;

  // POST
  static getAllUsers = `/api/Auth/Users`;

  static createUser = `/api/Auth/Register`;

  // POST
  static logout = `/api/Authentication/Logout`;

  // POST
  static refresh = `/api/Authentication/Refresh`;

  // GET COUNT BY GRADE
  static mockLogin = `/api/Authentication/MockLogin`;

  static validateADuser = `/ad/v2/UserByNT`;

  // GET
  static getOne = (_: any, code: string) => `/api/Appraisal/${code}`;

  // DELETE
  static delete = (_: any, code: string) => `/api/Appraisal/${code}`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class Dashboard {
  // POST
  static counts = `/api/Dashboard/GetDashboardCounts`;

  // POST
  static data = `/api/Dashboard/GetDashboardData`;

  // POST
  static refresh = `/api/Authentication/Refresh`;

  // GET COUNT BY GRADE
  static mockLogin = `/api/Authentication/MockLogin`;

  // GET
  static getOne = (_: any, code: string) => `/api/Appraisal/${code}`;

  // DELETE
  static delete = (_: any, code: string) => `/api/Appraisal/${code}`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class Deliverables {
  // POST
  static create = `/api/DeliverableItem/CreateItem`;

  // POST
  static getAllOfficers = `/api/DeliverableItem/GetAllOfficers`;

  // PUT - Add this line
  static update = `/api/DeliverableItem/UpdateItem`;

  // POST
  static upload = `/api/DeliverableItem/AddDocument`;

  static getDeliverables = `/api/DeliverableItem/GetAllItems`;

  // GET - Add this line for the export endpoint
  static exportDeliverable = `/api/DeliverableItem/ExportDeliverable`;

  // GET COUNT BY GRADE
  static mockLogin = `/api/Authentication/MockLogin`;

  // GET
  static getOne = (id: number) => `/api/DeliverableItem/GetItemById/${id}`;

  // DELETE
  static delete = (_: any, code: string) => `/api/Appraisal/${code}`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class UserManagement {
  // POST
  static changeStatus = `/api/User/ChangeUserStatus`;

  // POST
  static getUsers = `/api/User/GetUsers`;

  static getPendingCreations = `/api/User/GetUsers`;

  static getPendingModifications = `/api/User/GetUsers`;

  static getPendingDeletions = `/api/User/GetUsers`;

  static getRoles = `api/RoleContoller/GetRoles`;

  static getDivisions = `api/User/GetDivisions`;

  // POST
  static updateUser = `/api/User/UpdateUser`;

  static addNewUser = `api/User/CreateUser`;

  static deleteUser = `api/User/DeleteUser`;

  // GET COUNT BY GRADE
  static downloadReport = `/api/User/ExportUserManagement`;

  // GET COUNT BY GRADE
  static downloadAuditTrailReport = `/api/Audit/ExportAuditLog`;

  // GET
  static getOne = (_: any, code: string) => `/api/Appraisal/${code}`;

  // DELETE
  static delete = (_: any, code: string) => `/api/Appraisal/${code}`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class EscalationMatrix {
  // GET
  static getAllEscalations = `/api/EscalationMatrix/GetAllEscalations`;

  // POST
  static createRule = `/api/EscalationMatrix/CreateEscalation`;

  // GET
  static getOne = (id: number) =>
    `/api/EscalationMatrix/GetEscalationById/${id}`;

  // POST
  static update = `/api/EscalationMatrix/UpdateEscalation`;

  // DELETE
  static delete = (id: number) =>
    `/api/EscalationMatrix/DeleteEscalation/${id}`;

  // GET COUNT BY GRADE
  static downloadReport = `/api/User/ExportUserManagement`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class Audit {
  // POST
  static viewAuditLogs = `/api/Audit/ViewAuditLogs`;

  // POST
  static downloadAuditReport = `/api/Audit/ExportAuditLog`;

  // POST
  static updateUser = `/api/User/UpdateUser`;

  // GET COUNT BY GRADE
  static downloadReport = `/api/Audit/ExportAuditLog`;

  // GET
  static getOne = (_: any, code: string) => `/api/Appraisal/${code}`;

  // DELETE
  static delete = (_: any, code: string) => `/api/Appraisal/${code}`;

  // PUT
  static edit = (_: any, code: string) => `/api/Appraisal/${code}`;

  // GET
  static staffKPITemplateReviews = `/api/Appraisal/GetStaffsKPITemplateReviews`;

  // GET
  static closeTemplateReviews = (_: any, reviewCode: string) =>
    `/api/Appraisal/CloseRequestedKPIReview/${reviewCode}`;
}

export class GroupHead {
  // GET
  static getAllGroupHeadDeliverables = `/api/GroupHead/GetAllGroupHeadDeliverable`;

  // GET - Add this line for the export endpoint
  static exportGroupHeadDeliverables = `/api/GroupHead/ExportGroupHeadDeliverables`;
}

export default {
  Backend,
  Authentication,
  Dashboard,
  Deliverables,
  UserManagement,
  EscalationMatrix,
  Audit,
  GroupHead,
};
