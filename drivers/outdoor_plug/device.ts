import { BaseDevice, ICapabilityMap } from '../../base/device';

module.exports = class OutdoorPlugDevice extends BaseDevice {
  override capabilityMap:ICapabilityMap[] = [
    {
      capability: 'onoff',
      dp: '1',
      toDevice: (value: boolean) => !!value,
      fromDevice: (value: any) => !!value,
    },
  ];

  override async onInit() {
    this.setCapabilitiyValues({
      '1': false,
    });

    super.onInit();
  }

  override onDisconnected() {
    this.setCapabilitiyValues({ '1': false });
  }
};
