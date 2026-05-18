import type { ConditionRiskItem, ConditionRiskCategory } from './types';

export type ConditionRiskSummary = {
  items: ConditionRiskItem[];
  highPriorityCount: number;
  reviewCount: number;
  okCount: number;
  overallCategory: ConditionRiskCategory;
  requiresProfessionalReview: boolean;
};

export function buildConditionRiskSummary(items: ConditionRiskItem[]): ConditionRiskSummary {
  const highPriorityCount = items.filter((i) => i.category === 3).length;
  const reviewCount = items.filter((i) => i.category === 2).length;
  const okCount = items.filter((i) => i.category === 1).length;

  let overallCategory: ConditionRiskCategory = 1;
  if (highPriorityCount > 0) overallCategory = 3;
  else if (reviewCount > 0) overallCategory = 2;

  const requiresProfessionalReview = items.some((i) => i.requiresProfessionalReview);

  return {
    items,
    highPriorityCount,
    reviewCount,
    okCount,
    overallCategory,
    requiresProfessionalReview,
  };
}

export function getTopRiskItems(items: ConditionRiskItem[], maxCount = 5): ConditionRiskItem[] {
  return [...items]
    .sort((a, b) => {
      if (b.category !== a.category) return b.category - a.category;
      return 0;
    })
    .slice(0, maxCount);
}
