import { Lottie } from "lottie-react";

/**
 * Thin wrapper around lottie-react v3 so the rest of the app has one
 * consistent API: <LottiePlayer animation={json} className="w-10 h-10" />
 */
const LottiePlayer = ({ animation, className = "", loop = true, speed = 1 }) => (
  <Lottie
    src={animation}
    autoplay
    loop={loop}
    speed={speed}
    className={className}
    aria-hidden="true"
  />
);

export default LottiePlayer;
