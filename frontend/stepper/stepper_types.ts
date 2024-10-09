import {Range} from '../buffers/buffer_types';
import {QuickalgoLibraryCall} from './api';

export interface StepperProgressParameters {
    range?: Range,
    steps?: number,
    delay?: number,
    libCalls?: {
        call: QuickalgoLibraryCall,
        result: any,
    }[],
}
