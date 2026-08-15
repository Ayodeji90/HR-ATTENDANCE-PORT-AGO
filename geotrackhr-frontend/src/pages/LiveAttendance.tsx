import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import { MapPin, Camera, RefreshCw, Video, VideoOff, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { fetchMe } from '@/services/employee';
import { fetchSites } from '@/services/site';
import {
  fetchEmployeeAttendanceHistory,
  punchEndpoint,
  AttendanceEventType,
  AttendanceRecord,
} from '@/services/attendance';
import {
  currentAttendanceWindow,
  getLocalToday,
  isLateCheckIn,
  ACTION_LABELS,
  WINDOW_ACTION,
  WINDOW_LABELS,
} from '@/utils/attendanceWindows';

type Site = {
  id: string;
  name: string;
  latitude: number | string;
  longitude: number | string;
  radius_meters: number | string;
};

type Coords = { latitude: number; longitude: number; accuracy: number | null };

const ACTIONS: AttendanceEventType[] = ['check_in', 'afternoon_confirm', 'check_out'];

const LiveAttendance: React.FC = () => {
  const [employee, setEmployee] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<AttendanceEventType | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // ── GPS ──────────────────────────────────────────────────────────────
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationErrorRef = useRef<string | null>(null); // sync read after await

  // ── Camera / selfie ──────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'live' | 'denied'>('idle');
  const [selfie, setSelfie] = useState<string | null>(null);
  // Face-match distance from the last punch (lower = closer match), set from
  // the attendance record the backend returns after verification.
  const [lastFaceDistance, setLastFaceDistance] = useState<number | null>(null);

  // ── Late check-in reason modal ───────────────────────────────────────
  const [reasonModal, setReasonModal] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: '',
  });

  const today = getLocalToday();
  const window = currentAttendanceWindow();
  const activeAction = WINDOW_ACTION[window];
  const todayRecords = useMemo(() => records.filter((r) => r.event_date === today), [records, today]);
  const recordFor = (type: AttendanceEventType): AttendanceRecord | undefined =>
    todayRecords.find((r) => r.event_type === type);

  const loadData = useCallback(async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      const me = await fetchMe();
      setEmployee(me);
      const siteRes = await fetchSites({ limit: 1000 });
      const siteList: Site[] = siteRes.data?.data ?? [];
      setSites(siteList);
      if (!selectedSiteId && siteList.length > 0) {
        setSelectedSiteId(siteList[0].id);
      }
      const history = await fetchEmployeeAttendanceHistory(me.id).catch(() => []);
      setRecords(history);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error?.message ?? 'Failed to load your attendance data.');
    } finally {
      setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    loadData();
    // The backend exposes attendance demo mode (ATTENDANCE_DEMO_MODE=true on
    // Render) via /api/health — when on, every punch is accepted, so the page
    // highlights all punch buttons and shows a note instead of only the
    // time-window-valid action.
    api
      .get('/health')
      .then((r) => setDemoMode(!!r.data?.data?.attendanceDemoMode))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ── GPS helpers ──────────────────────────────────────────────────────
  const getLocation = useCallback(async (): Promise<Coords | null> => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return null;
    }
    setLocating(true);
    setLocationError(null);
    locationErrorRef.current = null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next: Coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          };
          setCoords(next);
          setSubmitError(null);
          setLocating(false);
          resolve(next);
        },
        (err) => {
          const msg =
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied — allow location access to check in.'
              : 'Unable to get your GPS position. Try again.';
          setLocationError(msg);
          locationErrorRef.current = msg;
          setLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
    });
  }, []);

  // ── Camera helpers ───────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('denied');
      return;
    }
    setCameraState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraState('live');
    } catch {
      setCameraState('denied');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  const captureSelfie = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfie(dataUrl);
    setSubmitError(null);
    stopCamera();
  }, [stopCamera]);

  const handleFileCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelfie(reader.result as string);
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // ── Punch pipeline ───────────────────────────────────────────────────
  const performPunch = useCallback(
    async (eventType: AttendanceEventType, position: Coords, reason?: string) => {
      setSubmitting(eventType);
      setSubmitError(null);
      setSuccess(null);
      try {
        const deviceInfo = `web · ${navigator.userAgent.slice(0, 220)}`;
        const record = await punchEndpoint[eventType]({
          site_id: selectedSiteId,
          latitude: position.latitude,
          longitude: position.longitude,
          reason,
          selfie: selfie ?? undefined,
          gps_accuracy: position.accuracy ?? undefined,
          device_info: deviceInfo,
        });
        const distance = record.facial_match_score != null ? Number(record.facial_match_score) : null;
        setLastFaceDistance(distance);
        setSuccess(
          `${ACTION_LABELS[eventType]} recorded — GPS + live face verified${distance != null ? ` (match ${distance.toFixed(2)})` : ''}.`,
        );
        setSelfie(null);
        setCoords(null);
        await loadData();
      } catch (err: any) {
        const code = err?.response?.data?.error?.code;
        if (code === 'FACIAL_MISMATCH') {
          setSubmitError('Face does not match the enrolled employee — only the registered person can punch.');
        } else if (code === 'FACIAL_NOT_ENROLLED') {
          setSubmitError('No face enrolled for your account — ask HR to register your face before punching.');
        } else if (code === 'FACIAL_SELFIE_REQUIRED') {
          setSubmitError('A live selfie is required to verify your identity — capture one before punching.');
        } else if (code === 'NO_FACE_DETECTED') {
          setSubmitError('No face detected in the selfie — retake facing the camera.');
        } else {
          setSubmitError(err?.response?.data?.error?.message ?? `${ACTION_LABELS[eventType]} failed. Try again.`);
        }
      } finally {
        setSubmitting(null);
      }
    },
    [selectedSiteId, selfie, loadData],
  );

  const handleAction = useCallback(
    async (eventType: AttendanceEventType) => {
      setSubmitError(null);
      setSuccess(null);
      if (!selectedSiteId) {
        setSubmitError('Select a site before punching.');
        return;
      }
      const position = coords ?? (await getLocation());
      if (!position) {
        setSubmitError(locationErrorRef.current ?? 'Get your GPS location first.');
        return;
      }
      if (!selfie) {
        setSubmitError('Capture a live selfie before punching.');
        return;
      }
      if (eventType === 'check_in' && !demoMode && isLateCheckIn()) {
        setReasonModal({ open: true, reason: '' });
        return;
      }
      await performPunch(eventType, position, undefined);
    },
    [selectedSiteId, coords, selfie, locationError, getLocation, performPunch, demoMode],
  );

  const submitLateReason = useCallback(async () => {
    const { reason } = reasonModal;
    setReasonModal((m) => ({ ...m, open: false }));
    const position = coords;
    if (!position) {
      setSubmitError('GPS location expired — get your location again.');
      return;
    }
    await performPunch('check_in', position, reason.trim() || undefined);
  }, [reasonModal, coords, performPunch]);

  if (loading && !employee) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Live Attendance</h1>
          <p className="mt-1 text-sm text-ink-500">
            {employee ? `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || 'Employee' : 'Employee'} ·{' '}
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
            <span className="font-medium text-ink-700">{WINDOW_LABELS[window]}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshCw size={15} /> Refresh
        </Button>
      </div>

      {success && <Alert tone="success" className="mb-4">{success}</Alert>}
      {submitError && <Alert tone="danger" className="mb-4">{submitError}</Alert>}
      {lastFaceDistance != null && (
        <Alert tone="info" className="mb-4">
          Last punch face match distance: {lastFaceDistance.toFixed(3)} (lower = better; must be ≤ 0.6 to pass).
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: site + GPS + selfie */}
        <div className="space-y-4 lg:col-span-2">
          {/* Today's status */}
          <Card title="Today's status">
            <div className="grid grid-cols-3 gap-3">
              {ACTIONS.map((type) => {
                const rec = recordFor(type);
                return (
                  <div key={type} className="rounded-md border border-ink-100 bg-ink-50/60 p-3">
                    <p className="text-xs font-medium text-ink-500">{ACTION_LABELS[type]}</p>
                    <div className="mt-1.5">
                      {rec ? (
                        <Badge tone={rec.status === 'approved' ? 'success' : rec.status === 'pending' ? 'warning' : 'danger'}>
                          {rec.status === 'approved' ? 'Approved' : rec.status === 'pending' ? 'Pending' : 'Rejected'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-ink-400">Not yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Site selection */}
          <Card title="Your site">
            <p className="mb-3 text-sm text-ink-500">The geofence your GPS is verified against.</p>
            <Select
              label="Working site"
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSubmitError(null);
              }}
            >
              <option value="">Select a site…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Card>

          {/* Punch buttons */}
          <Card title="Punch in / out">
            <p className="mb-3 text-sm text-ink-500">
              Current window: <span className="font-medium text-ink-700">{WINDOW_LABELS[window]}</span>. Your GPS must be
              inside the site's geofence.
            </p>
            {demoMode && (
              <p className="mb-3 rounded-md bg-ink-50/60 px-3 py-2 text-xs font-medium text-success-700">
                Demo mode is on — geofence and time-window checks are bypassed, so any punch is accepted from anywhere,
                anytime.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ACTIONS.map((type) => {
                const done = !!recordFor(type);
                const isActive = demoMode || activeAction === type;
                return (
                  <Button
                    key={type}
                    variant={isActive ? 'primary' : 'secondary'}
                    disabled={done || locating}
                    loading={submitting === type}
                    onClick={() => handleAction(type)}
                  >
                    {done ? (
                      <>
                        <CheckCircle2 size={16} /> Done
                      </>
                    ) : (
                      ACTION_LABELS[type]
                    )}
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right column: GPS + selfie */}
        <div className="space-y-4">
          {/* GPS */}
          <Card
            title="Device location"
            action={
              <Button variant="ghost" size="sm" loading={locating} onClick={getLocation}>
                <MapPin size={15} /> {coords ? 'Refresh' : 'Get location'}
              </Button>
            }
          >
            {locationError && <Alert tone="danger" className="mb-3">{locationError}</Alert>}
            {coords ? (
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 text-success-700">
                  <CheckCircle2 size={15} /> Location locked
                </p>
                <p className="font-mono text-ink-700">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-ink-400">
                  Accuracy: {coords.accuracy ? `±${Math.round(coords.accuracy)} m` : 'unknown'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-400">
                No location yet. Tap “Get location” — the browser will ask for permission.
              </p>
            )}
          </Card>

          {/* Selfie */}
          <Card
            title="Live selfie"
            action={
              !selfie && cameraState !== 'live' ? (
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={15} /> Upload
                </Button>
              ) : undefined
            }
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileCapture}
            />

            {selfie ? (
              <div>
                <img src={selfie} alt="Captured selfie" className="w-full rounded-md border border-ink-100" />
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelfie(null)}>
                    Discard
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Re-capture
                  </Button>
                </div>
              </div>
            ) : cameraState === 'starting' || cameraState === 'live' ? (
              <div>
                <div className="relative overflow-hidden rounded-md bg-ink-950">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {cameraState === 'starting' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner className="border-white/40 border-t-white" />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={captureSelfie} disabled={cameraState === 'starting'}>
                    <Camera size={15} /> Capture
                  </Button>
                  <Button variant="secondary" size="sm" onClick={stopCamera}>
                    <VideoOff size={15} /> Stop
                  </Button>
                </div>
              </div>
            ) : cameraState === 'denied' ? (
              <div className="space-y-3">
                <Alert tone="warning">
                  Camera unavailable or permission denied. You can upload a photo instead — on a phone this opens the
                  front camera.
                </Alert>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={15} /> Choose photo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink-400">
                  Capture a live photo of yourself — it's stored with your punch as proof of attendance.
                </p>
                <Button size="sm" onClick={startCamera}>
                  <Video size={15} /> Start camera
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Late check-in reason modal */}
      <Modal
        isOpen={reasonModal.open}
        onClose={() => setReasonModal((m) => ({ ...m, open: false }))}
        title="Late check-in"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReasonModal((m) => ({ ...m, open: false }))}>
              Cancel
            </Button>
            <Button onClick={submitLateReason} loading={submitting === 'check_in'}>
              Submit
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-600">
          It's after 9:00 AM. Add a reason — your check-in will be flagged for HR approval.
        </p>
        <textarea
          value={reasonModal.reason}
          onChange={(e) => setReasonModal((m) => ({ ...m, reason: e.target.value }))}
          placeholder="Why are you late?"
          rows={3}
          className="focus-ring w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900"
        />
      </Modal>
    </div>
  );
};

export default LiveAttendance;
