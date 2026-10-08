import { Prisma } from "@prisma/client";

// Generic helpers for building Prisma where clauses.
// Keeps controller/service code smaller and consistent.

export const containsInsensitive = (value: string) => value;

export const buildTextWhere = (field: string, value?: string): Prisma.Enumerable<any> | undefined => {
  if (!value) return undefined;
  return {
    [field]: {
      contains: String(value),
      mode: "insensitive",
    },
  };
};

