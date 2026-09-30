Pod::Spec.new do |s|
  s.name           = 'HandLandmarker'
  s.version        = '0.1.0'
  s.summary        = 'Front camera + MediaPipe Hand and Pose Landmarkers for SeñaFácil'
  s.description    = 'Runs MediaPipe Hand and Pose Landmarkers on the same live camera frames and emits normalized landmarks to JS.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # Same version as the backend (mediapipe==0.10.35).
  s.dependency 'MediaPipeTasksVision', '0.10.35'

  s.source_files = '**/*.{h,m,swift}'
  s.resource_bundles = { 'HandLandmarkerAssets' => ['assets/hand_landmarker.task', 'assets/pose_landmarker_lite.task'] }

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
end
