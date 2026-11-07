import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera, CameraOff, ScanFace, ShieldCheck, Activity, RotateCcw, LoaderCircle,
} from 'lucide-react'
import {
  DrawingUtils, FilesetResolver, PoseLandmarker,
} from '@mediapipe/tasks-vision'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'

type ExerciseType = 'squat' | 'pushup'
type MovementPhase = 'up' | 'down'

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180) / Math.PI)
  if (angle > 180) angle = 360 - angle
  return Math.round(angle)
}

function getCameraError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Camera permission was denied. Allow camera access in your browser settings, then try again.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera was found. Connect a camera or use the exercise instructions without camera tracking.'
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Your camera may be in use by another application. Close other apps using it and try again.'
    }
    if (error.name === 'OverconstrainedError') {
      return 'The camera does not support the requested settings. Try another camera.'
    }
    if (error.name === 'SecurityError') {
      return 'Camera access requires a secure connection (HTTPS or localhost).'
    }
    return error.message
  }
  return 'Unable to start the AI camera. Please try again.'
}

export default function CameraCoach() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<PoseLandmarker | null>(null)
  const animationRef = useRef<number | null>(null)
  const phaseRef = useRef<MovementPhase>('up')
  const repsRef = useRef(0)
  const lastUiUpdateRef = useRef(0)
  const selectedExerciseRef = useRef<ExerciseType>('squat')
  const startingRef = useRef(false)
  const mountedRef = useRef(true)

  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squat')
  const [cameraActive, setCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Camera is currently off')
  const [error, setError] = useState('')
  const [reps, setReps] = useState(0)
  const [jointAngle, setJointAngle] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('Stand sideways in front of the camera')
  const [phase, setPhase] = useState<MovementPhase>('up')

  const resetWorkout = useCallback((exercise = selectedExerciseRef.current) => {
    selectedExerciseRef.current = exercise
    repsRef.current = 0
    phaseRef.current = 'up'
    lastUiUpdateRef.current = 0
    setReps(0)
    setPhase('up')
    setJointAngle(null)
    setFeedback(
      exercise === 'squat'
        ? 'Stand sideways with your full body visible'
        : 'Turn sideways and keep your shoulder, elbow and wrist visible',
    )
  }, [])

  const stopCamera = useCallback((updateState = true) => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    landmarkerRef.current?.close()
    landmarkerRef.current = null

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (videoRef.current) videoRef.current.srcObject = null

    if (updateState && mountedRef.current) {
      setCameraActive(false)
      setStatus('Camera is currently off')
      resetWorkout()
    }
  }, [resetWorkout])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopCamera(false)
    }
  }, [stopCamera])

  const startCamera = async () => {
    if (startingRef.current || cameraActive) return
    startingRef.current = true

    try {
      setError('')
      setLoading(true)
      resetWorkout()
      setStatus('Requesting camera permission...')

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported. Use HTTPS or localhost in a supported browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('Camera preview is unavailable.')

      video.srcObject = stream
      await video.play()

      setStatus('Loading AI pose detection...')

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm',
      )

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })

      if (!mountedRef.current) {
        landmarker.close()
        return
      }

      landmarkerRef.current = landmarker
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) throw new Error('Unable to initialize the camera overlay.')

      const drawingUtils = new DrawingUtils(context)
      setCameraActive(true)
      setStatus('AI Camera Coach is tracking your movement')

      const detectPose = () => {
        const currentVideo = videoRef.current
        const currentCanvas = canvasRef.current
        const currentLandmarker = landmarkerRef.current

        if (!currentVideo || !currentCanvas || !currentLandmarker) return

        if (currentVideo.readyState >= 2) {
          currentCanvas.width = currentVideo.videoWidth
          currentCanvas.height = currentVideo.videoHeight
          context.clearRect(0, 0, currentCanvas.width, currentCanvas.height)

          try {
            const result = currentLandmarker.detectForVideo(currentVideo, performance.now())

            if (result.landmarks.length > 0) {
              const landmarks = result.landmarks[0]
              drawingUtils.drawConnectors(
                landmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: '#22c55e', lineWidth: 4 },
              )
              drawingUtils.drawLandmarks(landmarks, {
                color: '#facc15',
                lineWidth: 2,
                radius: 4,
              })

              const exercise = selectedExerciseRef.current
              const indices = exercise === 'squat'
                ? [[23, 25, 27], [24, 26, 28]]
                : [[11, 13, 15], [12, 14, 16]]

              const sides = indices.map((side) => side.map((index) => landmarks[index]))
              const visibility = sides.map((points) =>
                Math.min(...points.map((point) => point.visibility ?? 0)),
              )
              const chosenSide = visibility[0] >= visibility[1] ? 0 : 1
              const points = sides[chosenSide]
              const bestVisibility = visibility[chosenSide]

              if (bestVisibility >= 0.5) {
                const angle = calculateAngle(points[0], points[1], points[2])
                const now = Date.now()
                const downThreshold = exercise === 'squat' ? 100 : 90
                const upThreshold = exercise === 'squat' ? 160 : 155

                if (now - lastUiUpdateRef.current > 150) {
                  setJointAngle(angle)
                  setFeedback(
                    angle > upThreshold
                      ? exercise === 'squat'
                        ? 'Good! Standing position detected.'
                        : 'Good! Arms are extended. Lower with control.'
                      : angle < downThreshold
                        ? exercise === 'squat'
                          ? 'Squat depth detected. Push up slowly.'
                          : 'Push-up depth detected. Push yourself up.'
                        : 'Keep going. Move with control.',
                  )
                  lastUiUpdateRef.current = now
                }

                if (phaseRef.current === 'up' && angle < downThreshold) {
                  phaseRef.current = 'down'
                  setPhase('down')
                  setFeedback('Good depth! Now return to the starting position.')
                } else if (phaseRef.current === 'down' && angle > upThreshold) {
                  phaseRef.current = 'up'
                  repsRef.current += 1
                  setPhase('up')
                  setReps(repsRef.current)
                  setFeedback('Rep completed! Great work.')
                }
              } else {
                const now = Date.now()
                if (now - lastUiUpdateRef.current > 500) {
                  setFeedback(
                    exercise === 'squat'
                      ? 'Keep your hip, knee and ankle visible from the side.'
                      : 'Keep your shoulder, elbow and wrist visible from the side.',
                  )
                  setJointAngle(null)
                  lastUiUpdateRef.current = now
                }
              }
            } else {
              const now = Date.now()
              if (now - lastUiUpdateRef.current > 500) {
                setFeedback('No body detected. Move into the camera frame.')
                setJointAngle(null)
                lastUiUpdateRef.current = now
              }
            }
          } catch {
            setError('Pose detection stopped unexpectedly. Stop the camera and try again.')
            stopCamera()
            return
          }
        }

        animationRef.current = requestAnimationFrame(detectPose)
      }

      animationRef.current = requestAnimationFrame(detectPose)
    } catch (err) {
      stopCamera()
      if (mountedRef.current) {
        setError(getCameraError(err))
        setStatus('Camera could not start')
      }
    } finally {
      startingRef.current = false
      if (mountedRef.current) setLoading(false)
    }
  }

  const changeExercise = (exercise: ExerciseType) => {
    if (exercise === selectedExercise) return
    selectedExerciseRef.current = exercise
    setSelectedExercise(exercise)
    resetWorkout(exercise)
  }

  const exerciseName = selectedExercise === 'squat' ? 'Squat' : 'Push-up'
  const jointName = selectedExercise === 'squat' ? 'Knee Angle' : 'Elbow Angle'

  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <ScanFace size={18} />
          AI FITNESS TECHNOLOGY
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          AI Camera Coach
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track your movement and count exercise repetitions in real time.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Select Exercise</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['squat', 'pushup'] as ExerciseType[]).map((exercise) => (
            <button
              key={exercise}
              type="button"
              onClick={() => changeExercise(exercise)}
              disabled={loading}
              className={`rounded-xl border p-4 font-semibold transition disabled:opacity-50 ${
                selectedExercise === exercise
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              {exercise === 'squat' ? 'Squat' : 'Push-up'}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Side view recommended. Keep the required joints visible. Changing exercise resets the current rep count.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 dark:border-gray-700">
        <div className="relative flex aspect-video items-center justify-center">
          <video
            ref={videoRef}
            className={`h-full w-full object-contain ${cameraActive ? 'block' : 'hidden'}`}
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 h-full w-full ${cameraActive ? 'block' : 'hidden'}`}
          />
          {!cameraActive && (
            <div className="px-5 text-center text-white">
              {loading ? (
                <div className="mx-auto max-w-sm">
                  <LoadingState
                    title="Starting AI Camera"
                    description="Requesting camera access and loading pose detection..."
                  />
                </div>
              ) : (
                <>
                  <CameraOff className="mx-auto mb-3" size={44} />
                  <p className="font-semibold">Camera is not active</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Start your camera to begin pose detection.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-300">
            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${cameraActive ? 'bg-green-400' : 'bg-gray-500'}`} />
            {status}
          </div>
          {cameraActive ? (
            <button
              type="button"
              onClick={() => stopCamera()}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              <CameraOff size={18} />
              Stop Camera
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
              {loading ? 'Starting Camera...' : 'Start Camera'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <ErrorState
          title="Camera or pose detection error"
          message={error}
          onRetry={() => {
            setError('')
            void startCamera()
          }}
          retryLabel="Try camera again"
        />
      )}

      {!cameraActive && !loading && (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">Camera unavailable?</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You can still practise using the exercise library and log your workout manually. Camera tracking is optional.
          </p>
          <a
            href="/dashboard/exercise-library"
            className="mt-3 inline-flex text-sm font-semibold text-emerald-600 hover:underline"
          >
            Open exercise library
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Activity size={18} />
            {exerciseName} Reps
          </div>
          <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{reps}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Completed repetitions</p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">{jointName}</div>
          <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
            {jointAngle !== null ? `${jointAngle}°` : '--'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Estimated visible-side joint angle</p>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">Movement Phase</div>
          <p className="mt-2 text-2xl font-bold capitalize text-gray-900 dark:text-white">
            {cameraActive ? phase : 'Idle'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {phase === 'down'
              ? selectedExercise === 'squat' ? 'Return to standing' : 'Push back up'
              : selectedExercise === 'squat' ? 'Ready to squat' : 'Ready to lower'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
          <ScanFace size={20} />
          Movement Feedback
        </div>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-200">{feedback}</p>
        <button
          type="button"
          onClick={() => resetWorkout()}
          disabled={loading}
          className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
        >
          <RotateCcw size={16} />
          Reset Rep Counter
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <ScanFace className="text-emerald-500" size={20} />
            Pose Detection
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            MediaPipe estimates knee or elbow angles for the selected exercise using visible body landmarks.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <ShieldCheck className="text-emerald-500" size={20} />
            Camera Privacy
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Camera frames are processed in your browser. This page does not upload or save video recordings.
          </p>
        </div>
      </div>

      <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
        Prototype movement feedback only. Rep counting uses estimated joint-angle thresholds and is not a medical or professional form assessment. Stop if you experience pain or discomfort.
      </p>
    </div>
  )
}
