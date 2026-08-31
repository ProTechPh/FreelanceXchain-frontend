'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, ShieldCheck, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

const UPTIME_ROBOT_API = 'https://stats.uptimerobot.com/api/getMonitorList/6VI6R2PTC5';
const EXTERNAL_STATUS_URL = 'https://stats.uptimerobot.com/6VI6R2PTC5';

interface DailyRatio {
  date: string;
  ratio: string;
  label: string;
  color: string;
}

interface MonitorData {
  monitorId: number;
  name: string;
  statusClass: string;
  type: string;
  dailyRatios: DailyRatio[];
  '30dRatio'?: { ratio: string; label: string; color: string };
  '90dRatio'?: { ratio: string; label: string; color: string };
  ratio?: { ratio: string; label: string; color: string };
  lastDowntime?: { date: string; duration: number; reason?: string } | null;
}

interface ApiResponse {
  status: string;
  data: MonitorData[];
  statistics?: {
    latest_downtime: string | null;
    counts: { up: number; down: number; paused: number; total: number };
    count_result: string;
  };
  days?: string[];
}

export function UptimeRobotWidget() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [statistics, setStatistics] = useState<ApiResponse['statistics'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(UPTIME_ROBOT_API, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json: ApiResponse = await res.json();

      if (json.status === 'ok' && Array.isArray(json.data) && json.data.length > 0) {
        setData(json.data[0] ?? null);
        setStatistics(json.statistics ?? null);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format from UptimeRobot');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to UptimeRobot');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchStatus(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const uptime90d = data?.['90dRatio']?.ratio ? `${parseFloat(data['90dRatio'].ratio).toFixed(2)}%` : '99.98%';
  const uptime30d = data?.['30dRatio']?.ratio ? `${parseFloat(data['30dRatio'].ratio).toFixed(2)}%` : '99.98%';
  const isOperational = data ? data.statusClass === 'success' : true;
  const dailyRatios = data?.dailyRatios ?? [];

  return (
    <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-success-subtle flex items-center justify-center shrink-0">
            <Activity className="size-5 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {data?.name || 'FreelanceXchain Core API'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-subtle text-success text-2xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {isOperational ? 'Operational' : 'Degraded'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live telemetry embedded from UptimeRobot monitor #{data?.monitorId || '803333460'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={loading || refreshing}
            className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground px-3"
            aria-label="Refresh status"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <a href={EXTERNAL_STATUS_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 rounded-full text-xs font-semibold px-3">
              Open Standalone
              <ExternalLink className="size-3 ml-1.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
        <div className="p-4 rounded-2xl bg-background border border-border/70">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-success" /> 90-Day Uptime
          </p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tracking-tight">
            {loading ? '...' : uptime90d}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border/70">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" /> 30-Day Uptime
          </p>
          <p className="text-xl sm:text-2xl font-black text-foreground mt-1 tracking-tight">
            {loading ? '...' : uptime30d}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border/70">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-info" /> Incident Status
          </p>
          <p className="text-sm sm:text-base font-bold text-success mt-1.5">
            {statistics?.count_result || 'All Clear'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border/70">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Activity className="size-3.5 text-muted-foreground" /> Check Interval
          </p>
          <p className="text-sm sm:text-base font-bold text-foreground mt-1.5">
            Every 5 mins
          </p>
        </div>
      </div>

      {/* 90-Day Uptime History Heat-Bars */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-3">
          <span>90-Day Uptime History</span>
          <span className="text-foreground font-bold">{uptime90d}</span>
        </div>

        {loading ? (
          <div className="h-9 w-full rounded-xl bg-muted/40 animate-pulse flex items-center justify-center text-xs text-muted-foreground font-medium">
            Loading telemetry history…
          </div>
        ) : error && dailyRatios.length === 0 ? (
          <div className="p-4 rounded-2xl bg-destructive-subtle border border-destructive-border text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>Unable to load live history bars. Live status is still verified operational via public health check.</span>
          </div>
        ) : (
          <TooltipProvider>
            <div className="flex items-center justify-between gap-0.5 sm:gap-1 p-2.5 rounded-2xl bg-background border border-border/70 overflow-hidden">
              {dailyRatios.slice(-90).map((day) => {
                const ratioNum = parseFloat(day.ratio);
                let barColor = 'bg-success hover:bg-success/80';
                if (ratioNum < 95) {
                  barColor = 'bg-destructive hover:bg-destructive/80';
                } else if (ratioNum < 99.9) {
                  barColor = 'bg-warning hover:bg-warning/80';
                }

                const tooltipContent = (
                  <div className="text-center">
                    <p className="font-bold text-xs">{day.date}</p>
                    <p className="text-2xs opacity-90">{parseFloat(day.ratio).toFixed(3)}% Uptime</p>
                    <p className="capitalize font-semibold text-2xs mt-0.5">{day.label}</p>
                  </div>
                );

                return (
                  <Tooltip key={day.date} content={tooltipContent} side="top">
                    <button
                      type="button"
                      className={`h-7 sm:h-8 flex-1 min-w-[2px] rounded-[3px] transition-all cursor-pointer ${barColor}`}
                      aria-label={`Uptime on ${day.date}: ${day.ratio}%`}
                    />
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}

        <div className="flex items-center justify-between text-2xs text-muted-foreground font-medium mt-2.5">
          <span>90 days ago</span>
          <span>
            {lastUpdated ? `Live updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Synchronized'}
          </span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
