import { z } from "zod";

export const leadRequestSchema = z.object({
  assessmentId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  partnerId: z.string().min(1).optional(),
  userName: z.string().trim().max(120).optional(),
  userEmail: z.string().trim().email().optional().or(z.literal("")),
  userPhone: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  requestedService: z.string().trim().max(80).optional(),
  estimatedBudget: z.string().trim().max(80).optional(),
  urgency: z.string().trim().max(40).optional(),
  zone: z.string().trim().max(80).optional(),
  source: z.string().trim().max(80).optional(),
  consentAccepted: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (data.consentAccepted !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["consentAccepted"],
      message: "Debes aceptar el consentimiento para solicitar contacto.",
    });
  }

  if (!data.userEmail && !data.userPhone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userEmail"],
      message: "Indica al menos email o teléfono.",
    });
  }
});

export type LeadRequestInput = z.infer<typeof leadRequestSchema>;
