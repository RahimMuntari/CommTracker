import { DecimalPipe, LowerCasePipe, DatePipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MtnCallRecord } from '../model/mtn-call-record';
import { MtnSubscriberInfo } from '../model/mtn-subscriber-info';
import { MtnMomoStatement } from '../model/mtn-momo-statement';
import { MtnMomoTransaction } from '../model/mtn-momo-transaction';
import { TelecelCallRecord } from '../model/telecel-call-record';
import { TelecelSubscriberInfo } from '../model/telecel-subscriber-info';
import { TelecelMomoStatement } from '../model/telecel-momo-statement';
import { TelecelMomoTransaction } from '../model/telecel-momo-transaction';
import { MtnCallRecordService } from '../services/mtn-call-record-service';
import { TelecelCall } from '../services/telecel-call';
import { MtnMomo } from '../services/mtn-momo';
import { TelecelMomo } from '../services/telecel-momo';
import { SubscriberMap } from './subscriber-map/subscriber-map';

type DataProvider = 'mtn' | 'telecel';

type DataDisplayMode = 'calls' | 'momo';

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

type DashboardMomoTransaction = {
  id: number;
  statementId: string;
  subscriberNumber: string;
  dateTime: string;
  transactionType: string;
  paidIn: number;
  withdrawn: number;
  deposit: number;
  balance: number;
  oppositeParty?: string;
  receiptNo?: string;
  details?: string;
  fromAccount?: string;
  fromAccountName?: string;
  fromPhoneNumber?: string;
  toMsisdn?: string;
  toAccountName?: string;
};

type CommunicatorSummary = {
  number: string;
  callCount: number;
  totalDurationSeconds: number;
};

type MomoTransactionSummary = {
  totalTransactions: number;
  totalPaidIn: number;
  totalWithdrawn: number;
  currentBalance: number;
};

type MomoActivitySummary = {
  details: string;
  frequency: number;
  totalPaidIn: number;
  totalWithdrawn: number;
};

type UnclassifiedMtnTypeSummary = {
  count: number;
  topTypes: string[];
};

@Component({
  selector: 'app-dashboard',
  imports: [SubscriberMap, DecimalPipe, LowerCasePipe, DatePipe, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly mtnCallRecordService = inject(MtnCallRecordService);
  private readonly telecelCallService = inject(TelecelCall);
  private readonly mtnMomoService = inject(MtnMomo);
  private readonly telecelMomoService = inject(TelecelMomo);

  readonly dataProvider = signal<DataProvider>('mtn');
  readonly displayMode = signal<DataDisplayMode>('calls');
  readonly selectedSubscriberId = signal('');
  readonly timelineSortOrder = signal<'asc' | 'desc'>('asc');
  readonly momoSortOrder = signal<'asc' | 'desc'>('desc');
  readonly currencyCode = 'GHS';

  readonly mtnSubscribersResource = this.mtnCallRecordService.getAllSubscriberInfos();
  readonly mtnCallRecordsResource = this.mtnCallRecordService.getAllCallRecords();
  readonly mtnMomoStatementsResource = this.mtnMomoService.getAllStatements();
  readonly mtnMomoTransactionsResource = this.mtnMomoService.getAllTransactions();
  readonly telecelSubscribersResource = this.telecelCallService.getAllSubscriberInfos();
  readonly telecelCallRecordsResource = this.telecelCallService.getAllCallRecords();
  readonly telecelMomoStatementsResource = this.telecelMomoService.getAllStatements();
  readonly telecelMomoTransactionsResource = this.telecelMomoService.getAllTransactions();

  private readonly activeSubscribersResource = computed(() => {
    if (this.displayMode() === 'momo') {
      return this.dataProvider() === 'mtn' ? this.mtnMomoStatementsResource : this.telecelMomoStatementsResource;
    }
    return this.dataProvider() === 'mtn' ? this.mtnSubscribersResource : this.telecelSubscribersResource;
  });

  private readonly activeCallRecordsResource = computed(() =>
    this.dataProvider() === 'mtn' ? this.mtnCallRecordsResource : this.telecelCallRecordsResource
  );

  private readonly activeMomoTransactionsResource = computed(() =>
    this.dataProvider() === 'mtn' ? this.mtnMomoTransactionsResource : this.telecelMomoTransactionsResource
  );

  readonly isLoading = computed(() => {
    if (this.displayMode() === 'momo') {
      return this.isPendingStatus(this.activeSubscribersResource().status()) || this.isPendingStatus(this.activeMomoTransactionsResource().status());
    }
    return this.isPendingStatus(this.activeSubscribersResource().status()) || this.isPendingStatus(this.activeCallRecordsResource().status());
  });

  readonly hasError = computed(() => {
    if (this.displayMode() === 'momo') {
      return this.activeSubscribersResource().status() === 'error' || this.activeMomoTransactionsResource().status() === 'error';
    }
    return this.activeSubscribersResource().status() === 'error' || this.activeCallRecordsResource().status() === 'error';
  });

  readonly errorMessage = computed(() => {
    if (this.displayMode() === 'momo') {
      const subscriberError = this.activeSubscribersResource().error();
      const transactionError = this.activeMomoTransactionsResource().error();
      return this.formatResourceError(subscriberError ?? transactionError);
    }
    const subscriberError = this.activeSubscribersResource().error();
    const callRecordError = this.activeCallRecordsResource().error();
    return this.formatResourceError(subscriberError ?? callRecordError);
  });

  readonly subscribers = computed<DashboardSubscriber[]>(() => {
    if (this.displayMode() === 'momo') {
      if (this.dataProvider() === 'telecel') {
        const rows = (this.telecelMomoStatementsResource.value() ?? []) as TelecelMomoStatement[];
        return rows.map((statement) => ({
          subscriberKey: String(statement.id ?? ''),
          subscriberNumber: this.getTelecelMsisdn(statement),
          fullName: this.getTelecelAccountHolderName(statement),
          region: 'N/A',
          homeCell: 'N/A',
        }));
      }

      const rows = (this.mtnMomoStatementsResource.value() ?? []) as MtnMomoStatement[];
      return rows.map((statement) => ({
        subscriberKey: String(statement.id ?? ''),
        subscriberNumber: this.getMtnCustomerNumber(statement),
        fullName: this.getMtnAccountHolderName(statement),
        region: 'N/A',
        homeCell: 'N/A',
      }));
    }

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

  readonly mtnMomoTransactions = computed<DashboardMomoTransaction[]>(() => {
    const rows = (this.mtnMomoTransactionsResource.value() ?? []) as MtnMomoTransaction[];
    return rows.map((transaction) => {
      const dateTime = transaction.TransactionDateTime ?? transaction.TransactionDate ?? new Date();
      const dateTimeStr = dateTime instanceof Date ? dateTime.toISOString() : String(dateTime ?? new Date().toISOString());
      const statementId = this.getMtnTransactionStatementId(transaction);
      const transactionType = this.getMtnTransactionType(transaction);
      const fromAmount = this.getMtnFromAmount(transaction);
      const balanceAfterAmount = this.getMtnBalanceAfterAmount(transaction);
      const toMsisdn = this.getMtnToMsisdn(transaction);
      const fromAccount = this.getMtnFromAccount(transaction);
      const fromAccountName = this.getMtnFromAccountName(transaction);
      const fromPhoneNumber = this.getMtnFromPhoneNumber(transaction);
      const toAccountName = this.getMtnToAccountName(transaction);
      const toAccount = this.getMtnToAccount(transaction);
      const paidIn = this.isMtnCashIn(transactionType) ? fromAmount : 0;
      const withdrawn = this.isMtnCashOut(transactionType) ? fromAmount : 0;

      return {
        id: Number(transaction.id ?? 0),
        statementId,
        subscriberNumber: fromPhoneNumber || fromAccount,
        dateTime: dateTimeStr,
        transactionType,
        paidIn,
        withdrawn,
        deposit: fromAmount,
        balance: balanceAfterAmount,
        oppositeParty: toAccountName || toAccount || toMsisdn,
        receiptNo: String(transaction.FinancialId ?? ''),
        details: this.buildMtnMomoDetails(toAccountName, toMsisdn),
        fromAccount,
        fromAccountName,
        fromPhoneNumber,
        toMsisdn,
        toAccountName,
      };
    });
  });

  readonly telecelMomoTransactions = computed<DashboardMomoTransaction[]>(() => {
    const rows = (this.telecelMomoTransactionsResource.value() ?? []) as TelecelMomoTransaction[];
    return rows.map((transaction) => {
      const dateTime = transaction.initiationTime ?? transaction.completionTime ?? new Date();
      const dateTimeStr = dateTime instanceof Date ? dateTime.toISOString() : String(dateTime ?? new Date().toISOString());
      const paidIn = this.parseMoneyValue(transaction.paidIn);
      const withdrawn = this.parseMoneyValue(transaction.withdrawn);

      return {
        id: Number(transaction.id ?? 0),
        statementId: String(transaction.telecelMomoStatementId ?? ''),
        subscriberNumber: '', // Will be set from statement mapping
        dateTime: dateTimeStr,
        transactionType: String(transaction.transactionStatus ?? 'Unknown'),
        paidIn,
        withdrawn,
        deposit: paidIn + withdrawn,
        balance: this.parseMoneyValue(transaction.balance),
        oppositeParty: String(transaction.oppositeParty ?? ''),
        receiptNo: String(transaction.receiptNo ?? ''),
        details: String(transaction.details ?? ''),
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

  readonly filteredMomoTransactions = computed(() => {
    const selectedId = this.selectedSubscriberId();
    const allTransactions = this.dataProvider() === 'mtn' ? this.mtnMomoTransactions() : this.telecelMomoTransactions();
    const sortOrder = this.momoSortOrder();

    return allTransactions
      .filter((transaction) => !selectedId || transaction.statementId === selectedId)
      .sort((a, b) => {
        const leftTime = new Date(a.dateTime).getTime();
        const rightTime = new Date(b.dateTime).getTime();
        return sortOrder === 'asc' ? leftTime - rightTime : rightTime - leftTime;
      });
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

  readonly momoTransactionSummary = computed<MomoTransactionSummary>(() => {
    const transactions = this.filteredMomoTransactions();
    const latestTransaction = [...transactions].sort((left, right) =>
      new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime()
    )[0];

    return {
      totalTransactions: transactions.length,
      totalPaidIn: transactions.reduce((sum, t) => sum + t.paidIn, 0),
      totalWithdrawn: transactions.reduce((sum, t) => sum + t.withdrawn, 0),
      currentBalance: latestTransaction?.balance ?? 0,
    };
  });

  readonly highestPaidInTransaction = computed<DashboardMomoTransaction | null>(() => {
    const paidInTransactions = this.filteredMomoTransactions().filter((transaction) => transaction.paidIn > 0);
    if (paidInTransactions.length === 0) {
      return null;
    }

    return paidInTransactions.reduce((highest, transaction) =>
      transaction.paidIn > highest.paidIn ? transaction : highest
    );
  });

  readonly highestWithdrawnTransaction = computed<DashboardMomoTransaction | null>(() => {
    const withdrawnTransactions = this.filteredMomoTransactions().filter((transaction) => transaction.withdrawn !== 0);
    if (withdrawnTransactions.length === 0) {
      return null;
    }

    return withdrawnTransactions.reduce((highest, transaction) =>
      Math.abs(transaction.withdrawn) > Math.abs(highest.withdrawn) ? transaction : highest
    );
  });

  readonly highestFrequencyMomoActivity = computed<MomoActivitySummary>(() => {
    const activityGroups = new Map<string, MomoActivitySummary>();

    this.filteredMomoTransactions().forEach((transaction) => {
      const details = (transaction.details ?? transaction.transactionType ?? 'Unknown activity').trim() || 'Unknown activity';
      const key = details.toLowerCase();
      const current = activityGroups.get(key) ?? {
        details,
        frequency: 0,
        totalPaidIn: 0,
        totalWithdrawn: 0,
      };

      current.frequency += 1;
      current.totalPaidIn += transaction.paidIn;
      current.totalWithdrawn += transaction.withdrawn;
      activityGroups.set(key, current);
    });

    if (activityGroups.size === 0) {
      return {
        details: 'No transaction activity',
        frequency: 0,
        totalPaidIn: 0,
        totalWithdrawn: 0,
      };
    }

    return [...activityGroups.values()].sort((left, right) => {
      if (right.frequency !== left.frequency) {
        return right.frequency - left.frequency;
      }

      const leftTotal = left.totalPaidIn + left.totalWithdrawn;
      const rightTotal = right.totalPaidIn + right.totalWithdrawn;
      return rightTotal - leftTotal;
    })[0];
  });

  readonly unclassifiedMtnTypeSummary = computed<UnclassifiedMtnTypeSummary>(() => {
    if (this.dataProvider() !== 'mtn' || this.displayMode() !== 'momo') {
      return { count: 0, topTypes: [] };
    }

    const unclassified = this.filteredMomoTransactions().filter((transaction) => {
      const type = transaction.transactionType ?? '';
      return !this.isMtnCashIn(type) && !this.isMtnCashOut(type);
    });

    const frequencies = new Map<string, number>();
    unclassified.forEach((transaction) => {
      const key = this.normalizeMtnTransactionType(transaction.transactionType || 'Unknown');
      frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
    });

    const topTypes = [...frequencies.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([type]) => type);

    return {
      count: unclassified.length,
      topTypes,
    };
  });

  constructor() {
    effect(() => {
      // Explicitly track provider and display mode changes
      const provider = this.dataProvider();
      const displayMode = this.displayMode();
      
      // Explicitly access resources to ensure they're loading
      const subscriberResourceStatus = this.activeSubscribersResource().status();
      const transactionResourceStatus = displayMode === 'momo' ? this.activeMomoTransactionsResource().status() : this.activeCallRecordsResource().status();
      
      // Get the subscriber list
      const subscriberList = this.subscribers();
      
      // Auto-select first subscriber if none is selected or current selection is invalid
      if (subscriberList?.length > 0) {
        const currentSelected = this.selectedSubscriberId();
        if (!currentSelected || !subscriberList.some((subscriber) => subscriber.subscriberKey === currentSelected)) {
          this.selectedSubscriberId.set(subscriberList[0].subscriberKey);
        }
      }
    });

    effect(() => {
      // Track subscriber ID changes and trigger appropriate resource loads
      const subscriberId = this.selectedSubscriberId();
      const displayMode = this.displayMode();
      const provider = this.dataProvider();

      // Depending on display mode and provider, access the appropriate resources
      if (displayMode === 'momo') {
        if (provider === 'mtn') {
          // Access MTN momo transactions resource to trigger load when subscriber changes
          this.activeMomoTransactionsResource().value();
        } else {
          // Access Telecel momo transactions resource to trigger load when subscriber changes
          this.activeMomoTransactionsResource().value();
        }
      } else {
        if (provider === 'mtn') {
          // Access MTN call records resource to trigger load when subscriber changes
          this.activeCallRecordsResource().value();
        } else {
          // Access Telecel call records resource to trigger load when subscriber changes
          this.activeCallRecordsResource().value();
        }
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
    console.log(`Selected subscriber ID changed to: ${select.value}`);
  }

  onDisplayModeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.displayMode.set(select.value as DataDisplayMode);
    this.dataProvider.set('mtn');
    this.selectedSubscriberId.set('');
  }

  get selectedProviderLabel(): string {
    return this.dataProvider() === 'mtn' ? 'MTN' : 'Telecel';
  }

  get selectedDisplayModeLabel(): string {
    return this.displayMode() === 'calls' ? 'Call Records' : 'Momo Transactions';
  }

  setTimelineSortOrder(order: 'asc' | 'desc') {
    this.timelineSortOrder.set(order);
  }

  setMomoSortOrder(order: 'asc' | 'desc') {
    this.momoSortOrder.set(order);
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
    const compact = normalized.replace(/[\s-]+/g, '_');

    if (compact === 'OS') {
      return 'SMS_OUTGOING';
    }

    if (compact === 'T') {
      return 'VOICE_INCOMING';
    }

    if (compact === 'O') {
      return 'VOICE_OUTGOING';
    }

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

  private getMtnAccountHolderName(statement: MtnMomoStatement): string {
    const statementRecord = statement as unknown as Record<string, unknown>;
    const firstName = String(
      statement.firstName ?? statementRecord['Firstname'] ?? statementRecord['FirstName'] ?? ''
    ).trim();
    const surname = String(statement.surname ?? statementRecord['Surname'] ?? '').trim();
    const fullName = `${firstName} ${surname}`.trim();

    if (fullName) {
      return fullName;
    }

    return 'Unknown account holder';
  }

  private getMtnCustomerNumber(statement: MtnMomoStatement): string {
    const statementRecord = statement as unknown as Record<string, unknown>;
    return String(statement.customerNumber ?? statementRecord['CustomerNumber'] ?? '').trim();
  }

  private getTelecelAccountHolderName(statement: TelecelMomoStatement): string {
    const statementRecord = statement as unknown as Record<string, unknown>;
    const accountHolder = String(
      statement.AccountHolder ?? statementRecord['accountHolder'] ?? statementRecord['Accountholder'] ?? ''
    ).trim();
    return accountHolder || 'Unknown account holder';
  }

  private getTelecelMsisdn(statement: TelecelMomoStatement): string {
    const statementRecord = statement as unknown as Record<string, unknown>;
    return String(statement.Msisdn ?? statementRecord['msisdn'] ?? statementRecord['MSISDN'] ?? '').trim();
  }

  private getMtnTransactionStatementId(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    const statementId =
      transaction.StatementId ??
      transactionRecord['statementId'] ??
      transactionRecord['StatementID'] ??
      transactionRecord['statement_id'] ??
      transactionRecord['statementID'] ??
      '';

    return String(statementId).trim();
  }

  private getMtnFromAmount(transaction: MtnMomoTransaction): number {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return this.parseMoneyValue(
      transaction.FromAmount ??
      transactionRecord['fromAmount'] ??
      transactionRecord['from_amount']
    );
  }

  private getMtnBalanceAfterAmount(transaction: MtnMomoTransaction): number {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return this.parseMoneyValue(
      transaction.BalanceAfterAmount ??
      transactionRecord['balanceAfterAmount'] ??
      transactionRecord['balance_after_amount']
    );
  }

  private getMtnToMsisdn(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.ToMsisdn ??
      transactionRecord['toMsisdn'] ??
      transactionRecord['to_msisdn'] ??
      ''
    ).trim();
  }

  private getMtnFromAccount(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.FromAccount ??
      transactionRecord['fromAccount'] ??
      transaction.FromPhoneNumber ??
      transactionRecord['fromPhoneNumber'] ??
      ''
    ).trim();
  }

  private getMtnFromAccountName(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.FromAccountName ??
      transactionRecord['fromAccountName'] ??
      transactionRecord['from_account_name'] ??
      ''
    ).trim();
  }

  private getMtnFromPhoneNumber(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.FromPhoneNumber ??
      transactionRecord['fromPhoneNumber'] ??
      transactionRecord['from_phone_number'] ??
      ''
    ).trim();
  }

  private getMtnToAccountName(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.ToAccountName ??
      transactionRecord['toAccountName'] ??
      transactionRecord['to_account_name'] ??
      ''
    ).trim();
  }

  private getMtnToAccount(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.ToAccount ??
      transactionRecord['toAccount'] ??
      transactionRecord['to_account'] ??
      ''
    ).trim();
  }

  private getMtnTransactionType(transaction: MtnMomoTransaction): string {
    const transactionRecord = transaction as unknown as Record<string, unknown>;
    return String(
      transaction.TransactionType ??
      transactionRecord['transactionType'] ??
      transactionRecord['transaction_type'] ??
      'Unknown'
    ).trim();
  }

  private isMtnCashIn(transactionType: string): boolean {
    const normalized = this.normalizeMtnTransactionType(transactionType);
    const cashInTypes = new Set<string>([
      'CASH_IN',
      'CUSTOM_LOAN_PAYOUT',
      'PAYMENT',
    ]);
    return cashInTypes.has(normalized);
  }

  private isMtnCashOut(transactionType: string): boolean {
    const normalized = this.normalizeMtnTransactionType(transactionType);
    const cashOutTypes = new Set<string>([
      'CASH_OUT',
      'CUSTOM_PROVIDER_LOAN_REPAYMENT',
      'DEBT',
      'CUSTOM_LOAN_DEBT_COLLECTION',
      'TRANSFER',
    ]);
    return cashOutTypes.has(normalized);
  }

  private normalizeMtnTransactionType(transactionType: string): string {
    return transactionType.trim().toUpperCase().replace(/[\s-]+/g, '_');
  }

  private parseMoneyValue(value: unknown): number {
    if (value == null || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const normalized = String(value)
      .trim()
      .replace(/,/g, '')
      .replace(/[^\d+\-.]/g, '');

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private buildMtnMomoDetails(toAccountName: string, toMsisdn: string): string {
    const details: string[] = [];

    if (toAccountName) {
      details.push(`ToAccountName: ${toAccountName}`);
    }

    if (toMsisdn) {
      details.push(`ToMsisdn: ${toMsisdn}`);
    }

    return details.join(' | ');
  }
}
