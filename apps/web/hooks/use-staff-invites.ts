// @maintained quake-inventory-system
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateStaffInvitePayload,
  staffInvitesService,
} from "@/services/staff-invites.service";

const STAFF_INVITES_KEY = ["staff-invites"];

export function useStaffInvites() {
  return useQuery({
    queryKey: STAFF_INVITES_KEY,
    queryFn: () => staffInvitesService.list(),
  });
}

export function useCreateStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInvitePayload) =>
      staffInvitesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_INVITES_KEY });
    },
  });
}
