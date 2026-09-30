import AVFoundation
import ExpoModulesCore
import MediaPipeTasksVision

/// Camera preview + MediaPipe Hand Landmarker in live-stream mode.
///
/// Frames are rotated to portrait and mirrored for the front camera *before* MediaPipe sees them,
/// so landmarks line up with the (mirrored) preview. `mirrored` in every event reports what
/// MediaPipe actually received, as required by the backend contract.
class HandLandmarkerView: ExpoView, AVCaptureVideoDataOutputSampleBufferDelegate, HandLandmarkerLiveStreamDelegate {
  let onLandmarks = EventDispatcher()
  let onReady = EventDispatcher()
  let onError = EventDispatcher()

  private let session = AVCaptureSession()
  private let previewLayer: AVCaptureVideoPreviewLayer
  private let videoOutput = AVCaptureVideoDataOutput()
  private let sessionQueue = DispatchQueue(label: "handlandmarker.session")
  private let frameQueue = DispatchQueue(label: "handlandmarker.frames")

  private var landmarker: HandLandmarker?
  private var active = false
  private var facing: AVCaptureDevice.Position = .front
  private var numHands = 1
  private var configured = false

  // Written on frameQueue, read in the MediaPipe callback.
  private var frameInfo: (width: Int, height: Int, mirrored: Bool) = (0, 0, false)
  private var lastTimestampMs = -1

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
    frameQueue.async { [weak self] in self?.landmarker = nil }
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

  // MARK: - Frames

  private func makeLandmarker() -> HandLandmarker? {
    guard
      let bundleURL = Bundle(for: HandLandmarkerView.self).url(forResource: "HandLandmarkerAssets", withExtension: "bundle"),
      let modelPath = Bundle(url: bundleURL)?.path(forResource: "hand_landmarker", ofType: "task")
    else {
      emitError("No se encontró el modelo hand_landmarker.task")
      return nil
    }
    let options = HandLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.runningMode = .liveStream
    options.numHands = numHands
    options.minHandDetectionConfidence = 0.5
    options.minHandPresenceConfidence = 0.5
    options.minTrackingConfidence = 0.5
    options.handLandmarkerLiveStreamDelegate = self
    do {
      return try HandLandmarker(options: options)
    } catch {
      emitError("No se pudo iniciar MediaPipe: \(error.localizedDescription)")
      return nil
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    if landmarker == nil { landmarker = makeLandmarker() }
    guard let landmarker else { return }

    // Capture time (presentation timestamp, monotonic host clock), not send time.
    let timestampMs = Int(CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sampleBuffer)) * 1000)
    guard timestampMs > lastTimestampMs else { return }
    lastTimestampMs = timestampMs

    frameInfo = (CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer), connection.isVideoMirrored)

    do {
      let image = try MPImage(pixelBuffer: pixelBuffer, orientation: .up)
      try landmarker.detectAsync(image: image, timestampInMilliseconds: timestampMs)
    } catch {
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
      emitError(error.localizedDescription)
      return
    }
    let info = frameInfo
    var hands: [[String: Any]] = []
    if let result {
      for (index, points) in result.landmarks.enumerated() {
        let category = index < result.handedness.count ? result.handedness[index].first : nil
        hands.append([
          "landmarks": points.map { [Double($0.x), Double($0.y), Double($0.z)] },
          "handedness": [
            "label": category?.categoryName ?? "",
            "score": Double(category?.score ?? 0),
          ],
        ])
      }
    }
    let payload: [String: Any] = [
      "timestampMs": timestampInMilliseconds,
      "imageWidth": info.width,
      "imageHeight": info.height,
      "mirrored": info.mirrored,
      "hands": hands,
    ]
    DispatchQueue.main.async { [weak self] in self?.onLandmarks(payload) }
  }

  private func emitError(_ message: String) {
    DispatchQueue.main.async { [weak self] in self?.onError(["message": message]) }
  }

  deinit {
    let session = self.session
    sessionQueue.async { if session.isRunning { session.stopRunning() } }
  }
}
