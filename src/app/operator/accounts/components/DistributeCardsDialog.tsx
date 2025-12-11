"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { distributeCards as distributeCardsAPI } from "@/lib/api/accounts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DistributeCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string; // UUID
  accountUsername: string;
  onSuccess?: () => void;
}

export const DistributeCardsDialog = ({
  open,
  onOpenChange,
  accountId,
  accountUsername,
  onSuccess,
}: DistributeCardsDialogProps) => {
  const queryClient = useQueryClient();

  const { mutate: distributeCards, isPending: distributing, error } = useMutation({
    mutationFn: () => distributeCardsAPI(accountId),
    onSuccess: (data) => {
      // Invalidate accounts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onSuccess?.();
      onOpenChange(false);
      toast.success(`成功分配 ${data.count} 张卡片给 ${accountUsername}`);
    },
  });

  const handleDistribute = () => {
    distributeCards();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分配所有卡片给 {accountUsername}</DialogTitle>
          <DialogDescription>
            将知识库中的所有卡片分配给该账户。已存在的卡片将被跳过。
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {(error as Error).message || "分配失败"}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={distributing}
          >
            取消
          </Button>
          <Button onClick={handleDistribute} disabled={distributing}>
            {distributing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分配中...
              </>
            ) : (
              "确认分配"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

