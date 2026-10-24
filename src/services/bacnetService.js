import { bacnetRead } from "@/api/api";
import { BacNetData, divisionData } from "@/data/BacNetData";

const METER_FIELDS = ["status", "power", "amp", "kwh"];

const toInstance = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0 ? number : null;
};

const getValue = (item) => {
  const candidates = [
    item?.value,
    item?.presentValue,
    item?.present_value,
    item?.currentValue,
    item?.current_value,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const value = Number(candidate);

    if (Number.isFinite(value)) return value;
  }

  return null;
};

const getInstance = (item) => {
  const candidates = [
    item?.instance,
    item?.instanceNumber,
    item?.objectInstance,
    item?.object_instance,
    item?.requestedInstance,
    item?.requested_instance,
    item?.object?.instance,
    item?.object?.objectInstance,
  ];

  for (const candidate of candidates) {
    const instance = toInstance(candidate);
    if (instance !== null) return instance;
  }

  return null;
};

const getResponseItems = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

const normalizeReadings = (response) => {
  const readings = new Map();

  for (const item of getResponseItems(response)) {
    const parentInstance = getInstance(item);

    if (Array.isArray(item?.found)) {
      for (const found of item.found) {
        const instance = getInstance(found) ?? parentInstance;
        const value = getValue(found);

        if (instance !== null && value !== null) {
          readings.set(instance, value);
        }
      }

      continue;
    }

    const instance = parentInstance;
    const value = getValue(item);

    if (instance !== null && value !== null) {
      readings.set(instance, value);
    }
  }

  return readings;
};

const getConfiguredMeters = () => {
  const divisions = Object.keys(BacNetData);

  return divisions.flatMap((division) =>
    divisionData(division).map((meter) => ({
      ...meter,
      division: meter.division || division,
      meter_key: meter.meter_key,
      meter_name: meter.meter_name || meter.meter_key,
      department: meter.department || "Unknown",
    })),
  );
};

const getAllInstances = (meters) => {
  const instances = new Set();

  for (const meter of meters) {
    for (const field of METER_FIELDS) {
      const instance = toInstance(meter[field]);

      if (instance !== null) instances.add(instance);
    }
  }

  return [...instances];
};

const mergeReadings = (meters, readingMap) =>
  meters.map((meter) => {
    const readings = {};

    for (const field of METER_FIELDS) {
      const instance = toInstance(meter[field]);
      const value =
        instance !== null && readingMap.has(instance)
          ? readingMap.get(instance)
          : null;

      readings[field] = {
        instance,
        value,
        liveValue: value,
        hasLiveValue: value !== null,
      };
    }

    const power = readings.power.liveValue;
    const kwh = readings.kwh.liveValue;
    const status = readings.status.liveValue;
    const amp = readings.amp.liveValue;

    return {
      ...meter,
      instance: readings.power.instance,
      value: power,
      liveValue: power,
      currentValue: power,
      hasLiveValue: power !== null,
      readings,
      live: { power, kwh, status, amp },
    };
  });

export const getBacnetDashboardData = async () => {
  const meters = getConfiguredMeters();
  const instances = getAllInstances(meters);

  if (instances.length === 0) {
    return {
      success: true,
      meters: [],
      divisions: {},
      instances: [],
      diagnostics: {
        configuredInstances: 0,
        receivedInstances: 0,
        missingInstances: 0,
      },
    };
  }

  // One shared BACnet read for all configured divisions.
  const response = await bacnetRead(instances);

  if (response?.success === false) {
    throw new Error(response?.message || "BACnet reading failed");
  }

  const readingMap = normalizeReadings(response);
  const liveMeters = mergeReadings(meters, readingMap);

  const divisions = liveMeters.reduce((result, meter) => {
    const key = String(meter.division).toLowerCase();

    if (!result[key]) result[key] = [];
    result[key].push(meter);

    return result;
  }, {});

  return {
    success: true,
    meters: liveMeters,
    divisions,
    instances,
    diagnostics: {
      configuredInstances: instances.length,
      receivedInstances: readingMap.size,
      missingInstances: instances.filter((id) => !readingMap.has(id)).length,
    },
    receivedAt: new Date().toISOString(),
  };
};

export const getDivisionDashboardData = async (division) => {
  const result = await getBacnetDashboardData();
  const key = String(division || "")
    .trim()
    .toLowerCase();

  return {
    ...result,
    meters: result.divisions[key] || [],
    division: key,
  };
};

export const summarizeMeters = (meters = []) => {
  const sumAvailable = (field) =>
    meters.reduce((sum, meter) => {
      const value = meter.readings?.[field]?.liveValue;
      return value === null || !Number.isFinite(value) ? sum : sum + value;
    }, 0);

  const online = meters.filter(
    (meter) =>
      meter.readings?.status?.hasLiveValue &&
      meter.readings.status.liveValue > 0,
  ).length;

  return {
    meterCount: meters.length,
    onlineMeters: online,
    unavailableMeters: meters.length - online,
    totalPower: sumAvailable("power"),
    totalKwh: sumAvailable("kwh"),
    totalAmp: sumAvailable("amp"),
  };
};
