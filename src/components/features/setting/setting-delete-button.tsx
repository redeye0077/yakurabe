"use client";

import { useState, useTransition, type MouseEvent } from "react";
import { deleteSettingAction } from "@/app/(main)/mypage/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingDeleteButtonProps = {
  id: string;
  title: string;
};

// マイページの自分の投稿カードに置く削除ボタン。確認ダイアログで確定してから削除する
export function SettingDeleteButton({ id, title }: SettingDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 送信中は Esc・背景クリック・キャンセルで閉じられないようにする
  function handleOpenChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }
    setOpen(nextOpen);
    if (nextOpen) {
      setMessage(null);
    }
  }

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      const result = await deleteSettingAction(formData);
      // not_found はすでに削除されているため、成功と同じく閉じる(カードは再検証で一覧から消える)
      if (result.status === "success" || result.status === "not_found") {
        setOpen(false);
        return;
      }
      setMessage(result.message);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        削除
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>セッティングを削除しますか?</AlertDialogTitle>
          <AlertDialogDescription>
            「{title}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {message && (
          <p role="alert" className="text-[13px] text-destructive">
            {message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? "削除中..." : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
