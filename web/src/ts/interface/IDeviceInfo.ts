import type EDeviceCategory from '../enum/EDeviceCategory';

export default interface IDeviceInfo {
    name: string;
    id: string;
    online: boolean;
    synced: boolean;
    category: EDeviceCategory;
    syncing: boolean;
}
