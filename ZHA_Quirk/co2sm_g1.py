# http://efektalab.com/Efekta_CO2_Smart_Monitor
from enum import Enum
from typing import Final

from zigpy.profiles import zha
from zigpy.quirks import CustomCluster
from zigpy.quirks.v2 import (
    QuirkBuilder,
    ReportingConfig,
    SensorDeviceClass,
    SensorStateClass,
)
from zigpy.quirks.v2.homeassistant.number import NumberDeviceClass
import zigpy.types as t
from zigpy.zcl import ClusterType
from zigpy.zcl.foundation import ZCLAttributeDef
from zigpy.zcl.clusters.general import Basic, OnOff
from zigpy.zcl.clusters.measurement import (
    CarbonDioxideConcentration,
    RelativeHumidity,
    TemperatureMeasurement,
)
from zigpy.quirks.v2.homeassistant import (
    UnitOfTime,
    UnitOfTemperature,
    UnitOfLength,
    CONCENTRATION_PARTS_PER_MILLION,
    PERCENTAGE,
)

EFEKTA = "EfektaLab"


class CO2Measurement(CarbonDioxideConcentration, CustomCluster):
    class AttributeDefs(CarbonDioxideConcentration.AttributeDefs):
        reading_delay: Final = ZCLAttributeDef(id=0x0201, type=t.uint16_t, access="rw")
        light_indicator: Final = ZCLAttributeDef(id=0x0211, type=t.Bool, access="rw")
        light_indicator_level: Final = ZCLAttributeDef(id=0x0209, type=t.uint8_t, access="rw")
        set_altitude: Final = ZCLAttributeDef(id=0x0205, type=t.uint16_t, access="rw")
        forced_recalibration: Final = ZCLAttributeDef(id=0x0202, type=t.Bool, access="rw")
        manual_forced_recalibration: Final = ZCLAttributeDef(id=0x0207, type=t.uint16_t, access="rw")
        automatic_self_calibration: Final = ZCLAttributeDef(id=0x0402, type=t.Bool, access="rw")
        factory_reset_co2: Final = ZCLAttributeDef(id=0x0206, type=t.Bool, access="rw")
        enable_co2_gas: Final = ZCLAttributeDef(id=0x0220, type=t.Bool, access="rw")
        high_co2_gas: Final = ZCLAttributeDef(id=0x0221, type=t.uint16_t, access="rw")
        low_co2_gas: Final = ZCLAttributeDef(id=0x0222, type=t.uint16_t, access="rw")


class TempMeasurement(TemperatureMeasurement, CustomCluster):
    class AttributeDefs(TemperatureMeasurement.AttributeDefs):
        temperature_offset: Final = ZCLAttributeDef(id=0x0410, type=t.int16s, access="rw")


class RHMeasurement(RelativeHumidity, CustomCluster):
    class AttributeDefs(RelativeHumidity.AttributeDefs):
        humidity_offset: Final = ZCLAttributeDef(id=0x0210, type=t.int16s, access="rw")


(
    QuirkBuilder(EFEKTA, "EFEKTA_CO2_Smart_Monitor")
    .replaces_endpoint(1, device_type=zha.DeviceType.SIMPLE_SENSOR)
    .replaces(Basic, endpoint_id=1)
    .replaces(OnOff, endpoint_id=1, cluster_type=ClusterType.Client)
    .replaces(CO2Measurement, endpoint_id=1)
    .replaces(TempMeasurement, endpoint_id=1)
    .replaces(RHMeasurement, endpoint_id=1)
    .number(
        TempMeasurement.AttributeDefs.temperature_offset.name,
        TempMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="temperature_offset",
        fallback_name="Adjust temperature",
        unique_id_suffix="temperature_offset",
        min_value=-50,
        max_value=50,
        step=0.1,
        multiplier=0.1,
        device_class=NumberDeviceClass.TEMPERATURE,
        unit=UnitOfTemperature.CELSIUS,
        mode="box",
    )
    .number(
        RHMeasurement.AttributeDefs.humidity_offset.name,
        RHMeasurement.cluster_id,
        endpoint_id=1,
        translation_key="humidity_offset",
        fallback_name="Adjust humidity",
        unique_id_suffix="humidity_offset",
        min_value=-50,
        max_value=50,
        step=1,
        device_class=NumberDeviceClass.HUMIDITY,
        unit=PERCENTAGE,
        mode="box",
    )
    .number(
        CO2Measurement.AttributeDefs.reading_delay.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="reading_delay",
        fallback_name="Setting the sensor reading delay",
        unique_id_suffix="reading_delay",
        min_value=15,
        max_value=600,
        step=1,
        device_class=NumberDeviceClass.DURATION,
        unit=UnitOfTime.SECONDS,
    )
    .switch(
        CO2Measurement.AttributeDefs.light_indicator.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="light_indicator",
        fallback_name="Enable or Disable light indicator",
        unique_id_suffix="light_indicator",
    )
    .number(
        CO2Measurement.AttributeDefs.light_indicator_level.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="light_indicator_level",
        fallback_name="Light indicator level",
        unique_id_suffix="light_indicator_level",
        min_value=0,
        max_value=100,
        step=1,
        unit=PERCENTAGE,
    )
	.number(
        CO2Measurement.AttributeDefs.set_altitude.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="set_altitude",
        fallback_name="Setting altitude above sea level (for high accuracy of the CO2 sensor)",
        unique_id_suffix="set_altitude",
        min_value=0,
        max_value=5000,
        step=1,
        unit=UnitOfLength.METERS,
    )
    .switch(
        CO2Measurement.AttributeDefs.forced_recalibration.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="forced_recalibration",
        fallback_name="Start FRC (Perform Forced Recalibration of the CO2 Sensor)",
        unique_id_suffix="forced_recalibration",
    )
    .number(
        CO2Measurement.AttributeDefs.manual_forced_recalibration.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="manual_forced_recalibration",
        fallback_name="Start Manual FRC (Perform Forced Recalibration of the CO2 Sensor)",
        unique_id_suffix="manual_forced_recalibration",
        min_value=0,
        max_value=5000,
        step=1,
        unit=CONCENTRATION_PARTS_PER_MILLION,
    )
    .switch(
        CO2Measurement.AttributeDefs.automatic_self_calibration.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="automatic_self_calibration",
        fallback_name="Automatic self calibration",
        unique_id_suffix="automatic_self_calibration",
    )
    .switch(
        CO2Measurement.AttributeDefs.factory_reset_co2.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="factory_reset_co2",
        fallback_name="Factory Reset CO2 sensor",
        unique_id_suffix="factory_reset_co2",
    )
    .switch(
        CO2Measurement.AttributeDefs.enable_co2_gas.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="enable_co2_gas",
        fallback_name="Enable CO2 Gas Control",
        unique_id_suffix="enable_co2_gas",
    )
    .number(
        CO2Measurement.AttributeDefs.high_co2_gas.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="high_co2_gas",
        fallback_name="High CO2 Gas Border",
        unique_id_suffix="high_co2_gas",
        min_value=400,
        max_value=5000,
        step=1,
        unit=CONCENTRATION_PARTS_PER_MILLION,
    )
    .number(
        CO2Measurement.AttributeDefs.low_co2_gas.name,
        CO2Measurement.cluster_id,
        endpoint_id=1,
        translation_key="low_co2_gas",
        fallback_name="Low CO2 Gas Border",
        unique_id_suffix="low_co2_gas",
        min_value=400,
        max_value=5000,
        step=1,
        unit=CONCENTRATION_PARTS_PER_MILLION,
    )
    .add_to_registry()
)