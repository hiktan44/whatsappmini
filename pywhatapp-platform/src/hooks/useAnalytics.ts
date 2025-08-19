import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  overview: {
    totalCampaigns: number;
    totalMessages: number;
    sentMessages: number;
    failedMessages: number;
    successRate: number;
    totalContacts: number;
    totalTemplates: number;
  };
  campaignsByStatus: Record<string, number>;
  chartData: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
  timeframe: string;
}

export function useAnalytics(timeframe: '7d' | '30d' | '90d' = '30d') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analytics', user?.id, timeframe],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('analytics', {
        body: {
          userId: user.id,
          timeframe
        }
      });

      if (error) throw error;
      return data.data;
    },
    enabled: !!user?.id
  });
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get basic counts
      const [campaignsRes, contactsRes, templatesRes, logsRes] = await Promise.all([
        supabase.from('campaigns').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('contacts').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('templates').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('campaign_logs').select('status', { count: 'exact' })
      ]);

      const totalCampaigns = campaignsRes.count || 0;
      const totalContacts = contactsRes.count || 0;
      const totalTemplates = templatesRes.count || 0;
      const totalMessages = logsRes.count || 0;

      // Get success rate from logs
      const { data: logs } = await supabase
        .from('campaign_logs')
        .select('status');

      const sentMessages = logs?.filter(log => log.status === 'sent').length || 0;
      const successRate = totalMessages > 0 ? (sentMessages / totalMessages * 100) : 0;

      return {
        totalCampaigns,
        totalContacts,
        totalTemplates,
        totalMessages,
        sentMessages,
        successRate: Math.round(successRate * 100) / 100
      };
    },
    enabled: !!user?.id
  });
}
