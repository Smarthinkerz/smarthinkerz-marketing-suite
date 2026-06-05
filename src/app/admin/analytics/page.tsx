import { getAdminAnalytics, getAdminUsers } from "../actions";
import { AdminAnalyticsClient } from "./analytics-client";

export default async function AdminAnalyticsPage() {
  const [analytics, users] = await Promise.all([getAdminAnalytics(), getAdminUsers()]);
  return <AdminAnalyticsClient analytics={analytics} users={users} />;
}
