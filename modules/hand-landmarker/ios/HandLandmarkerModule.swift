import ExpoModulesCore

public class HandLandmarkerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HandLandmarker")

    View(HandLandmarkerView.self) {
      Events("onLandmarks", "onReady", "onError")

      Prop("active") { (view: HandLandmarkerView, active: Bool) in
        view.setActive(active)
      }

      Prop("facing") { (view: HandLandmarkerView, facing: String) in
        view.setFacing(facing == "back" ? .back : .front)
      }

      Prop("numHands") { (view: HandLandmarkerView, numHands: Int) in
        view.setNumHands(max(1, numHands))
      }
    }
  }
}
