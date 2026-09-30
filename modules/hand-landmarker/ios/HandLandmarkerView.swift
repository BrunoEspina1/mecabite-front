import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision

/// Camera preview + MediaPipe Hand and Pose Landmarkers in live-stream mode.
///
/// Frames are rotated to portrait and mirrored for the front camera *before* MediaPipe sees them,
/// so landmarks line up with the (mirrored) preview. `mirrored` in every event reports what
/// MediaPipe actually received, as required by the backend contract.
///
/// Both landmarkers get the SAME image with the SAME timestamp. Their results arrive in separate
/// callbacks, so they are joined by timestamp and emitted as one event once both are in. A frame
/// that one of them drops is dropped entirely (never half-filled).
class HandLandmarkerView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate,
  HandLandmarkerLiveStreamDelegate, PoseLandmarkerLiveStreamDelegate
{
  let onLandmarks = EventDispatcher()
  let onReady = EventDispatcher()
  let onError = EventDispatcher()

  private let session = AVCaptureSession()
  private let previewLayer: AVCaptureVideoPreviewLayer
  private let videoOutput = AVCaptureVideoDataOutput()
  private let sessionQueue = DispatchQueue(label: "handlandmarker.session")
  private let frameQueue = DispatchQueue(label: "handlandmarker.frames")
  private let resultQueue = DispatchQueue(label: "handlandmarker.results")

  // Owned by frameQueue.
  private var handLandmarker: HandLandmarker?
  private var poseLandmarker: PoseLandmarker?
  private var lastTimestampMs = -1

  private var active = false
  private var facing: AVCaptureDevice.Position = .front
  private var numHands = 1
  private var configured = false

  /// One frame waiting for both landmarkers. Owned by resultQueue, keyed by timestamp.
  private struct PendingFrame {
    let width: Int
    let height: Int
    let mirrored: Bool
    var hands: [[String: Any]]?
    var poseArrived = false
    /// 33 × [x, y, z, visibility]; nil when no body was detected.
    var pose: [[Double]]?
  }
  private var pending: [Int: PendingFrame] = [:]
  /// If one landmarker stops answering, don't let unmatched frames pile up.
  private let maxPending = 30

  required init(appContext: AppContext? = nil) {
    previewLayer = AVCaptureVideoPreviewLayer(session: session)
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    previewLayer.videoGravity = .resizeAspectFill
    layer.addSublayer(previewLayer)
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    previewLayer.frame = bounds
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    updateRunning()
  }

  // MARK: - Props

  func setActive(_ value: Bool) {
    active = value
    updateRunning()
  }

  func setFacing(_ value: AVCaptureDevice.Position) {
    guard value != facing else { return }
    facing = value
    sessionQueue.async { [weak self] in self?.configureInput() }
  }

  func setNumHands(_ value: Int) {
    guard value != numHands else { return }
    numHands = value
    frameQueue.async { [weak self] in self?.handLandmarker = nil }
  }

  // MARK: - Session

  private func updateRunning() {
    let shouldRun = active && window != nil
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if shouldRun {
        if !self.configured { self.configureSession() }
        if !self.session.isRunning {
          self.session.startRunning()
          DispatchQueue.main.async { self.onReady([:]) }
        }
      } else if self.session.isRunning {
        self.session.stopRunning()
        self.resultQueue.async { self.pending.removeAll() }
      }
    }
  }

  private func configureSession() {
    session.beginConfiguration()
    session.sessionPreset = .hd1280x720

    videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
    videoOutput.alwaysDiscardsLateVideoFrames = true
    videoOutput.setSampleBufferDelegate(self, queue: frameQueue)
    if session.canAddOutput(videoOutput) {
      session.addOutput(videoOutput)
    }
    session.commitConfiguration()
    configured = true
    configureInput()
  }

  private func configureInput() {
    guard configured else { return }
    session.beginConfiguration()
    defer { session.commitConfiguration() }

    session.inputs.forEach { session.removeInput($0) }
    guard
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: facing),
      let input = try? AVCaptureDeviceInput(device: device),
      session.canAddInput(input)
    else {
      emitError("No se pudo abrir la cámara")
      return
    }
    session.addInput(input)

    if let connection = videoOutput.connection(with: .video) {
      // Portrait, head up — the orientation the user sees.
      if #available(iOS 17.0, *) {
        if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
      } else if connection.isVideoOrientationSupported {
        connection.videoOrientation = .portrait
      }
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = facing == .front
      }
    }
  }

  // MARK: - Landmarkers

  private func modelPath(_ name: String) -> String? {
    guard
      let bundleURL = Bundle(for: HandLandmarkerView.self).url(forResource: "HandLandmarkerAssets", withExtension: "bundle"),
      let path = Bundle(url: bundleURL)?.path(forResource: name, ofType: "task")
    else {
      emitError("No se encontró el modelo \(name).task")
      return nil
    }
    return path
  }

  /// GPU first (needed for ≥ 20 fps with both models, RNF-02); CPU if the GPU delegate fails
  /// (e.g. on the simulator).
  private func withGPUFallback<T>(_ make: (Delegate) throws -> T) -> T? {
    do {
      return try make(.GPU)
    } catch {
      do {
        return try make(.CPU)
      } catch {
        emitError("No se pudo iniciar MediaPipe: \(error.localizedDescription)")
        return nil
      }
    }
  }

  private func makeHandLandmarker() -> HandLandmarker? {
    guard let path = modelPath("hand_landmarker") else { return nil }
    return withGPUFallback { delegate in
      let options = HandLandmarkerOptions()
      options.baseOptions.modelAssetPath = path
      options.baseOptions.delegate = delegate
      options.runningMode = .liveStream
      options.numHands = numHands
      options.minHandDetectionConfidence = 0.5
      options.minHandPresenceConfidence = 0.5
      options.minTrackingConfidence = 0.5
      options.handLandmarkerLiveStreamDelegate = self
      return try HandLandmarker(options: options)
    }
  }

  private func makePoseLandmarker() -> PoseLandmarker? {
    guard let path = modelPath("pose_landmarker_lite") else { return nil }
    return withGPUFallback { delegate in
      let options = PoseLandmarkerOptions()
      options.baseOptions.modelAssetPath = path
      options.baseOptions.delegate = delegate
      options.runningMode = .liveStream
      options.numPoses = 1
      options.minPoseDetectionConfidence = 0.5
      options.minPosePresenceConfidence = 0.5
      options.minTrackingConfidence = 0.5
      options.shouldOutputSegmentationMasks = false
      options.poseLandmarkerLiveStreamDelegate = self
      return try PoseLandmarker(options: options)
    }
  }

  // MARK: - Frames

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    if handLandmarker == nil { handLandmarker = makeHandLandmarker() }
    if poseLandmarker == nil { poseLandmarker = makePoseLandmarker() }
    guard let handLandmarker, let poseLandmarker else { return }

    // Capture time (presentation timestamp, monotonic host clock), not send time.
    let timestampMs = Int(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer)) * 1000)
    guard timestampMs > lastTimestampMs else { return }
    lastTimestampMs = timestampMs

    let frame = PendingFrame(
      width: CVPixelBufferGetWidth(pixelBuffer),
      height: CVPixelBufferGetHeight(pixelBuffer),
      mirrored: connection.isVideoMirrored
    )
    // Registered before detecting, so the callbacks always find it.
    resultQueue.sync { pending[timestampMs] = frame }

    do {
      let image = try MPImage(pixelBuffer: pixelBuffer, orientation: .up)
      try handLandmarker.detectAsync(image: image, timestampInMilliseconds: timestampMs)
      try poseLandmarker.detectAsync(image: image, timestampInMilliseconds: timestampMs)
    } catch {
      resultQueue.async { [weak self] in self?.pending[timestampMs] = nil }
      emitError("Error al procesar el cuadro: \(error.localizedDescription)")
    }
  }

  func handLandmarker(
    _ handLandmarker: HandLandmarker,
    didFinishDetection result: HandLandmarkerResult?,
    timestampInMilliseconds: Int,
    error: Error?
  ) {
    if let error {
      drop(timestampInMilliseconds, error)
      return
    }
    var hands: [[String: Any]] = []
    if let result {
      for (index, points) in result.landmarks.enumerated() {
        let category = index < result.handedness.count ? result.handedness[index].first : nil
        hands.append([
          "landmarks": points.map { [Double($0.x), Double($0.y), Double($0.z)] },
          // Raw MediaPipe label: the backend interprets it according to `mirrored`.
          "handedness": [
            "label": category?.categoryName ?? "",
            "score": Double(category?.score ?? 0),
          ],
        ])
      }
    }
    resultQueue.async { [weak self] in
      guard let self, self.pending[timestampInMilliseconds] != nil else { return }
      self.pending[timestampInMilliseconds]?.hands = hands
      self.emitIfComplete(timestampInMilliseconds)
    }
  }

  func poseLandmarker(
    _ poseLandmarker: PoseLandmarker,
    didFinishDetection result: PoseLandmarkerResult?,
    timestampInMilliseconds: Int,
    error: Error?
  ) {
    if let error {
      drop(timestampInMilliseconds, error)
      return
    }
    let pose = result?.landmarks.first.map { points in
      points.map { [Double($0.x), Double($0.y), Double($0.z), $0.visibility?.doubleValue ?? 0] }
    }
    resultQueue.async { [weak self] in
      guard let self, self.pending[timestampInMilliseconds] != nil else { return }
      self.pending[timestampInMilliseconds]?.pose = pose
      self.pending[timestampInMilliseconds]?.poseArrived = true
      self.emitIfComplete(timestampInMilliseconds)
    }
  }

  /// Runs on resultQueue.
  private func emitIfComplete(_ timestampMs: Int) {
    guard let frame = pending[timestampMs] else { return }
    guard let hands = frame.hands, frame.poseArrived else {
      if pending.count > maxPending, let oldest = pending.keys.min() { pending[oldest] = nil }
      return
    }
    // Older frames never got their other half: they were dropped by one of the landmarkers.
    pending = pending.filter { $0.key > timestampMs }

    let payload: [String: Any] = [
      "timestampMs": timestampMs,
      "imageWidth": frame.width,
      "imageHeight": frame.height,
      "mirrored": frame.mirrored,
      "hands": hands,
      "poseLandmarks": frame.pose ?? NSNull(),
    ]
    DispatchQueue.main.async { [weak self] in self?.onLandmarks(payload) }
  }

  private func drop(_ timestampMs: Int, _ error: Error) {
    resultQueue.async { [weak self] in self?.pending[timestampMs] = nil }
    emitError(error.localizedDescription)
  }

  private func emitError(_ message: String) {
    DispatchQueue.main.async { [weak self] in self?.onError(["message": message]) }
  }

  deinit {
    let session = self.session
    sessionQueue.async { if session.isRunning { session.stopRunning() } }
  }
}
