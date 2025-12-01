"use client";

const getEnvVar = (key: string): string | undefined => {
  if (typeof window !== "undefined") {
    return process.env[`NEXT_PUBLIC_${key}`];
  } else {
    return process.env[key];
  }
};

const defaultHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
};

export const middlewareHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  "Subscription-Key": process.env.NEXT_AUTH_MIDDLEWARE_SUBKEY as string,
};

export const roomHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  // "Subscription-Key": process.env.NEXT_AUTH_MIDDLEWARE_SUBKEY as string,
};

export const bookingHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  // "Subscription-Key": process.env.NEXT_AUTH_MIDDLEWARE_SUBKEY as string,
};

export const documentHeaders = {
  "Content-Type": "multipart/form-data; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
};

export default defaultHeaders;
