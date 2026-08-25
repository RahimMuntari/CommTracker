import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MtnCallRecord } from '../model/mtn-call-record';
import { MtnSubscriberInfo } from '../model/mtn-subscriber-info';
import { TelecelCallRecord } from '../model/telecel-call-record';
import { TelecelSubscriberInfo } from '../model/telecel-subscriber-info';
import { MtnCallRecordService } from '../services/mtn-call-record-service';
import { TelecelCall } from '../services/telecel-call';
import { SubscriberMap } from './subscriber-map/subscriber-map';

type DataProvider = 'mtn' | 'telecel';

type DashboardSubscriber = {
  subscriberKey: string;
  subscriberNumber: string;
  fullName: string;
  region: string;
  homeCell: string;
};

type DashboardCallRecord = {
  id: number;
  subscriberId: string;
  msisdn: string;
  peerNumber: string;
  dateTime: string;
  cellName: string;
  durationSeconds: number;
  latitude: number;
  longitude: number;
  callType: 'voice' | 'sms' | 'data';
};

type TelecelDashboardCallRecord = DashboardCallRecord & {
  rawCallType: 'VOICE_OUTGOING' | 'VOICE_INCOMING' | 'SMS_OUTGOING' | 'SMS_INCOMING';
};

type DashboardCallTypeLabel = TelecelDashboardCallRecord['rawCallType'];

type CommunicatorSummary = {
  number: string;
  callCount: number;
  totalDurationSeconds: number;
};

@Component({
  selector: 'app-dashboard',
  imports: [SubscriberMap, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly mtnCallRecordService = inject(MtnCallRecordService);
  private readonly telecelCallService = inject(TelecelCall);

  readonly dataProvider = signal<DataProvider>('mtn');
  readonly selectedSubscriberId = signal('');
  readonly timelineSortOrder = signal<'asc' | 'desc'>('asc');

  readonly mtnSubscribersResource = this.mtnCallRecordService.getAllSubscriberInfos();
  readonly mtnCallRecordsResource = this.mtnCallRecordService.getAllCallRecords();
  readonly telecelSubscribersResource = this.telecelCallService.getAllSubscriberInfos();
  readonly telecelCallRecordsResource = this.telecelCallService.getAllCallRecords();

  private readonly activeSubscribersResource = computed(() =>
    this.dataProvider() === 'mtn' ? this.mtnSubscribersResource : this.telecelSubscribersResource
  );

  private readonly activeCallRecordsResource = computed(() =>
    this.dataProvider() === 'mtn' ? this.mtnCallRecordsResource : this.telecelCallRecordsResource
  );

  readonly isLoading = computed(() => this.isPendingStatus(this.activeSubscribersResource().status()) || this.isPendingStatus(this.activeCallRecordsResource().status()));

  readonly hasError = computed(() => this.activeSubscribersResource().status() === 'error' || this.activeCallRecordsResource().status() === 'error');

  readonly errorMessage = computed(() => {
    const subscriberError = this.activeSubscribersResource().error();
    const callRecordError = this.activeCallRecordsResource().error();
    return this.formatResourceError(subscriberError ?? callRecordError);
  });

  readonly subscribers = computed<DashboardSubscriber[]>(() => {
    if (this.dataProvider() === 'telecel') {
      const rows = (this.telecelSubscribersResource.value() ?? []) as TelecelSubscriberInfo[];
      return rows.map((subscriber) => ({
        subscriberKey: String(subscriber.subscriberNumber ?? subscriber.id ?? ''),
        subscriberNumber: String(subscriber.subscriberNumber ?? ''),
        fullName: String(subscriber.name ?? 'Unknown subscriber'),
        region: 'N/A',
        homeCell: String(subscriber.gps ?? 'N/A'),
      }));
    }

    const rows = (this.mtnSubscribersResource.value() ?? []) as MtnSubscriberInfo[];
    return rows.map((subscriber) => ({
      subscriberKey: String(subscriber.msisdnKey ?? subscriber.id ?? ''),
      subscriberNumber: String(subscriber.msisdnKey ?? ''),
      fullName: String(subscriber.fullName ?? 'Unknown subscriber'),
      region: 'N/A',
      homeCell: 'N/A',
    }));
  });

  readonly callRecords = computed<DashboardCallRecord[]>(() => {
    if (this.dataProvider() === 'telecel') {
      return this.telecelCallRecords().allRecords;
    }

    return this.mtnCallRecords();
  });

  readonly telecelCallRecords = computed(() => {
    const rows = (this.telecelCallRecordsResource.value() ?? []) as TelecelCallRecord[];
    const allRecords: TelecelDashboardCallRecord[] = rows.map((record) => {
      const occurrence = record.eventDateTime ?? new Date();
      const dateTime = occurrence instanceof Date ? occurrence.toISOString() : String(occurrence ?? new Date().toISOString());
      const subscriberNumber = String(record.ownerNumber ?? record.calledNumber ?? '');
      const rawCallType = this.normalizeTelecelCallType(record.callType);
      const callType: DashboardCallRecord['callType'] = rawCallType === 'SMS_OUTGOING' || rawCallType === 'SMS_INCOMING' ? 'sms' : 'voice';

      return {
        id: Number(record.id ?? 0),
        subscriberId: subscriberNumber,
        msisdn: subscriberNumber,
        peerNumber: String(record.calledNumber ?? ''),
        dateTime,
        cellName: String(record.cellName ?? ''),
        durationSeconds: Number(record.callDuration ?? 0),
        latitude: this.normalizeCoordinate(record.latitude, 'latitude'),
        longitude: this.normalizeCoordinate(record.longitude, 'longitude'),
        callType,
        rawCallType,
      };
    });

    return {
      allRecords,
      voiceRecords: allRecords.filter((record) => record.callType === 'voice' && this.hasMapCoordinates(record)),
      smsRecords: allRecords.filter((record) => record.callType === 'sms'),
    };
  });

  readonly mtnCallRecords = computed<DashboardCallRecord[]>(() => {
    const rows = (this.mtnCallRecordsResource.value() ?? []) as MtnCallRecord[];
    return rows.map((record) => {
      const occurrence = record.eventDateTime ?? record.tblDt ?? new Date();
      const dateTime = occurrence instanceof Date ? occurrence.toISOString() : String(occurrence ?? new Date().toISOString());
      const latitude = this.normalizeCoordinate(record.latitude, 'latitude');
      const longitude = this.normalizeCoordinate(record.longitude, 'longitude');
      const subscriberNumber = String(record.msisdnKey ?? record.callingNo ?? '');
      const peerNumber = this.getMtnPeerNumber(record, subscriberNumber);

      return {
        id: Number(record.id ?? 0),
        subscriberId: subscriberNumber,
        msisdn: subscriberNumber,
        peerNumber,
        dateTime,
        cellName: String(record.firstSiteName ?? record.city ?? 'Unknown site'),
        durationSeconds: Number(record.duration ?? 0),
        latitude,
        longitude,
        callType: this.mapCallType(record.usageType),
      };
    });
  });

  readonly currentSubscriber = computed(() => {
    const id = this.selectedSubscriberId();
    const list = this.subscribers();
    return list.find((subscriber) => subscriber.subscriberKey === id) ?? list[0] ?? {
      subscriberKey: '',
      subscriberNumber: '',
      fullName: 'No subscriber selected',
      region: 'N/A',
      homeCell: 'N/A',
    };
  });

  readonly filteredRecords = computed(() => {
    const selectedId = this.selectedSubscriberId();
    return [...this.callRecords()]
      .filter((record) => !selectedId || record.subscriberId === selectedId)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  });

  readonly filteredSmsRecords = computed(() => {
    const selectedId = this.selectedSubscriberId();
    if (this.dataProvider() !== 'telecel') {
      return [] as DashboardCallRecord[];
    }

    return [...this.telecelCallRecords().smsRecords].filter((record) => !selectedId || record.subscriberId === selectedId);
  });

  readonly mapRecords = computed(() => {
    if (this.dataProvider() === 'telecel') {
      const selectedId = this.selectedSubscriberId();
      return this.telecelCallRecords().voiceRecords.filter((record) => !selectedId || record.subscriberId === selectedId);
    }

    return this.filteredRecords().filter((record) => this.hasMapCoordinates(record));
  });

  readonly totalMinutes = computed(() =>
    this.filteredRecords().reduce((total, record) => total + record.durationSeconds, 0) / 60
  );

  readonly telecelVoiceSummary = computed(() => {
    if (this.dataProvider() !== 'telecel') {
      return { count: 0, totalMinutes: 0 };
    }

    const selectedId = this.selectedSubscriberId();
    const records = this.telecelCallRecords().allRecords.filter((record) => record.callType === 'voice' && (!selectedId || record.subscriberId === selectedId));

    return {
      count: records.length,
      totalMinutes: records.reduce((total, record) => total + record.durationSeconds, 0) / 60,
    };
  });

  readonly telecelSmsSummary = computed(() => {
    if (this.dataProvider() !== 'telecel') {
      return { count: 0, totalMinutes: 0 };
    }

    const selectedId = this.selectedSubscriberId();
    const records = this.telecelCallRecords().allRecords.filter((record) => record.callType === 'sms' && (!selectedId || record.subscriberId === selectedId));

    return {
      count: records.length,
      totalMinutes: records.reduce((total, record) => total + record.durationSeconds, 0) / 60,
    };
  });

  readonly mtnVoiceSummary = computed(() => {
    if (this.dataProvider() !== 'mtn') {
      return { count: 0, totalMinutes: 0 };
    }

    const selectedId = this.selectedSubscriberId();
    const records = this.mtnCallRecords().filter((record) => this.mapCallType(record.callType) === 'voice' && (!selectedId || record.subscriberId === selectedId));

    return {
      count: records.length,
      totalMinutes: records.reduce((total, record) => total + record.durationSeconds, 0) / 60,
    };
  });

  readonly mtnSmsSummary = computed(() => {
    if (this.dataProvider() !== 'mtn') {
      return { count: 0, totalMinutes: 0 };
    }

    const selectedId = this.selectedSubscriberId();
    const records = this.mtnCallRecords().filter((record) => this.mapCallType(record.callType) === 'sms' && (!selectedId || record.subscriberId === selectedId));

    return {
      count: records.length,
      totalMinutes: records.reduce((total, record) => total + record.durationSeconds, 0) / 60,
    };
  });

  readonly totalCalls = computed(() => this.filteredRecords().length);

  readonly topCells = computed(() => {
    const aggregated = new Map<string, { name: string; count: number; totalDuration: number; latitude: number; longitude: number }>();

    this.mapRecords().forEach((record) => {
      const current = aggregated.get(record.cellName) ?? {
        name: record.cellName,
        count: 0,
        totalDuration: 0,
        latitude: record.latitude,
        longitude: record.longitude,
      };

      current.count += 1;
      current.totalDuration += record.durationSeconds;
      aggregated.set(record.cellName, current);
    });

    const mapRecordCount = Math.max(1, this.mapRecords().length);

    return [...aggregated.values()]
      .map((cell) => ({
        ...cell,
        intensity: Math.min(1, cell.count / mapRecordCount),
      }))
      .sort((a, b) => b.count - a.count);
  });
  readonly movementTimeline = computed(() => {
    const groups = new Map<string, { day: string; events: { hour: string; count: number; cellName: string; time: string; latitude: number; longitude: number; dateTime: string }[] }>();

    this.mapRecords().forEach((record) => {
      const date = new Date(record.dateTime);
      const dayKey = date.toISOString().slice(0, 10);
      const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`;
      const dateTime = date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (!groups.has(dayKey)) {
        groups.set(dayKey, {
          day: new Date(dayKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          events: [],
        });
      }

      const dayGroup = groups.get(dayKey)!;
      const event = dayGroup.events.find((item) => item.hour === hourKey);

      if (event) {
        event.count += 1;
        event.cellName = record.cellName;
        event.time = `${hourKey} · ${record.cellName}`;
        event.latitude = record.latitude;
        event.longitude = record.longitude;
        event.dateTime = dateTime;
      } else {
        dayGroup.events.push({
          hour: hourKey,
          count: 1,
          cellName: record.cellName,
          time: `${hourKey} · ${record.cellName}`,
          latitude: record.latitude,
          longitude: record.longitude,
          dateTime,
        });
      }
    });

    const sortedGroups = [...groups.entries()].map(([dateKey, group]) => ({
      dateKey,
      day: group.day,
      events: [...group.events].sort((a, b) => a.hour.localeCompare(b.hour)),
    }));

    return sortedGroups.sort((left, right) => {
      const leftTime = new Date(left.dateKey).getTime();
      const rightTime = new Date(right.dateKey).getTime();
      return this.timelineSortOrder() === 'asc' ? leftTime - rightTime : rightTime - leftTime;
    });
  });
  readonly mapCells = computed(() =>
    this.topCells().map((cell) => ({
      name: cell.name,
      latitude: cell.latitude,
      longitude: cell.longitude,
      count: cell.count,
      totalDuration: cell.totalDuration,
      intensity: cell.intensity,
    }))
  );

  readonly mapPoints = computed(() =>
    this.mapRecords().map((record) => ({
      latitude: record.latitude,
      longitude: record.longitude,
      cellName: record.cellName,
      dateTime: record.dateTime,
    }))
  );

  readonly activeCell = computed(() =>
    this.topCells()[0] ?? {
      name: 'No activity',
      count: 0,
      totalDuration: 0,
      latitude: 0,
      longitude: 0,
      intensity: 0,
    }
  );

  readonly communicatorSummaries = computed<CommunicatorSummary[]>(() => {
    const summaries = new Map<string, CommunicatorSummary>();
    const isTelecel = this.dataProvider() === 'telecel';

    this.filteredRecords().forEach((record) => {
      const peerNumber = record.peerNumber.trim();

      if (!peerNumber) {
        return;
      }

      if (isTelecel && peerNumber.length < 9) {
        return;
      }

      const summary = summaries.get(peerNumber) ?? {
        number: peerNumber,
        callCount: 0,
        totalDurationSeconds: 0,
      };

      summary.callCount += 1;
      summary.totalDurationSeconds += record.durationSeconds;
      summaries.set(peerNumber, summary);
    });

    return [...summaries.values()].sort((left, right) => {
      if (right.callCount !== left.callCount) {
        return right.callCount - left.callCount;
      }

      return right.totalDurationSeconds - left.totalDurationSeconds;
    });
  });

  readonly mostFrequentCommunicator = computed<CommunicatorSummary>(() =>
    this.communicatorSummaries()[0] ?? {
      number: 'N/A',
      callCount: 0,
      totalDurationSeconds: 0,
    }
  );

  readonly longestDurationCommunicator = computed<CommunicatorSummary>(() =>
    [...this.communicatorSummaries()].sort((left, right) => right.totalDurationSeconds - left.totalDurationSeconds)[0] ?? {
      number: 'N/A',
      callCount: 0,
      totalDurationSeconds: 0,
    }
  );

  constructor() {
    effect(() => {
      const subscriberList = this.subscribers();
      if (!subscriberList.length) {
        return;
      }

      const currentSelected = this.selectedSubscriberId();
      if (!currentSelected || !subscriberList.some((subscriber) => subscriber.subscriberKey === currentSelected)) {
        this.selectedSubscriberId.set(subscriberList[0].subscriberKey);
      }
    });
  }

  onProviderChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.dataProvider.set(select.value as DataProvider);
    this.selectedSubscriberId.set('');
  }

  onSubscriberChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedSubscriberId.set(select.value);
  }

  get selectedProviderLabel(): string {
    return this.dataProvider() === 'mtn' ? 'MTN' : 'Telecel';
  }

  setTimelineSortOrder(order: 'asc' | 'desc') {
    this.timelineSortOrder.set(order);
  }

  getCellIntensityWidth(cellIntensity: number): number {
    return Math.max(12, cellIntensity * 100);
  }

  private isPendingStatus(status: string): boolean {
    return status === 'idle' || status === 'loading' || status === 'reloading';
  }

  private formatResourceError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unable to load dashboard data. Please try again.';
  }

  private normalizeCoordinate(value: unknown, kind: 'latitude' | 'longitude'): number {
    if (value == null || value === '') {
      return 0;
    }

    let parsed: number;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      const commaDecimal = /^[+-]?\d+,\d+$/.test(trimmed) ? trimmed.replace(',', '.') : trimmed;
      parsed = Number.parseFloat(commaDecimal);

      if (!Number.isFinite(parsed)) {
        const extracted = trimmed.match(/[+-]?\d+(?:\.\d+)?/g);
        parsed = extracted && extracted.length > 0 ? Number.parseFloat(extracted[0]) : Number.NaN;
      }
    } else {
      parsed = Number(value);
    }

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    if (kind === 'latitude' && Math.abs(parsed) > 90) {
      return 0;
    }

    if (kind === 'longitude' && Math.abs(parsed) > 180) {
      return 0;
    }

    return parsed;
  }

  private getMtnPeerNumber(record: MtnCallRecord, subscriberNumber: string): string {
    if (record.callingNo && record.callingNo !== subscriberNumber) {
      return String(record.callingNo);
    }

    if (record.calledNo && record.calledNo !== subscriberNumber) {
      return String(record.calledNo);
    }

    return String(record.calledNo ?? record.callingNo ?? '');
  }

  private hasMapCoordinates(record: Pick<DashboardCallRecord, 'latitude' | 'longitude' | 'cellName'>): boolean {
    return Boolean(record.cellName) && Number.isFinite(record.latitude) && Number.isFinite(record.longitude) && (record.latitude !== 0 || record.longitude !== 0);
  }

  private normalizeTelecelCallType(value?: string): DashboardCallTypeLabel {
    const normalized = (value ?? '').trim().toUpperCase();

    if (normalized.includes('SMS') && normalized.includes('IN')) {
      return 'SMS_INCOMING';
    }

    if (normalized.includes('SMS')) {
      return 'SMS_OUTGOING';
    }

    if (normalized.includes('VOICE') && normalized.includes('IN')) {
      return 'VOICE_INCOMING';
    }

    if (normalized.includes('VOICE')) {
      return 'VOICE_OUTGOING';
    }

    return 'VOICE_OUTGOING';
  }

  private mapCallType(value?: string): 'voice' | 'sms' | 'data' {
    const normalized = (value ?? '').toLowerCase();
    if (normalized.includes('sms')) return 'sms';
    if (normalized.includes('data')) return 'data';
    return 'voice';
  }
}
