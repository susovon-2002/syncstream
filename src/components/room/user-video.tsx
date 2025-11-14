'use client';

import { useState, useEffect, useRef } from 'react';
import type { User } from 'firebase/auth';
import { Card } from '../ui/card';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

interface UserVideoProps {
    user: User;
}

export function UserVideo({ user }: UserVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (error) {
                console.error('Error accessing media devices.', error);
                toast({
                    variant: 'destructive',
                    title: 'Media Access Denied',
                    description: 'Could not access camera or microphone. Please check permissions.',
                });
            }
        };

        getMedia();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = isMicOn);
            stream.getVideoTracks().forEach(track => track.enabled = isCameraOn);
        }
    }, [isMicOn, isCameraOn, stream]);


    const toggleMic = () => setIsMicOn(prev => !prev);
    const toggleCamera = () => setIsCameraOn(prev => !prev);

    return (
        <Card className="relative aspect-video w-full overflow-hidden rounded-md bg-secondary">
            {stream ? (
                <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                </div>
            )}
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <Button variant="secondary" size="icon" onClick={toggleMic}>
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button variant="secondary" size="icon" onClick={toggleCamera}>
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
            </div>
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                {user.displayName || user.email}
            </div>
        </Card>
    );
}
