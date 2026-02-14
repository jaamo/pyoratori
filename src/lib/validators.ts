import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Virheellinen sähköpostiosoite"),
  password: z.string().min(1, "Salasana vaaditaan"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nimi on liian lyhyt").max(100, "Nimi on liian pitkä"),
    email: z.string().email("Virheellinen sähköpostiosoite"),
    password: z
      .string()
      .min(8, "Salasanan on oltava vähintään 8 merkkiä")
      .max(100, "Salasana on liian pitkä"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Salasanat eivät täsmää",
    path: ["confirmPassword"],
  });

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Virheellinen sähköpostiosoite"),
});

export const passwordResetSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Salasanan on oltava vähintään 8 merkkiä"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Salasanat eivät täsmää",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  title: z
    .string()
    .min(3, "Otsikon on oltava vähintään 3 merkkiä")
    .max(200, "Otsikko on liian pitkä"),
  description: z
    .string()
    .min(10, "Kuvauksen on oltava vähintään 10 merkkiä")
    .max(5000, "Kuvaus on liian pitkä"),
  price: z
    .number()
    .min(0, "Hinnan on oltava positiivinen")
    .max(999999, "Hinta on liian suuri"),
  location: z
    .string()
    .min(2, "Sijainti vaaditaan")
    .max(100, "Sijainti on liian pitkä"),
  categoryId: z.string().min(1, "Kategoria vaaditaan"),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  imageIds: z.array(z.string()),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Viesti ei voi olla tyhjä")
    .max(2000, "Viesti on liian pitkä"),
});

export const searchAlertSchema = z.object({
  name: z.string().min(1, "Nimi vaaditaan").max(100),
  categoryId: z.string().optional(),
  query: z.string().optional(),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SearchAlertInput = z.infer<typeof searchAlertSchema>;
