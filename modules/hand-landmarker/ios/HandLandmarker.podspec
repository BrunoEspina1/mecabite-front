Pod::Spec.new do |s|
  s.name           = 'HandLandmarker'
  s.version        = '0.1.0'
  s.summary        = 'Front camera + MediaPipe Hand Landmarker for SeñaFácil'
  s.description    = 'Runs MediaPipe Hand Landmarker on live camera frames and emits normalized landmarks to JS.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MediaPipeTasksVision', '~> 1.0'

  s.source_files = '**/*.{h,m,swift}'
  s.resource_bundles = { 'HandLandmarkerAssets' => ['assets/hand_landmarker.task'] }

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
end
