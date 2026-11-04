export type Money = { minor: bigint; currency: string; scale: number };

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency || left.scale !== right.scale)
    throw new Error('Money values are incompatible');
  return { ...left, minor: left.minor + right.minor };
}
