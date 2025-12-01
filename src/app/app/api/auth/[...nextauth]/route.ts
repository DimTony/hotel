import NextAuth from "next-auth";
import { authOptions } from "../../_services/auth.service";


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
