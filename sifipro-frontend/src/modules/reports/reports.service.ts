import { apiClient } from "../../lib/api-client";
import type { RedemptionResponse } from "../redemptions/redemptions.types";
import type {
  CustomerResponse,
  PurchaseTransactionResponse,
} from "../transactions/transactions.types";
import type { RewardResponse } from "../rewards/rewards.types";
import type {
  ReportsData,
  ReportsScopeSummary,
  TopCustomerResponse,
  TopRedeemedRewardResponse,
} from "./reports.types";

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalizedValue = value.replaceAll(",", "").trim();
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function filterRedemptionsByProgram(
  redemptions: RedemptionResponse[],
  programConfigId: number,
): RedemptionResponse[] {
  return redemptions.filter(
    (redemption) => redemption.programConfigId === programConfigId,
  );
}

function buildSummary(
  customers: CustomerResponse[],
  rewards: RewardResponse[],
  transactions: PurchaseTransactionResponse[],
  redemptions: RedemptionResponse[],
): ReportsScopeSummary {
  const totalPointsIssuedInProgram = transactions.reduce(
    (sum, transaction) =>
      sum +
      toNumber(
        transaction.awardedPoints ?? transaction.pointsEarned ?? 0,
      ),
    0,
  );

  const totalPointsRedeemedInProgram = redemptions.reduce(
    (sum, redemption) => sum + toNumber(redemption.pointsUsed),
    0,
  );

  return {
    tenantCustomers: customers.length,
    tenantActiveCustomers: customers.filter((customer) => customer.active)
      .length,
    programRewards: rewards.length,
    programActiveRewards: rewards.filter((reward) => reward.active).length,
    programTransactions: transactions.length,
    programRedemptions: redemptions.length,
    totalPointsIssuedInProgram,
    totalPointsRedeemedInProgram,
  };
}

function buildTopCustomers(
  customers: CustomerResponse[],
  transactions: PurchaseTransactionResponse[],
  redemptions: RedemptionResponse[],
): TopCustomerResponse[] {
  const transactionCounts = new Map<number, number>();
  const redemptionCounts = new Map<number, number>();

  for (const transaction of transactions) {
    transactionCounts.set(
      transaction.customerId,
      (transactionCounts.get(transaction.customerId) ?? 0) + 1,
    );
  }

  for (const redemption of redemptions) {
    redemptionCounts.set(
      redemption.customerId,
      (redemptionCounts.get(redemption.customerId) ?? 0) + 1,
    );
  }

  return customers
    .map((customer) => ({
      customerId: customer.id,
      customerFullName: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      pointsBalance: customer.pointsBalance,
      active: customer.active,
      transactionsCount: transactionCounts.get(customer.id) ?? 0,
      redemptionsCount: redemptionCounts.get(customer.id) ?? 0,
    }))
    .filter(
      (customer) =>
        (customer.transactionsCount ?? 0) > 0 ||
        (customer.redemptionsCount ?? 0) > 0,
    )
    .sort((left, right) => {
      const activityDelta =
        (right.transactionsCount ?? 0) +
        (right.redemptionsCount ?? 0) -
        ((left.transactionsCount ?? 0) + (left.redemptionsCount ?? 0));

      if (activityDelta !== 0) {
        return activityDelta;
      }

      return toNumber(right.pointsBalance) - toNumber(left.pointsBalance);
    })
    .slice(0, 10);
}

function buildTopRedeemedRewards(
  rewards: RewardResponse[],
  redemptions: RedemptionResponse[],
): TopRedeemedRewardResponse[] {
  const redemptionCounts = new Map<number, number>();
  const rewardNames = new Map<number, string>();

  for (const reward of rewards) {
    rewardNames.set(reward.id, reward.name);
  }

  for (const redemption of redemptions) {
    redemptionCounts.set(
      redemption.rewardId,
      (redemptionCounts.get(redemption.rewardId) ?? 0) + 1,
    );

    if (!rewardNames.has(redemption.rewardId)) {
      rewardNames.set(redemption.rewardId, redemption.rewardName);
    }
  }

  return Array.from(redemptionCounts.entries())
    .map(([rewardId, totalRedemptions]) => ({
      rewardId,
      rewardName: rewardNames.get(rewardId) ?? `Reward #${rewardId}`,
      totalRedemptions,
    }))
    .sort((left, right) => right.totalRedemptions - left.totalRedemptions)
    .slice(0, 10);
}

export async function getReportsData(
  programConfigId: number,
): Promise<ReportsData> {
  const [customersResponse, transactionsResponse, redemptionsResponse, rewardsResponse] =
    await Promise.all([
      apiClient.get<CustomerResponse[]>("/api/customers"),
      apiClient.get<PurchaseTransactionResponse[]>(
        `/api/transactions/program/${programConfigId}`,
      ),
      apiClient.get<RedemptionResponse[]>("/api/redemptions"),
      apiClient.get<RewardResponse[]>(
        `/api/rewards/programs/${programConfigId}`,
      ),
    ]);

  const customers = Array.isArray(customersResponse.data)
    ? customersResponse.data
    : [];
  const transactions = Array.isArray(transactionsResponse.data)
    ? transactionsResponse.data
    : [];
  const allRedemptions = Array.isArray(redemptionsResponse.data)
    ? redemptionsResponse.data
    : [];
  const rewards = Array.isArray(rewardsResponse.data) ? rewardsResponse.data : [];

  const redemptions = filterRedemptionsByProgram(allRedemptions, programConfigId);

  return {
    summary: buildSummary(customers, rewards, transactions, redemptions),
    topCustomers: buildTopCustomers(customers, transactions, redemptions),
    topRedeemedRewards: buildTopRedeemedRewards(rewards, redemptions),
  };
}
