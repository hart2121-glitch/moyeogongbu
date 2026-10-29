import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../shell/model/paths";
import { normalizeDisplayName, type Profile } from "../model/account";
import { accountStore } from "../model/accountStore";
import { useSession } from "./SessionContext";

const profileKey = (userId: string | undefined) => ["profile", userId] as const;

/**
 * 로그인한 계정의 프로필 쿼리. 로그아웃 상태면 요청하지 않는다.
 * @example const { data: profile } = useProfile();
 */
export function useProfile() {
  const userId = useSession()?.user.id;
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: () => accountStore.fetchProfile(userId!),
    enabled: !!userId,
  });
}

/** 접근 제어 판정. loading은 세션이나 프로필을 아직 확인하는 중. */
export type AccountStatus =
  | "loading"
  | "error"
  | "signedOut"
  | "needsName"
  | "ready";

/**
 * 로그인과 화면 이름 설정 여부로 들어갈 수 있는 화면을 판정한다.
 * @example const { status, retry } = useAccountStatus();
 */
export function useAccountStatus(): { status: AccountStatus; retry: () => void } {
  const session = useSession();
  const profile = useProfile();
  const retry = () => void profile.refetch();
  if (session === undefined) return { status: "loading", retry };
  if (session === null) return { status: "signedOut", retry };
  if (profile.isError) return { status: "error", retry };
  if (!profile.data) return { status: "loading", retry };
  return { status: profile.data.displayName ? "ready" : "needsName", retry };
}

/**
 * 화면 이름 입력과 저장. 저장하면 프로필 캐시도 새 값으로 바뀐다.
 * @param initial 입력칸의 처음 값
 * @example const { nameInput, setNameInput, save } = useDisplayNameForm("");
 */
export function useDisplayNameForm(initial: string) {
  const queryClient = useQueryClient();
  const userId = useSession()?.user.id;
  const [nameInput, setNameInput] = useState(initial);
  const mutation = useMutation({
    mutationFn: (name: string) => accountStore.updateDisplayName(userId!, name),
    onSuccess: (profile: Profile) =>
      queryClient.setQueryData(profileKey(profile.id), profile),
  });
  const name = normalizeDisplayName(nameInput);
  /** 입력이 규칙에 맞으면 저장한다. 저장에 성공하면 true. */
  const save = async () => {
    if (!name) return false;
    await mutation.mutateAsync(name);
    return true;
  };
  return {
    nameInput,
    setNameInput,
    /** 입력이 1~12자 규칙에 맞는지. */
    valid: !!name,
    save,
    saving: mutation.isPending,
    failed: mutation.isError,
  };
}

/**
 * Google 로그인 시작. 로그인을 마치면 로비 주소로 돌아온다.
 * @example const { signIn, pending } = useSignIn();
 */
export function useSignIn() {
  const mutation = useMutation({
    mutationFn: () =>
      accountStore.signInWithGoogle(`${window.location.origin}${ROUTES.lobby}`),
  });
  return {
    signIn: () => mutation.mutate(),
    pending: mutation.isPending,
    failed: mutation.isError,
  };
}

/**
 * 로그아웃과 계정 삭제. 둘 다 끝나면 캐시를 비우고 로그인 화면으로 간다.
 * @example const { signOut, deleteAccount } = useAccountActions();
 */
export function useAccountActions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const leave = () => {
    queryClient.clear();
    navigate(ROUTES.login, { replace: true });
  };
  const signOut = useMutation({
    mutationFn: accountStore.signOut,
    onSuccess: leave,
  });
  const remove = useMutation({
    mutationFn: accountStore.deleteAccount,
    onSuccess: leave,
  });
  return {
    signOut: () => signOut.mutate(),
    deleteAccount: () => remove.mutate(),
    pending: signOut.isPending || remove.isPending,
    failed: signOut.isError || remove.isError,
  };
}
