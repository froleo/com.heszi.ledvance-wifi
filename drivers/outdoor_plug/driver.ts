import { BaseDriver } from '../../base/driver';

module.exports = class OutdoorPlugDriver extends BaseDriver {
    override discoveryStrategy = this.homey.discovery.getStrategy('ledvance_outdoor_plug');
};