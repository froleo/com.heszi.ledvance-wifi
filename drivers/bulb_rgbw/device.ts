import { BaseDevice, ICapabilityMap, TuyaProtocolVersion } from '../../base/device';

enum COLOR_DATA {
  HUE = 0,
  SATURATION = 1,
  BRIGHTNESS = 2,
}

enum LIGHT_MODE {
  TEMPERATURE = 'temperature',
  COLOR = 'color'
}

module.exports = class BulbRGBWDevice extends BaseDevice {
  override tuyaProtocolVersion = TuyaProtocolVersion.V3_5;
  currentWorkMode: 'white' | 'colour' = 'white';

  override capabilityMap:ICapabilityMap[] = [
    {
      capability: 'onoff',
      dp: '20',
      toDevice: (value: boolean) => !!value,
      fromDevice: (value: any) => !!value,
    },
    {
      capability: 'light_mode',
      dp: '21',
      toDevice: (value: any) => {
        const workMode = value === LIGHT_MODE.TEMPERATURE ? 'white' : 'colour';
        this.currentWorkMode = workMode;
        return workMode;
      },
      fromDevice: (value: any) => {
        this.currentWorkMode = value === 'colour' ? 'colour' : 'white';
        return this.currentWorkMode === 'white' ? LIGHT_MODE.TEMPERATURE : LIGHT_MODE.COLOR;
      },
    },
    {
      capability: 'dim',
      dp: '22',
      toDevice: (value: number) => this.toDeviceBrightness(value),
      fromDevice: (value: any) => value / 1000,
    },
    {
      capability: 'light_hue',
      dp: '24',
      toDevice: (value: any) => this.toDeviceColorData(COLOR_DATA.HUE, value),
      fromDevice: (value: any) => this.fromDeviceColorData(COLOR_DATA.HUE, value),
    },
    {
      capability: 'light_saturation',
      dp: '24',
      toDevice: (value: any) => this.toDeviceColorData(COLOR_DATA.SATURATION, value),
      fromDevice: (value: any) => this.fromDeviceColorData(COLOR_DATA.SATURATION, value),
    },
  ];

  currentColorData: string = '000003e803e8';

  splitColorData(colorData: string) {
    const safeColorData = colorData.length >= 12 ? colorData : this.currentColorData;
    const ret = [];
    ret.push(safeColorData.substring(0, 4));
    ret.push(safeColorData.substring(4, 8));
    ret.push(safeColorData.substring(8, 12));
    return ret;
  }

  toDeviceColorData(type: COLOR_DATA, value: number) {
    const colorData = this.splitColorData(this.currentColorData);

    if (type === COLOR_DATA.HUE) {
      colorData[type] = Math.round(value * 360).toString(16).padStart(4, '0');
    } else {
      colorData[type] = Math.round(value * 1000).toString(16).padStart(4, '0');
    }

    this.currentColorData = colorData.join('');
    return this.currentColorData;
  }

  toDeviceBrightness(value: number) {
    const clamped = Math.max(0.01, value);

    if (this.currentWorkMode === 'colour') {
      return this.toDeviceColorData(COLOR_DATA.BRIGHTNESS, clamped);
    }

    return Math.round(clamped * 1000);
  }

  fromDeviceColorData(type: COLOR_DATA, value: string) {
    this.currentColorData = value;
    const colorData = this.splitColorData(this.currentColorData);

    if (type === COLOR_DATA.HUE) {
      return parseInt(colorData[type], 16) / 360;
    }

    return parseInt(colorData[type], 16) / 1000;
  }

  override async onInit() {
    this.setCapabilitiyValues({
      '20': false,
      '21': LIGHT_MODE.TEMPERATURE,
      '22': 0,
      '24': this.currentColorData,
    });

    super.onInit();
  }

  override registerCapabilities(): void {
    this.capabilityMap.forEach(capability => {
      this.registerCapabilityListener(capability.capability, value => {
        if (capability.capability === 'dim') {
          const brightnessValue = capability.toDevice(value);
          if (this.currentWorkMode === 'colour') {
            this.setDeviceValue('24', brightnessValue);
          } else {
            this.setDeviceValue('22', brightnessValue);
          }
          return;
        }

        this.setDeviceValue(capability.dp, capability.toDevice(value));
      });
    });
  }

  override onDisconnected() {
    this.setCapabilitiyValues({ '20': false });
  }
};
