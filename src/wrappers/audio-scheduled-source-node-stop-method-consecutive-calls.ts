import { createNativeGainNode } from '../factories/native-gain-node';
import { INativeConstantSourceNode } from '../interfaces';
import {
    TNativeAudioBufferSourceNode,
    TNativeAudioNode,
    TNativeAudioParam,
    TNativeOscillatorNode,
    TUnpatchedAudioContext,
    TUnpatchedOfflineAudioContext
} from '../types';

export const wrapAudioScheduledSourceNodeStopMethodConsecutiveCalls = (
    audioScheduledSourceNode: TNativeAudioBufferSourceNode | INativeConstantSourceNode | TNativeOscillatorNode,
    audioContext: TUnpatchedAudioContext | TUnpatchedOfflineAudioContext
): void => {
    const gainNode = createNativeGainNode(audioContext);

    audioScheduledSourceNode.connect(gainNode);

    const disconnectGainNode = ((disconnect) => {
        return () => {
            disconnect.call(audioScheduledSourceNode, gainNode);
            (<any> audioScheduledSourceNode).removeEventListener('ended', disconnectGainNode);
        };
    })(audioScheduledSourceNode.disconnect);

    (<any> audioScheduledSourceNode).addEventListener('ended', disconnectGainNode);

    audioScheduledSourceNode.connect = ((destination: TNativeAudioNode | TNativeAudioParam, output = 0, input = 0) => {
        if (destination instanceof AudioNode) {
            gainNode.connect.call(gainNode, destination, output, input);

            // Bug #11: Safari does not support chaining yet.
            return destination;
        }

        // @todo This return statement is necessary to satisfy TypeScript.
        return gainNode.connect.call(gainNode, destination, output);
    });

    audioScheduledSourceNode.disconnect = function () {
        gainNode.disconnect.apply(gainNode, arguments);
    };

    audioScheduledSourceNode.stop = ((stop) => {
        let isStopped = false;

        return (when = 0) => {
            if (isStopped) {
                try {
                    stop.call(audioScheduledSourceNode, when);
                } catch (err) {
                    gainNode.gain.setValueAtTime(0, when);
                }
            } else {
                stop.call(audioScheduledSourceNode, when);

                isStopped = true;
            }
        };
    })(audioScheduledSourceNode.stop);
};
