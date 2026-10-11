// 앱 내 구매 (RevenueCat). 인터넷을 쓰는 곳은 이 파일뿐입니다.
// - 구매 성공 시 ownedPacks 에 저장 → 오프라인에서도 그 저장값으로 잠금 해제
// - 앱을 열 때 인터넷이 있으면 권한을 다시 확인해 ownedPacks 갱신, 실패하면 저장값 유지
//
// API 키는 .env 에 넣습니다 (예시: .env.example). 키가 없거나 Expo Go/웹에서 실행 중이면
// 결제 SDK를 쓰지 않고, 개발 중(__DEV__)에만 "테스트 구매"로 잠금 해제를 흉내 냅니다.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { PACKS } from './data/catalog';
import type { Pack } from './data/types';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
});

const isExpoGo = Constants.executionEnvironment === 'storeClient';
export const purchasesAvailable = Platform.OS !== 'web' && !isExpoGo && !!API_KEY;
export const devFakePurchases = !purchasesAvailable && __DEV__;

let rc: typeof Purchases | null = null;

function sdk(): typeof Purchases | null {
  if (!purchasesAvailable) return null;
  if (!rc) {
    Purchases.configure({ apiKey: API_KEY! });
    rc = Purchases;
  }
  return rc;
}

export type PurchaseResult =
  | { ok: true; owned: Pack[] }
  | { ok: false; reason: 'cancelled' | 'offline' | 'unavailable' | 'error'; message: string };

const OFFLINE_MSG = '구매는 인터넷 연결 후 가능해요';

function ownedFromEntitlements(active: Record<string, unknown>): Pack[] {
  return Object.values(PACKS)
    .filter((p) => active[p.entitlement])
    .map((p) => p.id);
}

function toFailure(e: any): PurchaseResult {
  const codes = rc?.PURCHASES_ERROR_CODE;
  if (e?.userCancelled || (codes && e?.code === codes.PURCHASE_CANCELLED_ERROR)) {
    return { ok: false, reason: 'cancelled', message: '' };
  }
  if (codes && (e?.code === codes.NETWORK_ERROR || e?.code === codes.OFFLINE_CONNECTION_ERROR)) {
    return { ok: false, reason: 'offline', message: OFFLINE_MSG };
  }
  return { ok: false, reason: 'error', message: '지금은 구매할 수 없어요. 잠시 뒤 다시 시도해 주세요.' };
}

/** 앱 시작 시 호출. 확인에 실패하면 null → 저장값을 그대로 씁니다. */
export async function refreshOwnedPacks(): Promise<Pack[] | null> {
  const p = sdk();
  if (!p) return null;
  try {
    const info = await p.getCustomerInfo();
    return ownedFromEntitlements(info.entitlements.active);
  } catch {
    return null;
  }
}

export async function buyPack(packId: Pack, current: Pack[]): Promise<PurchaseResult> {
  if (devFakePurchases) return { ok: true, owned: [...new Set([...current, packId])] };
  const p = sdk();
  if (!p) return { ok: false, reason: 'unavailable', message: '이 환경에서는 구매할 수 없어요.' };
  try {
    const [product] = await p.getProducts([packId], p.PURCHASE_TYPE.INAPP);
    if (!product) return { ok: false, reason: 'offline', message: OFFLINE_MSG };
    const { customerInfo } = await p.purchaseStoreProduct(product);
    return { ok: true, owned: ownedFromEntitlements(customerInfo.entitlements.active) };
  } catch (e) {
    return toFailure(e);
  }
}

export async function restorePurchases(current: Pack[]): Promise<PurchaseResult> {
  if (devFakePurchases) return { ok: true, owned: current };
  const p = sdk();
  if (!p) return { ok: false, reason: 'unavailable', message: '이 환경에서는 복원할 수 없어요.' };
  try {
    const info = await p.restorePurchases();
    return { ok: true, owned: ownedFromEntitlements(info.entitlements.active) };
  } catch (e) {
    return toFailure(e);
  }
}
