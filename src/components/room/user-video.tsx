'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useFirebase } from '@/firebase';
import { doc, collection, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface UserVideoProps {
    user: any; // roomUser object
    isLocalUser: boolean;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function UserVideo({ user: roomUser, isLocalUser }: UserVideoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { firestore, user: currentUser } = useFirebase();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const { toast } = useToast();
    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});

    // 1. Handle Local Media Capture
    useEffect(() => {
        if (!isLocalUser) return;

        const getMedia = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(mediaStream);
                setHasCameraPermission(true);
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
            } catch (error) {
                console.error('Error accessing media:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Media Access Denied',
                    description: 'Please enable camera/mic permissions to use video features.',
                });
            }
        };

        getMedia();
        return () => {
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [isLocalUser]);

    // 2. WebRTC Signaling Logic
    useEffect(() => {
        if (!firestore || !currentUser || !roomUser.roomId) return;

        const roomId = roomUser.roomId;
        const targetUid = roomUser.uid; // The user this component represents

        if (isLocalUser) {
            // I am the broadcaster. Listen for incoming offers from others.
            const signalsRef = collection(firestore, 'rooms', roomId, 'roomUsers', currentUser.uid, 'signals');
            const unsubscribe = onSnapshot(signalsRef, (snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const fromUid = change.doc.id;
                        if (data.offer && !data.answer) {
                            const pc = new RTCPeerConnection(ICE_SERVERS);
                            peerConnections.current[fromUid] = pc;
                            
                            stream?.getTracks().forEach(track => pc.addTrack(track, stream));

                            pc.onicecandidate = (event) => {
                                if (event.candidate) {
                                    updateDoc(change.doc.ref, { 
                                        answerCandidates: Array.isArray(data.answerCandidates) ? [...data.answerCandidates, event.candidate.toJSON()] : [event.candidate.toJSON()] 
                                    });
                                }
                            };

                            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            
                            updateDoc(change.doc.ref, { answer: { type: answer.type, sdp: answer.sdp } });
                        }
                    }
                });
            });
            return () => unsubscribe();
        } else {
            // I am the receiver. Initiate connection to the target user.
            if (!roomUser.isCameraOn) return;

            const initPC = async () => {
                const pc = new RTCPeerConnection(ICE_SERVERS);
                peerConnections.current[targetUid] = pc;

                const remoteStream = new MediaStream();
                pc.ontrack = (event) => {
                    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
                    if (videoRef.current) videoRef.current.srcObject = remoteStream;
                };

                const signalDoc = doc(firestore, 'rooms', roomId, 'roomUsers', targetUid, 'signals', currentUser.uid);
                
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        setDoc(signalDoc, { 
                            offerCandidates: Array.isArray(pc.localDescription) ? [] : [event.candidate.toJSON()] 
                        }, { merge: true });
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await setDoc(signalDoc, { offer: { type: offer.type, sdp: offer.sdp }, joinedAt: new Date() });

                const unsubscribe = onSnapshot(signalDoc, (doc) => {
                    const data = doc.data();
                    if (data?.answer && !pc.currentRemoteDescription) {
                        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                    if (data?.answerCandidates) {
                        data.answerCandidates.forEach((c: any) => pc.addIceCandidate(new RTCIceCandidate(c)));
                    }
                });

                return () => {
                    unsubscribe();
                    deleteDoc(signalDoc);
                };
            };

            const cleanup = initPC();
            return () => {
                cleanup.then(c => c?.());
                if (peerConnections.current[targetUid]) {
                    peerConnections.current[targetUid].close();
                    delete peerConnections.current[targetUid];
                }
            };
        }
    }, [firestore, currentUser, roomUser.isCameraOn, stream]);

    const toggleMic = () => {
        if (stream) {
            const newState = !isMicOn;
            stream.getAudioTracks().forEach(t => t.enabled = newState);
            setIsMicOn(newState);
        }
    };

    const toggleCamera = () => {
        if (stream) {
            const newState = !isCameraOn;
            stream.getVideoTracks().forEach(t => t.enabled = newState);
            setIsCameraOn(newState);
            // Update Firestore so others know to connect
            const userRef = doc(firestore!, 'rooms', roomUser.roomId, 'roomUsers', currentUser!.uid);
            updateDoc(userRef, { isCameraOn: newState });
        }
    };

    return (
        <Card className="relative aspect-video w-full overflow-hidden rounded-md bg-secondary shadow-lg">
            <video 
                ref={videoRef} 
                className="h-full w-full object-cover bg-black" 
                autoPlay 
                playsInline 
                muted={isLocalUser} 
            />
            
            {hasCameraPermission === false && isLocalUser && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center">
                    <Alert variant="destructive" className="max-w-[80%]">
                      <AlertTitle>Camera Required</AlertTitle>
                      <AlertDescription>Please enable camera access.</AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="absolute bottom-2 right-2 flex gap-1">
                {isLocalUser && (
                    <>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={toggleMic}>
                            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={toggleCamera}>
                            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                        </Button>
                    </>
                )}
            </div>

            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full border border-white/10">
                {roomUser.displayName} {isLocalUser ? '(You)' : ''}
            </div>
        </Card>
    );
}
