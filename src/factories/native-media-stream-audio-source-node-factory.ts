import { TNativeMediaStreamAudioSourceNodeFactoryFactory } from '../types';

export const createNativeMediaStreamAudioSourceNodeFactory: TNativeMediaStreamAudioSourceNodeFactoryFactory = (
    createInvalidStateError,
    createNativeAudioNode
) => {
    return (nativeAudioContext, { mediaStream }) => {
        const audioStreamTracks = mediaStream.getAudioTracks();
        const nativeMediaStreamAudioSourceNode = createNativeAudioNode(nativeAudioContext, (ntvDCntxt) => {
            /*
             * Bug #151: Firefox & Safari do not use the audio track as input anymore if it gets removed from the mediaStream after construction.
             * Bug #159: Firefox & Safari pick the first audio track if the MediaStream has more than one audio track.
             */
            const filteredAudioStreamTracks = audioStreamTracks
                .sort((a, b) => ((a.id < b.id) ? -1 : (a.id > b.id) ? 1 : 0))
                .slice(0, 1);

            return ntvDCntxt.createMediaStreamSource(new MediaStream(filteredAudioStreamTracks));
        });

        // Bug #120: Firefox does not throw an error if the mediaStream has no audio track.
        if (audioStreamTracks.length === 0) {
            throw createInvalidStateError();
        }

        // Bug #63: Edge & Firefox do not expose the mediaStream yet.
        Object.defineProperty(nativeMediaStreamAudioSourceNode, 'mediaStream', { value: mediaStream });

        return nativeMediaStreamAudioSourceNode;
    };
};
