import { createNitroStore } from '../../state/createNitroStore';
import { InspectionElementType, VariablesElementType, WiredToolsTab } from './WiredCreatorTools.types';

type MonitorSeverityFilter = 'ALL' | 'ERROR' | 'WARNING';
type Updater<T> = T | ((prev: T) => T);

const apply = <T>(prev: T, next: Updater<T>): T =>
    ((typeof next === 'function') ? (next as (p: T) => T)(prev) : next);

interface WiredCreatorToolsUiState
{
    isVisible: boolean;
    activeTab: WiredToolsTab;
    inspectionType: InspectionElementType;
    variablesType: VariablesElementType;

    isMonitorHistoryOpen: boolean;
    isMonitorInfoOpen: boolean;
    isInspectionGiveOpen: boolean;
    isVariableManageOpen: boolean;
    isManagedGiveOpen: boolean;

    monitorHistorySeverityFilter: MonitorSeverityFilter;
    monitorHistoryTypeFilter: string;

    variableManageTypeFilter: string;
    variableManageSort: string;
    variableManagePage: number;

    setIsVisible: (next: Updater<boolean>) => void;
    setActiveTab: (next: WiredToolsTab) => void;
    setInspectionType: (next: InspectionElementType) => void;
    setVariablesType: (next: VariablesElementType) => void;

    setIsMonitorHistoryOpen: (next: boolean) => void;
    setIsMonitorInfoOpen: (next: boolean) => void;
    setIsInspectionGiveOpen: (next: Updater<boolean>) => void;
    setIsVariableManageOpen: (next: boolean) => void;
    setIsManagedGiveOpen: (next: Updater<boolean>) => void;

    setMonitorHistorySeverityFilter: (next: MonitorSeverityFilter) => void;
    setMonitorHistoryTypeFilter: (next: string) => void;

    setVariableManageTypeFilter: (next: string) => void;
    setVariableManageSort: (next: string) => void;
    setVariableManagePage: (next: Updater<number>) => void;
}

export const useWiredCreatorToolsUiStore = createNitroStore<WiredCreatorToolsUiState>()((set) => ({
    isVisible: false,
    activeTab: 'monitor',
    inspectionType: 'furni',
    variablesType: 'furni',

    isMonitorHistoryOpen: false,
    isMonitorInfoOpen: false,
    isInspectionGiveOpen: false,
    isVariableManageOpen: false,
    isManagedGiveOpen: false,

    monitorHistorySeverityFilter: 'ALL',
    monitorHistoryTypeFilter: 'ALL',

    variableManageTypeFilter: 'ALL',
    variableManageSort: 'highest_value',
    variableManagePage: 1,

    setIsVisible: (next) => set(state => ({ isVisible: apply(state.isVisible, next) })),
    setActiveTab: (next) => set({ activeTab: next }),
    setInspectionType: (next) => set({ inspectionType: next }),
    setVariablesType: (next) => set({ variablesType: next }),

    setIsMonitorHistoryOpen: (next) => set({ isMonitorHistoryOpen: next }),
    setIsMonitorInfoOpen: (next) => set({ isMonitorInfoOpen: next }),
    setIsInspectionGiveOpen: (next) => set(state => ({ isInspectionGiveOpen: apply(state.isInspectionGiveOpen, next) })),
    setIsVariableManageOpen: (next) => set({ isVariableManageOpen: next }),
    setIsManagedGiveOpen: (next) => set(state => ({ isManagedGiveOpen: apply(state.isManagedGiveOpen, next) })),

    setMonitorHistorySeverityFilter: (next) => set({ monitorHistorySeverityFilter: next }),
    setMonitorHistoryTypeFilter: (next) => set({ monitorHistoryTypeFilter: next }),

    setVariableManageTypeFilter: (next) => set({ variableManageTypeFilter: next }),
    setVariableManageSort: (next) => set({ variableManageSort: next }),
    setVariableManagePage: (next) => set(state => ({ variableManagePage: apply(state.variableManagePage, next) }))
}));
