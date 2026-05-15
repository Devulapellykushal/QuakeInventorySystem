// @maintained quake-inventory-system
/**
 * Staff invite links (admin).
 */
import { apiClient } from "@/lib/api/client";

export interface StaffInvite {
  id: string;
  token: string;
  email: string;
  organizationName: string;
  inviteUrl: string;
  expiresAt: string;
  usedAt: string | null;
  isUsed: boolean;
  isExpired: boolean;
  isActive: boolean;
  createdByEmail: string | null;
  createdAt: string;
}

export interface CreateStaffInvitePayload {
  email?: string;
  expiresInDays?: number;
}

export const staffInvitesService = {
  async list(): Promise<StaffInvite[]> {
    const response = await apiClient.get<StaffInvite[]>("/admin/staff-invites/");
    return response.data;
  },

  async create(data: CreateStaffInvitePayload): Promise<StaffInvite> {
    const response = await apiClient.post<StaffInvite>("/admin/staff-invites/", {
      email: data.email ?? "",
      expires_in_days: data.expiresInDays ?? 7,
    });
    return response.data;
  },
};
