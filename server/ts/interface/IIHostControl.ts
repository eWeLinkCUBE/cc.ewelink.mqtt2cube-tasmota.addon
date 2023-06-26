export interface IIHostControl {
    directive: {
        header: {
            name: string;
            message_id: string;
            version: string;
        };
        endpoint: {
            serial_number: string;
            third_serial_number: string;
            tags: {
                deviceInfo: string;
            };
        };
        payload: {
            state: object;
        };
    };
}
